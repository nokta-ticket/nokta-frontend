"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { guestsApi, type Guest } from "@/services/guests";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { InviteGuestDialog } from "./_components/invite-guest-dialog";
import { ReservationGuestsSection } from "./_components/reservation-guests-section";
import { VipListsSection } from "./_components/vip-lists-section";

type EventoOption = { id: number; nome: string; data?: string };
type Mode = "vip" | "evento" | "reserva";

// UserTicketStatus: 1=NOT_VALIDATED 2=VALIDATED 3=IN_RESALE 4=TRANSFERRED
const STATUS_META: Record<number, { label: string; tone: Tone }> = {
  1: { label: "Convidado", tone: "warning" },
  2: { label: "Compareceu", tone: "success" },
  3: { label: "Em revenda", tone: "neutral" },
  4: { label: "Transferido", tone: "info" },
};

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Convidados (GUEST_LISTS). Três modos, sem relação entre si:
 * - Lista VIP: lista de nomes com entrada gratuita, divulgada por link
 *   (/vip/<evento>); quem coloca o nome recebe o ingresso na conta — ver
 *   services/vip-lists.ts.
 * - Cortesias: cortesia de bilheteria (UserTicket real, exige conta Nokta) —
 *   ver services/guests.ts / tickets/guests no backend.
 * - Reserva: lista de nomes de uma reserva/mesa do Venue, sem exigir conta
 *   nem QR — ver services/venue-reservations.ts (listGuests/addGuest/...) /
 *   venue/reservations no backend. Só aparece pra quem tem o módulo Venue
 *   ativo.
 */
