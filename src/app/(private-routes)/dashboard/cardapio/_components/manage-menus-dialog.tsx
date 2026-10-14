"use client";

import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardapiosTab } from "./cardapios-tab";

/**
 * "Gerenciar cardápios" não é uma aba própria (a tela resolve qual cardápio
 * editar no cabeçalho) — é um Dialog que reaproveita CardapiosTab
 * (criar/editar/definir principal/publicar/arquivar).
 */
export function ManageMenusDialog({ orgId, open, onOpenChange, selectedMenuId, onSelectMenu }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void; selectedMenuId?: number | null; onSelectMenu?: (menuId: number) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Cardápios</DialogTitle>
          <DialogDescription>Principal, happy hour, camarote — cada um com as próprias categorias e preços.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <CardapiosTab
            orgId={orgId}
            selectedMenuId={selectedMenuId}
            onSelectMenu={(id) => {
              onSelectMenu?.(id);
              onOpenChange(false);
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
