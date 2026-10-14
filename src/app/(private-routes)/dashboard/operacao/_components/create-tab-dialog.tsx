"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_TAB_TYPE_LABEL, type VenueTab, type VenueTabType } from "@/services/venue-operation";
import { useVenueTabMutations } from "../_hooks/use-venue-tabs";

export function CreateTabDialog({
  orgId,
  locationId,
  open,
  onOpenChange,
  /** Se vier preenchido (ex.: tocou numa mesa livre), trava o tipo em TABLE. */
  presetTableId,
  presetTableName,
  onCreated,
}: {
  orgId: number;
  locationId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetTableId?: number;
  presetTableName?: string;
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
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{presetTableId ? `Abrir ${presetTableName ?? "mesa"}` : "Nova comanda"}</DialogTitle>
          <DialogDescription>{presetTableId ? "A comanda fica ligada à mesa até o fechamento." : "Comanda individual ou venda rápida de balcão."}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {!presetTableId ? (
            <Field label="Tipo">
              <SegmentedControl
                fullWidth
                value={type}
                onChange={(v) => setType(v)}
                options={[
                  { value: "INDIVIDUAL" as VenueTabType, label: VENUE_TAB_TYPE_LABEL.INDIVIDUAL, icon: "clipboard-list" },
                  { value: "COUNTER" as VenueTabType, label: VENUE_TAB_TYPE_LABEL.COUNTER, icon: "store" },
                ]}
              />
            </Field>
          ) : null}
          <FieldGroup columns={2}>
            <Field label="Cliente" htmlFor="tab-cliente" optional className="sm:col-span-2">
              <Input id="tab-cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome ou apelido" autoFocus />
            </Field>
            <Field label="Pessoas" htmlFor="tab-pessoas" optional>
              <Input id="tab-pessoas" type="number" inputMode="numeric" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="2" />
            </Field>
          </FieldGroup>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} loading={create.isPending} leftIcon="plus">
            Abrir comanda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
