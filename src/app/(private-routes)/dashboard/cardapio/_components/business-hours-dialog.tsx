"use client";

import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HorariosTab } from "../../configuracoes/_components/horarios-tab";

/**
 * Reaproveita 100% o editor de horário de funcionamento de Configurações
 * (mesmos hooks/endpoints/regras — nunca duplicado), exposto num Dialog pra
 * ficar acessível a partir do Cardápio.
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
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Horário de funcionamento</DialogTitle>
          <DialogDescription>Aparece na página pública do seu estabelecimento.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <HorariosTab orgId={orgId} canManage={canManage} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