export default function ConvidadosPage() {
  const { currentOrg, loadingOrgs, activeModuleKeys } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const hasVenue = activeModuleKeys.includes("venue");
  const [mode, setMode] = useState<Mode>("vip");

  const [eventos, setEventos] = useState<EventoOption[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");

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
        const res = await api.get<{ data: (EventoOption & { status: number })[] }>("/produtor/eventos", { params: { organizationId: currentOrg.id, limit: 100 } });
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? guests.filter((g) => `${g.guest.nome} ${g.guest.email}`.toLowerCase().includes(q)) : guests;
  }, [guests, search]);

  const stats = useMemo(() => ({ total: guests.length, compareceram: guests.filter((g) => g.status === 2).length, qrPendentes: guests.filter((g) => !g.qrSentAt).length }), [guests]);

  const modeSwitcher = (
    <SegmentedControl
      value={mode}
      onChange={setMode}
      options={[
        { value: "vip" as const, label: "Lista VIP", icon: "crown" as const },
        { value: "evento" as const, label: "Cortesias", icon: "ticket" as const },
        ...(hasVenue ? [{ value: "reserva" as const, label: "Reserva", icon: "chair" as const }] : []),
      ]}
    />
  );

  const eventSelect = (
    <NativeSelect aria-label="Evento" value={selectedEventId ?? ""} onChange={(e) => setSelectedEventId(Number(e.target.value))} className="flex-1 sm:w-64 sm:flex-none">
      {eventos.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.nome}
        </option>
      ))}
    </NativeSelect>
  );

  const inviteButton = (
    <Button leftIcon="user-plus" onClick={() => (currentOrg ? setInviteOpen(true) : guard(() => undefined))} disabled={Boolean(currentOrg) && selectedEventId === null}>
      Convidar
    </Button>
  );

  if (loadingOrgs || (mode !== "reserva" && loadingEventos)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Convidados" actions={modeSwitcher} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Convidados" actions={inviteButton} />
        <EmptyState icon="user-plus" title="Nenhum convidado ainda" description="Crie seu workspace para começar a convidar pessoas." action={inviteButton} />
      </div>
    );
  }

  if (mode === "reserva") {
    return (
      <div className="space-y-6">
        <PageHeader title="Convidados" description="Monte a lista de quem vai comparecer numa reserva — sem exigir conta na Nokta." actions={modeSwitcher} />
        <ReservationGuestsSection orgId={currentOrg.id} />
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Convidados" actions={modeSwitcher} />
        <EmptyState icon="calendar-plus" title="Nenhum evento disponível" description="Crie um evento (mesmo em rascunho) para montar a lista VIP ou enviar cortesias." />
      </div>
    );
  }

  if (mode === "vip") {
    const selected = eventos.find((ev) => ev.id === selectedEventId);
    return (
      <div className="space-y-6">
        <PageHeader title="Convidados" description="Divulgue o link da lista VIP e veja quem colocou o nome. Cada pessoa recebe o ingresso com QR code na conta." actions={modeSwitcher} />
        <div className="flex items-center gap-2">{eventSelect}</div>
        {selectedEventId !== null ? <VipListsSection key={selectedEventId} eventId={selectedEventId} eventDate={selected?.data} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convidados"
        description="Cortesias do evento: o convidado recebe o ingresso com QR code na própria conta."
        actions={
          <>
            {modeSwitcher}
            {inviteButton}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Convidados" icon="users" value={loadingGuests ? null : stats.total} hint="Neste evento" />
        <StatCard label="Compareceram" icon="check-circle" value={loadingGuests ? null : stats.compareceram} hint={stats.total > 0 ? `${Math.round((stats.compareceram / stats.total) * 100)}% dos convidados` : "Ninguém validou ainda"} />
        <StatCard label="QR pendente" icon="qr" value={loadingGuests ? null : stats.qrPendentes} hint="Ainda não enviado" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou e-mail" className="w-full sm:max-w-xl sm:flex-1" />
        <div className="flex items-center gap-2">
          {eventSelect}
          <Button variant="subtle" size="icon" aria-label="Atualizar lista" title="Atualizar" onClick={() => selectedEventId !== null && loadGuests(selectedEventId)}>
            <Icon name="refresh" size={14} className={cn(loadingGuests && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loadingGuests ? (
        <Skeleton className="h-64 rounded-card" />
      ) : guests.length === 0 ? (
        <EmptyState icon="user-plus" title="Nenhum convidado neste evento" description="Convide alguém digitando o e-mail da conta Nokta dele." action={<Button leftIcon="user-plus" onClick={() => setInviteOpen(true)}>Convidar</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" title="Ninguém com esse nome" description="Tente outro termo ou limpe a busca." action={<Button variant="outline" onClick={() => setSearch("")}>Limpar busca</Button>} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Convidado</DataTableHeadCell>
                  <DataTableHeadCell>E-mail</DataTableHeadCell>
                  <DataTableHeadCell>Convidado em</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell>QR code</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {filtered.map((g, i) => {
                  const st = STATUS_META[g.status] ?? { label: "Desconhecido", tone: "neutral" as const };
                  return (
                    <DataTableRow key={g.userTicketId} index={i}>
                      <DataTableCell className="font-semibold">{g.guest.nome}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">{g.guest.email}</DataTableCell>
                      <DataTableCell className="tnum">{fmtDateTime(g.createdAt)}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={g.qrSentAt ? "success" : "neutral"} dot={false}>
                          <Icon name={g.qrSentAt ? "check" : "clock"} size={10} />
                          {g.qrSentAt ? "Enviado" : "Pendente"}
                        </StatusBadge>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {filtered.map((g, i) => {
                const st = STATUS_META[g.status] ?? { label: "Desconhecido", tone: "neutral" as const };
                return <MobileCard key={g.userTicketId} index={i} title={g.guest.nome} subtitle={g.guest.email} badge={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>} meta={[{ label: "Convidado em", value: fmtDateTime(g.createdAt), num: true }, { label: "QR code", value: g.qrSentAt ? "Enviado" : "Pendente" }]} />;
              })}
            </MobileCardList>
          }
        />
      )}

      {selectedEventId !== null ? <InviteGuestDialog eventId={selectedEventId} eventName={eventos.find((e) => e.id === selectedEventId)?.nome} open={inviteOpen} onOpenChange={setInviteOpen} onInvited={() => loadGuests(selectedEventId)} /> : null}
    </div>
  );
}
