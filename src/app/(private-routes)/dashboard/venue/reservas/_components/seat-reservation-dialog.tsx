"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueReservation } from "@/services/venue-reservations";
import { useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { AvailabilityPicker } from "./availability-picker";

export function SeatReservationDialog({
  orgId,
  locationId,
  reservation,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  reservation: VenueReservation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { seat } = useVenueReservationMutations(orgId, locationId);
  const router = useRouter();

  const [tableIds, setTableIds] = useState<number[]>([]);
  const [primaryTableId, setPrimaryTableId] = useState<number | undefined>();

  useEffect(() => {
    if (open && reservation) {
      setTableIds(reservation.tables.map((t) => t.tableId));
      setPrimaryTableId(reservation.tables.find((t) => t.isPrimary)?.tableId);
    }
  }, [open, reservation]);

  if (!reservation) return null;

  const handleSeat = () => {
    if (tableIds.length === 0) {
      toast.error("Selecione ao menos uma mesa para dar entrada.");
      return;
    }
    seat.mutate(
      { reservationId: reservation.id, payload: { tableIds, primaryTableId } },
      {
        onSuccess: ({ tab }) => {
          toast.success(`Comanda ${tab.publicCode} aberta.`);
          onOpenChange(false);
          router.push(`/dashboard/venue/operacao?locationId=${locationId}&tabId=${tab.id}`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível dar entrada.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dar entrada — {reservation.publicCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-black/60">
            {reservation.customerName} · {reservation.partySize} pessoa(s)
          </p>
          <AvailabilityPicker
            orgId={orgId}
            locationId={locationId}
            startAt={new Date().toISOString()}
            partySize={reservation.partySize}
            reservationId={reservation.id}
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
            {seat.isPending ? "Abrindo…" : "Confirmar entrada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
