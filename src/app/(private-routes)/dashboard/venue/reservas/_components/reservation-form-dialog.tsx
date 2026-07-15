"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatPhone, normalizeDigits } from "@/lib/br-data";
import {
  VENUE_RESERVATION_SOURCE_LABEL,
  type VenueReservation,
  type VenueReservationSource,
} from "@/services/venue-reservations";
import { useVenueAreas } from "../../operacao/_hooks/use-venue-areas-tables";
import { useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { zonedWallClockToUtcIso, todayInTimeZone, formatInTimeZone } from "../_lib/timezone";
import { AvailabilityPicker } from "./availability-picker";

interface LocationTz {
  timezone: string;
  defaultReservationDurationMinutes: number;
}

export function ReservationFormDialog({
  orgId,
  locationId,
  location,
  reservation,
  open,
  onOpenChange,
  onSaved,
}: {
  orgId: number;
  locationId: number;
  location: LocationTz;
  reservation?: VenueReservation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (r: VenueReservation) => void;
}) {
  const { data: areas } = useVenueAreas(orgId, locationId);
  const { create, update } = useVenueReservationMutations(orgId, locationId);
  const isEdit = !!reservation;

  const [customerName, setCustomerName] = useState("");
  const [customerPhoneDisplay, setCustomerPhoneDisplay] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [durationMinutes, setDurationMinutes] = useState(String(location.defaultReservationDurationMinutes));
  const [source, setSource] = useState<VenueReservationSource>("PHONE");
  const [preferredAreaId, setPreferredAreaId] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [confirmedNow, setConfirmedNow] = useState(false);
  const [tableIds, setTableIds] = useState<number[]>([]);
  const [primaryTableId, setPrimaryTableId] = useState<number | undefined>();

  // Radix só chama onOpenChange em fechamentos internos — preencher/resetar reage a `open`.
  useEffect(() => {
    if (!open) return;
    if (reservation) {
      setCustomerName(reservation.customerName);
      setCustomerPhoneDisplay(formatPhone(reservation.customerPhone));
      setCustomerEmail(reservation.customerEmail ?? "");
      setPartySize(String(reservation.partySize));
      setDate(formatInTimeZone(reservation.startAt, location.timezone, "YYYY-MM-DD"));
      setTime(formatInTimeZone(reservation.startAt, location.timezone, "HH:mm"));
      const durMin = Math.round(
        (new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / 60000,
      );
      setDurationMinutes(String(durMin));
      setSource(reservation.source);
      setPreferredAreaId(reservation.preferredAreaId ? String(reservation.preferredAreaId) : "");
      setNotes(reservation.notes ?? "");
      setInternalNotes(reservation.internalNotes ?? "");
      setTableIds(reservation.tables.map((t) => t.tableId));
      setPrimaryTableId(reservation.tables.find((t) => t.isPrimary)?.tableId);
      setConfirmedNow(false);
    } else {
      setCustomerName("");
      setCustomerPhoneDisplay("");
      setCustomerEmail("");
      setPartySize("2");
      setDate(todayInTimeZone(location.timezone));
      setTime("19:00");
      setDurationMinutes(String(location.defaultReservationDurationMinutes));
      setSource("PHONE");
      setPreferredAreaId("");
      setNotes("");
      setInternalNotes("");
      setTableIds([]);
      setPrimaryTableId(undefined);
      setConfirmedNow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation?.id]);

  const startAtIso = date && time ? zonedWallClockToUtcIso(date, time, location.timezone) : null;
  const endAtIso =
    startAtIso && durationMinutes
      ? new Date(new Date(startAtIso).getTime() + Number(durationMinutes) * 60000).toISOString()
      : null;

  const saving = create.isPending || update.isPending;
  const canSubmit = !!customerName.trim() && !!customerPhoneDisplay.trim() && !!startAtIso && !!endAtIso && Number(partySize) > 0;

  const handleSubmit = () => {
    if (!startAtIso || !endAtIso) return;
    const customerPhone = normalizeDigits(customerPhoneDisplay);

    if (isEdit && reservation) {
      update.mutate(
        {
          reservationId: reservation.id,
          payload: {
            customerName,
            customerPhone,
            customerEmail: customerEmail.trim() || undefined,
            partySize: Number(partySize),
            startAt: startAtIso,
            endAt: endAtIso,
            source,
            preferredAreaId: preferredAreaId ? Number(preferredAreaId) : undefined,
            notes: notes.trim() || undefined,
            internalNotes: internalNotes.trim() || undefined,
            version: reservation.version,
          },
        },
        {
          onSuccess: (r) => {
            toast.success(`Reserva ${r.publicCode} atualizada.`);
            onOpenChange(false);
            onSaved?.(r);
          },
          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a reserva.")),
        },
      );
    } else {
      create.mutate(
        {
          customerName,
          customerPhone,
          customerEmail: customerEmail.trim() || undefined,
          partySize: Number(partySize),
          startAt: startAtIso,
          endAt: endAtIso,
          source,
          preferredAreaId: preferredAreaId ? Number(preferredAreaId) : undefined,
          tableIds: tableIds.length > 0 ? tableIds : undefined,
          primaryTableId,
          notes: notes.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          confirmed: confirmedNow,
        },
        {
          onSuccess: (r) => {
            toast.success(`Reserva ${r.publicCode} criada.`);
            onOpenChange(false);
            onSaved?.(r);
          },
          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a reserva.")),
        },
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Editar reserva ${reservation?.publicCode}` : "Nova reserva"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="res-nome">Nome do cliente</Label>
              <Input id="res-nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-telefone">Telefone</Label>
              <Input
                id="res-telefone"
                value={customerPhoneDisplay}
                onChange={(e) => setCustomerPhoneDisplay(formatPhone(e.target.value))}
                placeholder="(11) 99999-8888"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-email">E-mail (opcional)</Label>
            <Input id="res-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="res-pessoas">Pessoas</Label>
              <Input id="res-pessoas" type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-data">Data</Label>
              <Input id="res-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-hora">Horário</Label>
              <Input id="res-hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-duracao">Duração (min)</Label>
              <Input
                id="res-duracao"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={source} onValueChange={(v) => setSource(v as VenueReservationSource)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(VENUE_RESERVATION_SOURCE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Área preferida (opcional)</Label>
              <Select value={preferredAreaId || "none"} onValueChange={(v) => setPreferredAreaId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sem preferência" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem preferência</SelectItem>
                  {(areas ?? []).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {startAtIso && endAtIso ? (
            <div className="space-y-2 rounded-xl border border-black/10 p-3">
              <Label>Mesas (opcional)</Label>
              <AvailabilityPicker
                orgId={orgId}
                locationId={locationId}
                startAt={startAtIso}
                endAt={endAtIso}
                partySize={Number(partySize) || 1}
                areaId={preferredAreaId ? Number(preferredAreaId) : undefined}
                reservationId={reservation?.id}
                selectedTableIds={tableIds}
                primaryTableId={primaryTableId}
                onChange={(ids, primary) => {
                  setTableIds(ids);
                  setPrimaryTableId(primary);
                }}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="res-obs">Observações do cliente (opcional)</Label>
            <Textarea id="res-obs" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-obs-internas">Observações internas (opcional)</Label>
            <Textarea id="res-obs-internas" rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>

          {!isEdit ? (
            <div className="flex items-center gap-2">
              <Switch checked={confirmedNow} onCheckedChange={setConfirmedNow} id="res-confirmada" />
              <Label htmlFor="res-confirmada">Criar já como confirmada</Label>
            </div>
          ) : null}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button disabled={saving || !canSubmit} onClick={handleSubmit}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
