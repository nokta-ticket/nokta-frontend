"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_TAB_TYPE_LABEL, type VenueTab, type VenueTabType } from "@/services/venue-operation";
import { useVenueTabMutations } from "../_hooks/use-venue-tabs";

export function CreateTabDialog({
  orgId,
  locationId,
  open,
  onOpenChange,
  /** Se vier preenchido (ex.: clicou "Abrir comanda" numa mesa livre), trava o tipo em TABLE. */
  presetTableId,
  onCreated,
}: {
  orgId: number;
  locationId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetTableId?: number;
  onCreated: (tab: VenueTab) => void;
}) {
  const { create } = useVenueTabMutations(orgId, locationId);
  const [type, setType] = useState<VenueTabType>(presetTableId ? "TABLE" : "INDIVIDUAL");
  const [customerName, setCustomerName] = useState("");
  const [guestCount, setGuestCount] = useState("");

  useEffect(() => {
    if (open) {
      setType(presetTableId ? "TABLE" : "INDIVIDUAL");
      setCustomerName("");
      setGuestCount("");
    }
  }, [open, presetTableId]);

  const handleCreate = () => {
    create.mutate(
      {
        type,
        tableId: type === "TABLE" ? presetTableId : undefined,
        customerName: customerName.trim() || undefined,
        guestCount: guestCount ? Number(guestCount) : undefined,
      },
      {
        onSuccess: (tab) => {
          toast.success(`Comanda ${tab.publicCode} aberta.`);
          onOpenChange(false);
          onCreated(tab);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível abrir a comanda.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova comanda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!presetTableId ? (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as VenueTabType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">{VENUE_TAB_TYPE_LABEL.INDIVIDUAL}</SelectItem>
                  <SelectItem value="COUNTER">{VENUE_TAB_TYPE_LABEL.COUNTER}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="tab-cliente">Nome do cliente (opcional)</Label>
            <Input id="tab-cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tab-pessoas">Quantidade de pessoas (opcional)</Label>
            <Input
              id="tab-pessoas"
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button disabled={create.isPending} onClick={handleCreate}>
            {create.isPending ? "Abrindo…" : "Abrir comanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
