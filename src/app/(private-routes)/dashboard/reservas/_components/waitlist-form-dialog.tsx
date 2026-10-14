"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone, normalizeDigits } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { useVenueAreas } from "../../operacao/_hooks/use-venue-areas-tables";
import { useVenueWaitlistMutations } from "../_hooks/use-venue-waitlist";

export function WaitlistFormDialog({ orgId, locationId, open, onOpenChange }: { orgId: number; locationId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: areas } = useVenueAreas(orgId, locationId);
  const { create } = useVenueWaitlistMutations(orgId, locationId);

  const [customerName, setCustomerName] = useState("");
  const [customerPhoneDisplay, setCustomerPhoneDisplay] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [preferredAreaId, setPreferredAreaId] = useState("");
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setCustomerName("");
      setCustomerPhoneDisplay("");
      setPartySize("2");
      setPreferredAreaId("");
      setEstimatedWaitMinutes("");
      setNotes("");
    }
  }, [open]);

  const canSubmit = !!customerName.trim() && !!customerPhoneDisplay.trim() && Number(partySize) > 0;

  const handleSubmit = () => {
    create.mutate(
      {
        customerName,
        customerPhone: normalizeDigits(customerPhoneDisplay),
        partySize: Number(partySize),
        preferredAreaId: preferredAreaId ? Number(preferredAreaId) : undefined,
        estimatedWaitMinutes: estimatedWaitMinutes ? Number(estimatedWaitMinutes) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (entry) => {
          toast.success(`${entry.customerName} entrou na fila (${entry.publicCode}).`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível adicionar à fila.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Adicionar à fila de espera</DialogTitle>
          <DialogDescription>Cliente sem reserva aguardando mesa. Avise pelo WhatsApp quando liberar.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) handleSubmit();
            }}
          >
            <Field label="Nome" htmlFor="wl-nome" required>
              <Input id="wl-nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Telefone" htmlFor="wl-telefone" required>
                <Input id="wl-telefone" inputMode="tel" value={customerPhoneDisplay} onChange={(e) => setCustomerPhoneDisplay(formatPhone(e.target.value))} placeholder="(11) 99999-8888" />
              </Field>
              <Field label="Pessoas" htmlFor="wl-pessoas" required>
                <Input id="wl-pessoas" type="number" inputMode="numeric" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
              </Field>
              <Field label="Área preferida" optional>
                <SelectInput value={preferredAreaId || "none"} onValueChange={(v) => setPreferredAreaId(v === "none" ? "" : v)} options={[{ value: "none", label: "Sem preferência" }, ...(areas ?? []).map((a) => ({ value: String(a.id), label: a.nome }))]} />
              </Field>
              <Field label="Previsão de espera" htmlFor="wl-estimativa" optional>
                <Input id="wl-estimativa" type="number" inputMode="numeric" min={0} suffix="min" value={estimatedWaitMinutes} onChange={(e) => setEstimatedWaitMinutes(e.target.value)} />
              </Field>
            </FieldGroup>
            <Field label="Observação" htmlFor="wl-obs" optional>
              <Textarea id="wl-obs" rows={2} className="min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: com cadeirinha, prefere perto da janela" />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button disabled={!canSubmit} loading={create.isPending} leftIcon="user-plus" onClick={handleSubmit}>
            Adicionar à fila
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
