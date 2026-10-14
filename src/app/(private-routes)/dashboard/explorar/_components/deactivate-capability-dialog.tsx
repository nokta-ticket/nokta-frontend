"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Ação destrutiva (esconde uma funcionalidade já em uso) — sempre exige confirmação explícita. */
export function DeactivateCapabilityDialog({ open, onOpenChange, capabilityName, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; capabilityName: string; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      danger
      icon="eye-slash"
      title={`Desativar “${capabilityName}”?`}
      description="A funcionalidade sai da navegação da sua equipe. Nenhum dado é apagado — você pode ativar de novo quando quiser."
      confirmLabel="Desativar"
      onConfirm={onConfirm}
    />
  );
}
