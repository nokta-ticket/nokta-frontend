"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Confirmação canônica — nunca `window.confirm`. `onConfirm` pode ser
 * assíncrono: o botão mostra loading e o diálogo fecha quando resolve.
 * `danger` troca o tom (ícone, botão vermelho).
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, danger, icon, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void | Promise<unknown>; danger?: boolean; icon?: IconName; children?: ReactNode }) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    try {
      setPending(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? onOpenChange(o) : null)}>
      <DialogContent size="sm" showCloseButton={false}>
        <DialogHeader className="pr-5 sm:pr-6">
          <div className={cn("mb-3 flex size-11 items-center justify-center rounded-full", danger ? "bg-danger-bg text-danger" : "bg-brand-soft text-brand")}>
            <Icon name={icon ?? (danger ? "warning" : "question")} size={18} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <DialogBody className="pt-0">{children}</DialogBody> : null}
        <DialogFooter className="border-t-0 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "destructive" : "primary"} onClick={handleConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
