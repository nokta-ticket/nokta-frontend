"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganizations } from "@/context/OrganizationContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { guestsApi, type Guest } from "@/services/guests";
import { InviteGuestDialog } from "./_components/invite-guest-dialog";

type EventoOption = { id: number; nome: string };

// UserTicketStatus: 1=NOT_VALIDATED 2=VALIDATED 3=IN_RESALE 4=TRANSFERRED
const STATUS_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: "Convidado", className: "bg-amber-100 text-amber-700" },
  2: { label: "Compareceu", className: "bg-emerald-100 text-emerald-700" },
  3: { label: "Em revenda", className: "bg-gray-100 text-gray-600" },
  4: { label: "Transferido", className: "bg-blue-100 text-blue-600" },
};

/**
 * Convidados (GUEST_LISTS) — cortesia de evento. Convidado de reserva/mesa
 * (Venue) fica fora do escopo desta tela por enquanto (ver plano
 * playful-jingling-wall.md) — só cobre o fluxo de eventos com bilheteria.
 */
export default function ConvidadosPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { guard } = useRequireWorkspace();

  const [eventos, setEventos] = useState<EventoOption[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!currentOrg) {
      setEventos([]);
      setLoadingEventos(false);
      return;
    }
    let active = true;
    setLoadingEventos(true);
    (async () => {
      try {
        // Sem filtro de status na query: rascunho (1) também é convidável —
        // o produtor pode montar a lista de convidados antes de publicar o
        // evento pro público. GuestsService (backend) não checa status
        // nenhum, só bloqueia por tempo (<1h do evento) — só filtramos aqui
        // cancelado/finalizado, que nunca fazem sentido pra convidar.
        const res = await api.get<{ data: (EventoOption & { status: number })[] }>("/produtor/eventos", {
          params: { organizationId: currentOrg.id, limit: 100 },
        });
        if (!active) return;
        const CANCELLED = 3;
        const FINISHED = 4;
        const list = res.data.data.filter((ev) => ev.status !== CANCELLED && ev.status !== FINISHED);
        setEventos(list);
        setSelectedEventId((prev) => prev ?? list[0]?.id ?? null);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Não foi possível carregar seus eventos."));
      } finally {
        if (active) setLoadingEventos(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentOrg]);

  const loadGuests = async (eventId: number) => {
    setLoadingGuests(true);
    try {
      const list = await guestsApi.list(eventId);
      setGuests(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível carregar os convidados."));
    } finally {
      setLoadingGuests(false);
    }
  };

  useEffect(() => {
    if (selectedEventId === null) {
      setGuests([]);
      return;
    }
    loadGuests(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  if (loadingOrgs || loadingEventos) {
    return (
      <PageContainer>
        <PageHeader title="Convidados" description="Envie cortesias para os seus eventos." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader
          title="Convidados"
          description="Envie cortesias para os seus eventos."
          actions={
            <Button onClick={() => guard(() => {})}>
              <UserPlus size={16} /> Convidar
            </Button>
          }
        />
        <EmptyState
          title="Nenhum convidado ainda"
          description="Crie seu workspace para começar a convidar pessoas para os seus eventos."
          actionLabel="Convidar"
          onAction={() => guard(() => {})}
        />
      </PageContainer>
    );
  }

  if (eventos.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Convidados" description="Envie cortesias para os seus eventos." />
        <EmptyState
          title="Nenhum evento disponível"
          description="Crie um evento (mesmo em rascunho) para poder convidar pessoas com cortesia."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Convidados"
        description="Envie cortesias para os seus eventos — o convidado recebe o ingresso na própria conta, com QR code."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedEventId ? String(selectedEventId) : undefined}
              onValueChange={(v) => setSelectedEventId(Number(v))}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                {eventos.map((ev) => (
                  <SelectItem key={ev.id} value={String(ev.id)}>
                    {ev.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setInviteOpen(true)} disabled={selectedEventId === null}>
              <UserPlus size={16} /> Convidar
            </Button>
          </div>
        }
      />

      {loadingGuests ? (
        <BlockSkeleton className="h-64" />
      ) : guests.length === 0 ? (
        <EmptyState
          title="Nenhum convidado neste evento"
          description="Convide alguém digitando o e-mail da conta Nokta dele."
          actionLabel="Convidar"
          onAction={() => setInviteOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Convidado</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QR enviado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((g) => {
              const badge = STATUS_BADGE[g.status] ?? { label: "—", className: "bg-gray-100 text-gray-600" };
              return (
                <TableRow key={g.userTicketId}>
                  <TableCell>{g.guest.nome}</TableCell>
                  <TableCell>{g.guest.email}</TableCell>
                  <TableCell>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell>{g.qrSentAt ? "Sim" : "Ainda não"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {selectedEventId !== null ? (
        <InviteGuestDialog
          eventId={selectedEventId}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={() => loadGuests(selectedEventId)}
        />
      ) : null}
    </PageContainer>
  );
}
