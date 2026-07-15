"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueWaitlistEntry } from "@/services/venue-reservations";
import { useVenueWaitlistMutations } from "../_hooks/use-venue-waitlist";
import { AvailabilityPicker } from "./availability-picker";

export function WaitlistSeatDialog({
  orgId,
  locationId,
  entry,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  entry: VenueWaitlistEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { seat } = useVenueWaitlistMutations(orgId, locationId);
  const router = useRouter();
  const [tableIds, setTableIds] = useState<number[]>([]);
  const [primaryTableId, setPrimaryTableId] = useState<number | undefined>();

  useEffect(() => {
    if (open) {
      setTableIds([]);
      setPrimaryTableId(undefined);
    }
  }, [open]);

  if (!entry) return null;

  const handleSeat = () => {
    if (tableIds.length === 0) {
      toast.error("Selecione ao menos uma mesa.");
      return;
    }
    seat.mutate(
      { entryId: entry.id, payload: { tableIds, primaryTableId } },
      {
        onSuccess: ({ tab }) => {
          toast.success(`Comanda ${tab.publicCode} aberta.`);
          onOpenChange(false);
          router.push(`/dashboard/venue/operacao?locationId=${locationId}&tabId=${tab.id}`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível sentar o cliente.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sentar cliente — {entry.publicCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-black/60">
            {entry.customerName} · {entry.partySize} pessoa(s)
          </p>
          <AvailabilityPicker
            orgId={orgId}
            locationId={locationId}
            startAt={new Date().toISOString()}
            partySize={entry.partySize}
            selectedTableIds={tableIds}
            primaryTableId={primaryTableId}
            onChange={(ids, primary) => {
              setTableIds(ids);
              setPrimaryTableId(primary);
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={seat.isPending}>
            Cancelar
          </Button>
          <Button disabled={seat.isPending || tableIds.length === 0} onClick={handleSeat}>
            {seat.isPending ? "Abrindo…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
