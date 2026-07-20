"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Ação destrutiva (esconde uma funcionalidade já em uso) — sempre exige confirmação explícita. */
export function DeactivateCapabilityDialog({
  open,
  onOpenChange,
  capabilityName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilityName: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar &ldquo;{capabilityName}&rdquo;?</DialogTitle>
          <DialogDescription>
            A funcionalidade sai da navegação da sua equipe. Nenhum dado é apagado — você pode ativar de novo quando quiser.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
