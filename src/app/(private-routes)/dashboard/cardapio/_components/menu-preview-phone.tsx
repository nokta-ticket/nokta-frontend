"use client";

import { UtensilsCrossed } from "lucide-react";
import { MenuView } from "@/components/venue-menu/menu-view";
import { useVenueMenuPreview } from "../_hooks/use-venue-menus";

const PREVIEW_SCROLL_CLASS = "menu-preview-phone-scroll";

/**
 * Preview real do cardápio — renderiza o MESMO componente (MenuView) e os
 * mesmos dados (useVenueMenuPreview, endpoint de preview autenticado) da
 * página pública, dentro de um bezel de celular navegável. Nunca uma
 * segunda implementação visual: qualquer mudança de cor, layout ou regra
 * do cardápio público aparece aqui automaticamente, porque é o mesmo
 * código. Funciona para cardápio DRAFT ou PUBLISHED — o preview não exige
 * publicação (ver VenueMenuPublicService.getMenuPreview no backend).
 *
 * Mutations de produto/categoria já invalidam a query de preview (ver
 * use-venue-products.ts/use-venue-categories.ts/use-venue-menus.ts), então
 * o conteúdo atualiza sozinho depois de salvar, sem reload.
 */
export function MenuPreviewPhone({ orgId, menuId }: { orgId: number | null; menuId: number | null }) {
  const { data, isLoading } = useVenueMenuPreview(orgId, menuId);

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-[#1c1830] bg-[#1c1830] shadow-[0_20px_50px_rgba(28,24,48,0.25)]">
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#1c1830]" />
        <div className={`relative h-[640px] overflow-y-auto rounded-[2rem] bg-[#e9e9ec] ${PREVIEW_SCROLL_CLASS}`}>
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />
              ))}
            </div>
          ) : !data || (data.menu.categories.length === 0 && data.menu.highlights.length === 0) ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <UtensilsCrossed size={28} className="text-black/20" />
              <p className="text-xs text-muted-foreground">
                Adicione categorias e produtos para ver o preview do cardápio.
              </p>
            </div>
          ) : (
            <MenuView data={data} scrollContainerSelector={`.${PREVIEW_SCROLL_CLASS}`} />
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Preview do cardápio (só você vê)</p>
    </div>
  );
}
