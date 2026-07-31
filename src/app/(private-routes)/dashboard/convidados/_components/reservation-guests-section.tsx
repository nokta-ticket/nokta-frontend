"use client";

import { useEffect, useState } from "react";
import { UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useVenueReservations } from "../../reservas/_hooks/use-venue-reservations";
import { useVenueReservationGuests, useVenueReservationGuestMutations } from "../../reservas/_hooks/use-venue-reservations";
import { todayInTimeZone } from "../../reservas/_lib/timezone";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";

/**
 * Convidado de reserva/mesa (Venue) — nome na lista de quem vai comparecer,
 * sem exigir conta na Nokta nem QR obrigatório. Distinto da seção de
 * convidados de EVENTO (cortesia/bilheteria) na mesma página.
 */
export function ReservationGuestsSection({ orgId }: { orgId: number }) {
  const { data: locations, isLoading: loadingLocations } = useVenueLocations(orgId);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedLocationId !== null || !locations || locations.length === 0) return;
    const main = locations.find((l) => l.isMain) ?? locations[0];
    setSelectedLocationId(main.id);
  }, [locations, selectedLocationId]);

  const selectedLocation = locations?.find((l) => l.id === selectedLocationId) ?? null;
  const today = selectedLocation ? todayInTimeZone(selectedLocation.timezone) : null;

  const { data: reservationsPage, isLoading: loadingReservations } = useVenueReservations(
    orgId,
    selectedLocationId,
    today ? { date: today, limit: 100 } : {},
  );
  const reservations = reservationsPage?.data ?? [];
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedReservationId((prev) => {
      if (prev !== null && reservations.some((r) => r.id === prev)) return prev;
      return reservations[0]?.id ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations]);

  const { data: guests, isLoading: loadingGuests } = useVenueReservationGuests(orgId, selectedReservationId);
  const mutations = useVenueReservationGuestMutations(orgId, selectedReservationId ?? -1);

  const [nameInput, setNameInput] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || selectedReservationId === null) return;
    try {
      await mutations.add.mutateAsync({ name: nameInput.trim() });
      setNameInput("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível adicionar o convidado."));
    }
  }

  async function handleRemove(guestId: number) {
    try {
      await mutations.remove.mutateAsync(guestId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o convidado."));
    }
  }

  async function handleCheckIn(guestId: number) {
    try {
      await mutations.checkIn.mutateAsync(guestId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível confirmar a chegada."));
    }
  }

  if (loadingLocations) return <BlockSkeleton className="h-64" />;

  if (!locations || locations.length === 0) {
    return (
      <EmptyState
        title="Nenhuma unidade cadastrada"
        description="Cadastre uma unidade do seu espaço para poder montar listas de convidados de reserva."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {locations.length > 1 ? (
          <Select
            value={selectedLocationId ? String(selectedLocationId) : undefined}
            onValueChange={(v) => {
              setSelectedLocationId(Number(v));
              setSelectedReservationId(null);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.nome} {loc.isMain ? "· Principal" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {loadingReservations ? null : reservations.length > 0 ? (
          <Select
            value={selectedReservationId ? String(selectedReservationId) : undefined}
            onValueChange={(v) => setSelectedReservationId(Number(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Reserva de hoje" />
            </SelectTrigger>
            <SelectContent>
              {reservations.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.customerName} · {r.partySize} pessoa{r.partySize > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {loadingReservations ? (
        <BlockSkeleton className="h-64" />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="Nenhuma reserva hoje"
          description="Assim que houver uma reserva para hoje nesta unidade, você poderá montar a lista de convidados dela aqui."
        />
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nome do convidado"
              className="w-64"
            />
            <Button type="submit" disabled={!nameInput.trim() || mutations.add.isPending}>
              <UserPlus size={16} /> Adicionar
            </Button>
          </form>

          {loadingGuests ? (
            <BlockSkeleton className="h-32" />
          ) : !guests || guests.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum convidado adicionado a esta reserva ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>
                      {g.checkedInAt ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Chegou</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Aguardando</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      {!g.checkedInAt ? (
                        <Button variant="outline" size="sm" onClick={() => handleCheckIn(g.id)}>
                          <Check size={14} /> Chegou
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(g.id)}>
                        <X size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
