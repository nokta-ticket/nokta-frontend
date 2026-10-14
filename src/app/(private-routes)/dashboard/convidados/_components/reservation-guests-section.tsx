"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useVenueReservationGuestMutations, useVenueReservationGuests, useVenueReservations } from "../../reservas/_hooks/use-venue-reservations";
import { todayInTimeZone } from "../../reservas/_lib/timezone";

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

  const { data: reservationsPage, isLoading: loadingReservations } = useVenueReservations(orgId, selectedLocationId, today ? { date: today, limit: 100 } : {});
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

  if (loadingLocations) return <Skeleton className="h-64 rounded-card" />;

  if (!locations || locations.length === 0) {
    return <EmptyState icon="store" title="Nenhuma unidade cadastrada" description="Cadastre uma unidade do seu espaço para poder montar listas de convidados de reserva." />;
  }

  const arrived = (guests ?? []).filter((g) => g.checkedInAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {locations.length > 1 ? (
          <NativeSelect
            aria-label="Unidade"
            value={selectedLocationId ?? ""}
            onChange={(e) => {
              setSelectedLocationId(Number(e.target.value));
              setSelectedReservationId(null);
            }}
            className="sm:w-56"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.nome} {loc.isMain ? "· Principal" : ""}
              </option>
            ))}
          </NativeSelect>
        ) : null}

        {loadingReservations ? null : reservations.length > 0 ? (
          <NativeSelect aria-label="Reserva de hoje" value={selectedReservationId ?? ""} onChange={(e) => setSelectedReservationId(Number(e.target.value))} className="sm:w-72">
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.customerName} · {r.partySize} pessoa{r.partySize > 1 ? "s" : ""}
              </option>
            ))}
          </NativeSelect>
        ) : null}
      </div>

      {loadingReservations ? (
        <Skeleton className="h-64 rounded-card" />
      ) : reservations.length === 0 ? (
        <EmptyState icon="chair" title="Nenhuma reserva hoje" description="Assim que houver uma reserva para hoje nesta unidade, você poderá montar a lista de convidados dela aqui." />
      ) : (
        <Card className="fade-up">
          <CardHeader>
            <div>
              <CardTitle>Lista da reserva</CardTitle>
              <p className="mt-1 text-body text-muted-foreground">{guests && guests.length > 0 ? `${arrived} de ${guests.length} chegaram` : "Adicione quem vai comparecer."}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label="Nome do convidado" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nome do convidado" className="sm:max-w-sm" />
              <Button type="submit" leftIcon="user-plus" loading={mutations.add.isPending} disabled={!nameInput.trim()} className="h-11 md:h-10">
                Adicionar
              </Button>
            </form>

            {loadingGuests ? (
              <RowsSkeleton rows={3} />
            ) : !guests || guests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convidado adicionado a esta reserva ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {guests.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-3">
                    <StatusBadge tone={g.checkedInAt ? "success" : "warning"}>{g.checkedInAt ? "Chegou" : "Aguardando"}</StatusBadge>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{g.name}</span>
                    {!g.checkedInAt ? (
                      <Button variant="outline" size="sm" leftIcon="check" onClick={() => handleCheckIn(g.id)} loading={mutations.checkIn.isPending}>
                        Chegou
                      </Button>
                    ) : null}
                    <Button variant="subtle" size="icon-sm" aria-label={`Remover ${g.name}`} title="Remover" className="hover:bg-danger-bg hover:text-danger" onClick={() => handleRemove(g.id)}>
                      <Icon name="close" size={13} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
