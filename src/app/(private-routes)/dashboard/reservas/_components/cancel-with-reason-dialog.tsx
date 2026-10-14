"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

/** Cancelamento que exige motivo (reserva, entrada na fila) — nunca `window.confirm`. */
export function CancelWithReasonDialog({ open, onOpenChange, title, description = "O motivo fica registrado no histórico.", loading, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; loading: boolean; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  // Radix só chama onOpenChange em fechamentos internos — reset reage a `open`.
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Motivo" htmlFor="cancel-reason">
            <Textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente remarcou pra amanhã" autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Voltar
          </Button>
          <Button variant="destructive" disabled={!reason.trim()} loading={loading} onClick={() => onConfirm(reason.trim())}>
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
