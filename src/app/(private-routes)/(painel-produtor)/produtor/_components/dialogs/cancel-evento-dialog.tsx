"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelEventoDialogProps {
  eventId: number;
  eventName: string;
  onConfirm: (id: number) => void;
}

export function CancelEventoDialog({
  eventId,
  eventName,
  onConfirm,
}: CancelEventoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-orange-400 text-orange-600 hover:text-white hover:bg-orange-500">
          Cancelar evento
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar este evento?</DialogTitle>
          <DialogDescription>
            O evento <span className="font-medium text-foreground">{eventName}</span> será cancelado e não poderá ser reativado. Os participantes não poderão mais comprar ingressos.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline">Voltar</Button>
          </DialogClose>
          <Button
            className="text-white bg-orange-600 hover:bg-orange-700"
            onClick={() => onConfirm(eventId)}
          >
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
