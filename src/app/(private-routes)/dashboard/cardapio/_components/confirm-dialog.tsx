"use client";

import { ConfirmDialog as UiConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Compatibilidade: a Operação (caixa, terminais, comandas) ainda importa
 * `ConfirmDialog` daqui com a API antiga (`destructive`, `loading`,
 * `onConfirm` síncrono). Delega pro primitivo canônico de
 * `@/components/ui/confirm-dialog` — código novo deve importar de lá.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive = true,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <UiConfirmDialog
      open={open}
      onOpenChange={(v) => (!loading ? onOpenChange(v) : null)}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      danger={destructive}
      onConfirm={onConfirm}
    />
  );
}
