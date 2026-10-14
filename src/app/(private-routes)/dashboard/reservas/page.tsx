"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueReservation } from "@/services/venue-reservations";
import { useUrlTab } from "../_hooks/use-url-tab";
import { LocationGate, type LocationGateContext } from "../operacao/_components/location-gate";
import { LocationSelect } from "../operacao/_components/location-select";
import { AgendaTab } from "./_components/agenda-tab";
import { CancelWithReasonDialog } from "./_components/cancel-with-reason-dialog";
import { FilaTab } from "./_components/fila-tab";
import { ListaTab } from "./_components/lista-tab";
import { ReservationDetailSheet } from "./_components/reservation-detail-sheet";
import { ReservationFormDialog } from "./_components/reservation-form-dialog";
import { SeatReservationDialog } from "./_components/seat-reservation-dialog";
import { WaitlistFormDialog } from "./_components/waitlist-form-dialog";
import { useVenueReservationMutations, useVenueReservationsSummary } from "./_hooks/use-venue-reservations";
import { todayInTimeZone } from "./_lib/timezone";

const TITLE = "Reservas";
const TABS = ["agenda", "lista", "fila"] as const;
type TabKey = (typeof TABS)[number];

export default function VenueReservasPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title={TITLE} />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <LocationGate title={TITLE}>{(ctx) => <ReservasPageContent {...ctx} />}</LocationGate>
    </Suspense>
  );
}

function ReservasPageContent({ orgId, locationId, location, locations, setLocationId }: LocationGateContext) {
  // `?tab=fila` é o alias canônico de /dashboard/fila-espera.
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "agenda");
  const [date, setDate] = useState<string>(() => todayInTimeZone(location.timezone));

  const [createOpen, setCreateOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [seatReservation, setSeatReservation] = useState<VenueReservation | null>(null);
  const [editReservation, setEditReservation] = useState<VenueReservation | null>(null);
  const [cancelReservation, setCancelReservation] = useState<VenueReservation | null>(null);

  // Troca de unidade: volta pro "hoje" no fuso da nova unidade.
  useEffect(() => {
    setDate(todayInTimeZone(location.timezone));
  }, [location.id, location.timezone]);

  const { cancel } = useVenueReservationMutations(orgId, locationId);
  const { data: summary, isLoading: loadingSummary } = useVenueReservationsSummary(orgId, locationId, date);
  const isToday = date === todayInTimeZone(location.timezone);
  const arrived = summary ? summary.seated + summary.completed : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        actions={
          <>
            <LocationSelect locations={locations} value={locationId} onChange={setLocationId} className="w-44" />
            <Button variant="outline" leftIcon="user-plus" onClick={() => setWaitlistOpen(true)}>
              Adicionar à fila
            </Button>
            <Button leftIcon="calendar-plus" onClick={() => setCreateOpen(true)}>
              Nova reserva
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={isToday ? "Reservas hoje" : "Reservas no dia"} icon="calendar-check" value={loadingSummary ? null : (summary?.totalReservations ?? 0)} hint={summary ? `${summary.expectedPeople} ${summary.expectedPeople === 1 ? "pessoa esperada" : "pessoas esperadas"}` : undefined} />
        <StatCard label="Já chegaram" icon="door" value={loadingSummary ? null : (arrived ?? 0)} hint={summary ? `${summary.confirmed} confirmadas · ${summary.pending} pendentes` : undefined} />
        <StatCard label="Fila de espera" icon="users" value={loadingSummary ? null : (summary?.waitlistCount ?? 0)} hint={summary ? (summary.averageWaitMinutes !== null ? `espera média de ${summary.averageWaitMinutes} min` : summary.noShow > 0 ? `${summary.noShow} no-show no dia` : "ninguém esperando") : undefined} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="fila">Fila de espera</TabsTrigger>
          </TabsList>
          {tab === "agenda" ? (
            <div className="flex items-center gap-2">
              <Input type="date" aria-label="Data da agenda" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
              {!isToday ? (
                <Button variant="subtle" size="sm" onClick={() => setDate(todayInTimeZone(location.timezone))}>
                  Hoje
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <TabsContent value="agenda">
          <AgendaTab orgId={orgId} locationId={locationId} location={location} date={date} onOpenDetail={setDetailId} onSeat={setSeatReservation} onEdit={setEditReservation} onCancel={setCancelReservation} onAddWaitlist={() => setWaitlistOpen(true)} />
        </TabsContent>
        <TabsContent value="lista">
          <ListaTab orgId={orgId} locationId={locationId} location={location} onOpenDetail={setDetailId} />
        </TabsContent>
        <TabsContent value="fila">
          <FilaTab orgId={orgId} locationId={locationId} onAdd={() => setWaitlistOpen(true)} />
        </TabsContent>
      </Tabs>

      <ReservationFormDialog orgId={orgId} locationId={locationId} location={location} open={createOpen} onOpenChange={setCreateOpen} />
      <WaitlistFormDialog orgId={orgId} locationId={locationId} open={waitlistOpen} onOpenChange={setWaitlistOpen} />

      <ReservationDetailSheet orgId={orgId} locationId={locationId} location={location} reservationId={detailId} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} />

      <SeatReservationDialog orgId={orgId} locationId={locationId} reservation={seatReservation} open={seatReservation !== null} onOpenChange={(v) => !v && setSeatReservation(null)} />

      <ReservationFormDialog orgId={orgId} locationId={locationId} location={location} reservation={editReservation} open={editReservation !== null} onOpenChange={(v) => !v && setEditReservation(null)} />

      <CancelWithReasonDialog
        open={cancelReservation !== null}
        onOpenChange={(v) => !v && setCancelReservation(null)}
        title="Cancelar reserva"
        loading={cancel.isPending}
        onConfirm={(reason) =>
          cancelReservation &&
          cancel.mutate(
            { reservationId: cancelReservation.id, payload: { reason } },
            {
              onSuccess: () => {
                toast.success("Reserva cancelada.");
                setCancelReservation(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
            },
          )
        }
      />
    </div>
  );
}
