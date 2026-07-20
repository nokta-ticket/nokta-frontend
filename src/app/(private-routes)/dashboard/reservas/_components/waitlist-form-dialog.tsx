"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatPhone, normalizeDigits } from "@/lib/br-data";
import { useVenueAreas } from "../../operacao/_hooks/use-venue-areas-tables";
import { useVenueWaitlistMutations } from "../_hooks/use-venue-waitlist";

export function WaitlistFormDialog({
  orgId,
  locationId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
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
          toast.success(`${entry.publicCode} adicionado à fila.`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível adicionar à fila.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar à fila de espera</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="wl-nome">Nome</Label>
            <Input id="wl-nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wl-telefone">Telefone</Label>
              <Input
                id="wl-telefone"
                value={customerPhoneDisplay}
                onChange={(e) => setCustomerPhoneDisplay(formatPhone(e.target.value))}
                placeholder="(11) 99999-8888"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-pessoas">Pessoas</Label>
              <Input id="wl-pessoas" type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="wl-estimativa">Previsão (min, opcional)</Label>
              <Input
                id="wl-estimativa"
                type="number"
                min={0}
                value={estimatedWaitMinutes}
                onChange={(e) => setEstimatedWaitMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-obs">Observação (opcional)</Label>
            <Textarea id="wl-obs" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button disabled={create.isPending || !canSubmit} onClick={handleSubmit}>
            {create.isPending ? "Adicionando…" : "Adicionar à fila"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
