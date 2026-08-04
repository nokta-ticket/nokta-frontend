"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HorariosTab } from "../../configuracoes/_components/horarios-tab";

/**
 * Reaproveita 100% o editor de horário de funcionamento já existente em
 * Configurações (mesmos hooks/endpoints/regras — nunca duplicado), só
 * exposto aqui dentro de um Dialog pra ficar acessível a partir do
 * Cardápio também, sem precisar navegar até outra área do dashboard.
 */
export function BusinessHoursDialog({
  orgId,
  canManage,
  open,
  onOpenChange,
}: {
  orgId: number;
  canManage: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Horário de funcionamento</DialogTitle>
        </DialogHeader>
        <HorariosTab orgId={orgId} canManage={canManage} />
      </DialogContent>
    </Dialog>
  );
}
