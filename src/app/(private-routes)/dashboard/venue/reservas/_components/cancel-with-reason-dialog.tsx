"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CancelWithReasonDialog({
  open,
  onOpenChange,
  title,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  loading: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  // Radix só chama onOpenChange em fechamentos internos — resetar ao abrir precisa de useEffect(open).
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <Textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            disabled={loading || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading ? "Cancelando…" : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
