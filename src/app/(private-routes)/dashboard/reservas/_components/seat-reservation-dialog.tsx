"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueReservation } from "@/services/venue-reservations";
import { useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { AvailabilityPicker } from "./availability-picker";

/** "Dar entrada": sentar a reserva abre uma comanda na(s) mesa(s) escolhida(s) e leva pra Operação. */
export function SeatReservationDialog({ orgId, locationId, reservation, open, onOpenChange }: { orgId: number; locationId: number; reservation: VenueReservation | null; open: boolean; onOpenChange: (v: boolean) => void }) {
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
          router.push(`/dashboard/operacao?locationId=${locationId}&tabId=${tab.id}`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível dar entrada.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Dar entrada — {reservation.customerName}</DialogTitle>
          <DialogDescription>
            Reserva {reservation.publicCode} · {reservation.partySize} {reservation.partySize === 1 ? "pessoa" : "pessoas"}. A comanda abre na mesa escolhida.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
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
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={seat.isPending}>
            Cancelar
          </Button>
          <Button size="lg" disabled={tableIds.length === 0} loading={seat.isPending} leftIcon="door" onClick={handleSeat}>
            Confirmar entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
