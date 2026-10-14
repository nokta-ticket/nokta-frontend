"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone, normalizeDigits } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { VENUE_RESERVATION_SOURCE_LABEL, type VenueReservation, type VenueReservationSource } from "@/services/venue-reservations";
import { useVenueAreas } from "../../operacao/_hooks/use-venue-areas-tables";
import { useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone, todayInTimeZone, zonedWallClockToUtcIso } from "../_lib/timezone";
import { AvailabilityPicker } from "./availability-picker";

interface LocationTz {
  timezone: string;
  defaultReservationDurationMinutes: number;
}

type Step = "dados" | "mesas";

const SOURCE_OPTIONS = (Object.keys(VENUE_RESERVATION_SOURCE_LABEL) as VenueReservationSource[]).map((value) => ({ value, label: VENUE_RESERVATION_SOURCE_LABEL[value] }));

/**
 * Nova reserva / edição em duas etapas: dados do cliente e horário → mesas
 * (disponibilidade real naquele horário). Mesas são entidade separada no
 * backend (PUT /tables): na edição, o update dos dados vem primeiro e as
 * mesas encadeiam usando a `version` já incrementada.
 */
export function ReservationFormDialog({ orgId, locationId, location, reservation, open, onOpenChange, onSaved }: { orgId: number; locationId: number; location: LocationTz; reservation?: VenueReservation | null; open: boolean; onOpenChange: (v: boolean) => void; onSaved?: (r: VenueReservation) => void }) {
  const { data: areas } = useVenueAreas(orgId, locationId);
  const { create, update, setTables } = useVenueReservationMutations(orgId, locationId);
  const isEdit = !!reservation;

  const [step, setStep] = useState<Step>("dados");
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
    setStep("dados");
    if (reservation) {
      setCustomerName(reservation.customerName);
      setCustomerPhoneDisplay(formatPhone(reservation.customerPhone));
      setCustomerEmail(reservation.customerEmail ?? "");
      setPartySize(String(reservation.partySize));
      setDate(formatInTimeZone(reservation.startAt, location.timezone, "YYYY-MM-DD"));
      setTime(formatInTimeZone(reservation.startAt, location.timezone, "HH:mm"));
      const durMin = Math.round((new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / 60000);
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
  const endAtIso = startAtIso && durationMinutes ? new Date(new Date(startAtIso).getTime() + Number(durationMinutes) * 60000).toISOString() : null;

  const saving = create.isPending || update.isPending || setTables.isPending;
  const dataValid = !!customerName.trim() && !!customerPhoneDisplay.trim() && !!startAtIso && !!endAtIso && Number(partySize) > 0;

  const tablesChanged = (() => {
    if (!reservation) return false;
    const original = reservation.tables.map((t) => t.tableId).slice().sort();
    const next = [...tableIds].sort();
    if (original.length !== next.length || original.some((id, i) => id !== next[i])) return true;
    const originalPrimary = reservation.tables.find((t) => t.isPrimary)?.tableId;
    return originalPrimary !== primaryTableId;
  })();

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
            if (!tablesChanged) {
              toast.success(`Reserva ${r.publicCode} atualizada.`);
              onOpenChange(false);
              onSaved?.(r);
              return;
            }
            setTables.mutate(
              { reservationId: reservation.id, payload: { tableIds, primaryTableId, version: r.version } },
              {
                onSuccess: (r2) => {
                  toast.success(`Reserva ${r2.publicCode} atualizada.`);
                  onOpenChange(false);
                  onSaved?.(r2);
                },
                onError: (err) => toast.error(getErrorMessage(err, "Reserva salva, mas não foi possível atualizar as mesas.")),
              },
            );
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

  const areaOptions = [{ value: "none", label: "Sem preferência" }, ...(areas ?? []).map((a) => ({ value: String(a.id), label: a.nome }))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar reserva ${reservation?.publicCode}` : "Nova reserva"}</DialogTitle>
          <DialogDescription>{step === "dados" ? "Quem vem, quando e quantos." : "Escolha as mesas disponíveis nesse horário (opcional)."}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stepper
            orientation="horizontal"
            steps={[
              { label: "Dados da reserva", description: dataValid && step === "mesas" ? `${customerName} · ${partySize} ${Number(partySize) === 1 ? "pessoa" : "pessoas"} · ${time}` : undefined, status: step === "dados" ? "current" : "done" },
              { label: "Mesas", description: step === "mesas" && tableIds.length > 0 ? `${tableIds.length} ${tableIds.length === 1 ? "mesa" : "mesas"}` : undefined, status: step === "mesas" ? "current" : "upcoming" },
            ]}
          />

          {step === "dados" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (dataValid) setStep("mesas");
              }}
            >
              <FieldGroup columns={2}>
                <Field label="Nome do cliente" htmlFor="res-nome" required>
                  <Input id="res-nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus />
                </Field>
                <Field label="Telefone" htmlFor="res-telefone" required>
                  <Input id="res-telefone" inputMode="tel" value={customerPhoneDisplay} onChange={(e) => setCustomerPhoneDisplay(formatPhone(e.target.value))} placeholder="(11) 99999-8888" />
                </Field>
              </FieldGroup>
              <Field label="E-mail" htmlFor="res-email" optional>
                <Input id="res-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Pessoas" htmlFor="res-pessoas" required>
                  <Input id="res-pessoas" type="number" inputMode="numeric" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
                </Field>
                <Field label="Data" htmlFor="res-data" required>
                  <Input id="res-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Horário" htmlFor="res-hora" required>
                  <Input id="res-hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>
                <Field label="Duração" htmlFor="res-duracao">
                  <Input id="res-duracao" type="number" inputMode="numeric" min={1} suffix="min" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                </Field>
              </div>
              <FieldGroup columns={2}>
                <Field label="Origem">
                  <SelectInput value={source} onValueChange={(v) => setSource(v as VenueReservationSource)} options={SOURCE_OPTIONS} />
                </Field>
                <Field label="Área preferida" optional>
                  <SelectInput value={preferredAreaId || "none"} onValueChange={(v) => setPreferredAreaId(v === "none" ? "" : v)} options={areaOptions} />
                </Field>
              </FieldGroup>
              <FieldGroup columns={2}>
                <Field label="Observações do cliente" htmlFor="res-obs" optional>
                  <Textarea id="res-obs" rows={2} className="min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Aniversário, cadeirão, restrição alimentar…" />
                </Field>
                <Field label="Observações internas" htmlFor="res-obs-internas" optional hint="Só a equipe vê.">
                  <Textarea id="res-obs-internas" rows={2} className="min-h-20" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                </Field>
              </FieldGroup>
              {!isEdit ? (
                <label htmlFor="res-confirmada" className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-foreground">
                  <Checkbox id="res-confirmada" checked={confirmedNow} onCheckedChange={(v) => setConfirmedNow(v === true)} />
                  Criar já como confirmada
                </label>
              ) : null}
            </form>
          ) : startAtIso && endAtIso ? (
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
          ) : null}
        </DialogBody>
        <DialogFooter>
          {step === "mesas" ? (
            <Button variant="ghost" onClick={() => setStep("dados")} disabled={saving} leftIcon="arrow-left" className="sm:mr-auto">
              Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
          )}
          {step === "dados" ? (
            <Button disabled={!dataValid} onClick={() => setStep("mesas")} rightIcon="arrow-right">
              Escolher mesas
            </Button>
          ) : (
            <Button disabled={!dataValid} loading={saving} leftIcon="check" onClick={handleSubmit}>
              {isEdit ? "Salvar alterações" : tableIds.length > 0 ? "Criar reserva" : "Criar sem mesa"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
