"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EstacoesTab } from "./estacoes-tab";

/**
 * Estações deixou de ser aba principal do cardápio — é configuração
 * operacional secundária (direcionamento de preparo, não catálogo em si),
 * agora um Sheet lateral aberto a partir do cabeçalho. EstacoesTab
 * continua intacto.
 */
export function StationsSheet({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Estações de preparo</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <EstacoesTab orgId={orgId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
