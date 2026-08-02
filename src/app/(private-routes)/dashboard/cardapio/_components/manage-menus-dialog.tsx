"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardapiosTab } from "./cardapios-tab";

/**
 * "Gerenciar cardápios" deixou de ser uma aba própria (a tela de Cardápio
 * já resolve qual cardápio editar no cabeçalho) — vira um Dialog aberto a
 * partir de lá, reaproveitando CardapiosTab (criar/editar/definir
 * principal/publicar/arquivar) sem tocar sua lógica interna.
 */
export function ManageMenusDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar cardápios</DialogTitle>
        </DialogHeader>
        <CardapiosTab orgId={orgId} />
      </DialogContent>
    </Dialog>
  );
}
