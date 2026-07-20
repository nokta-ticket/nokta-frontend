"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueReservation } from "@/services/venue-reservations";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { useVenueLocations } from "../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../operacao/_components/onboarding-location";
import { useVenueReservationMutations, useVenueReservationsSummary } from "./_hooks/use-venue-reservations";
import { todayInTimeZone } from "./_lib/timezone";
import { SummaryBar } from "./_components/summary-bar";
import { AgendaTab } from "./_components/agenda-tab";
import { ListaTab } from "./_components/lista-tab";
import { FilaTab } from "./_components/fila-tab";
import { ReservationFormDialog } from "./_components/reservation-form-dialog";
import { ReservationDetailSheet } from "./_components/reservation-detail-sheet";
import { SeatReservationDialog } from "./_components/seat-reservation-dialog";
import { CancelWithReasonDialog } from "./_components/cancel-with-reason-dialog";
import { WaitlistFormDialog } from "./_components/waitlist-form-dialog";

type TabKey = "agenda" | "lista" | "fila";

export default function VenueReservasPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const [tab, setTab] = useState<TabKey>("agenda");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [seatReservation, setSeatReservation] = useState<VenueReservation | null>(null);
  const [editReservation, setEditReservation] = useState<VenueReservation | null>(null);
  const [cancelReservation, setCancelReservation] = useState<VenueReservation | null>(null);

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: locations } = useVenueLocations(venueActive ? orgId : null);

  useEffect(() => {
    setSelectedLocationId(null);
    setDate(null);
  }, [orgId]);

  useEffect(() => {
    if (selectedLocationId !== null || !locations || locations.length === 0) return;
    const main = locations.find((l) => l.isMain) ?? locations[0];
    setSelectedLocationId(main.id);
  }, [locations, selectedLocationId]);

  const location = locations?.find((l) => l.id === selectedLocationId) ?? null;

  useEffect(() => {
    if (location && date === null) setDate(todayInTimeZone(location.timezone));
  }, [location, date]);

  const { cancel } = useVenueReservationMutations(orgId ?? -1, selectedLocationId ?? -1);
  const { data: summary } = useVenueReservationsSummary(orgId, selectedLocationId, date ?? "");

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Reservas" description="Organize reservas, confirmações, chegadas e fila de espera." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader title="Reservas" description="Organize reservas, confirmações, chegadas e fila de espera." />
        <EmptyState
          title="Venue não está ativo"
          description="O módulo Venue precisa estar ativo nesta organização para gerenciar reservas."
        />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Reservas" description="Organize reservas, confirmações, chegadas e fila de espera." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId || !location || date === null) {
    return (
      <PageContainer>
        <PageHeader title="Reservas" description="Organize reservas, confirmações, chegadas e fila de espera." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reservas"
        description="Organize reservas, confirmações, chegadas e fila de espera."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {locations && locations.length > 1 ? (
              <Select value={String(selectedLocationId)} onValueChange={(v) => setSelectedLocationId(Number(v))}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Unidade" /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.nome} {loc.isMain ? "· Principal" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button variant="outline" onClick={() => setWaitlistOpen(true)}>
              <Plus size={16} /> Adicionar à fila
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Nova reserva
            </Button>
          </div>
        }
      />

      <SummaryBar summary={summary} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="fila">Fila de espera</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda">
          <AgendaTab
            orgId={orgId}
            locationId={selectedLocationId}
            location={location}
            date={date}
            onOpenDetail={setDetailId}
            onSeat={setSeatReservation}
            onEdit={setEditReservation}
            onCancel={setCancelReservation}
          />
        </TabsContent>
        <TabsContent value="lista">
          <ListaTab orgId={orgId} locationId={selectedLocationId} location={location} onOpenDetail={setDetailId} />
        </TabsContent>
        <TabsContent value="fila">
          <FilaTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
      </Tabs>

      <ReservationFormDialog
        orgId={orgId}
        locationId={selectedLocationId}
        location={location}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <WaitlistFormDialog orgId={orgId} locationId={selectedLocationId} open={waitlistOpen} onOpenChange={setWaitlistOpen} />

      <ReservationDetailSheet
        orgId={orgId}
        locationId={selectedLocationId}
        location={location}
        reservationId={detailId}
        open={detailId !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
      />

      <SeatReservationDialog
        orgId={orgId}
        locationId={selectedLocationId}
        reservation={seatReservation}
        open={seatReservation !== null}
        onOpenChange={(v) => !v && setSeatReservation(null)}
      />

      <ReservationFormDialog
        orgId={orgId}
        locationId={selectedLocationId}
        location={location}
        reservation={editReservation}
        open={editReservation !== null}
        onOpenChange={(v) => !v && setEditReservation(null)}
      />

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
    </PageContainer>
  );
}
