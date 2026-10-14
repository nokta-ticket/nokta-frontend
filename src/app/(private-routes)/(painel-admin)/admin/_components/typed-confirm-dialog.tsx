"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

/**
 * Confirmação destrutiva que exige digitar um valor (e-mail da conta, nome
 * do workspace) antes de liberar o botão. Mesmo vocabulário do
 * ConfirmDialog, só com a trava a mais.
 */
export function TypedConfirmDialog({ open, onOpenChange, title, description, expected, label, placeholder, confirmLabel = "Excluir permanentemente", onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; expected: string; label: ReactNode; placeholder?: string; confirmLabel?: string; onConfirm: () => Promise<unknown> | void }) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const matches = typed.trim().toLowerCase() === expected.trim().toLowerCase();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const handleConfirm = async () => {
    if (!matches) return;
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
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-danger-bg text-danger">
            <Icon name="trash" size={18} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody className="pt-0">
          <Field label={label} htmlFor="typed-confirm">
            <Input id="typed-confirm" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={placeholder} aria-invalid={typed.length > 0 && !matches ? true : undefined} />
          </Field>
        </DialogBody>
        <DialogFooter className="border-t-0 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!matches} loading={pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
