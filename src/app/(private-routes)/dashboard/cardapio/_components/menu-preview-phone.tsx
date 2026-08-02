"use client";

import { UtensilsCrossed } from "lucide-react";
import { MenuView } from "@/components/venue-menu/menu-view";
import { useVenueMenuPreview } from "../_hooks/use-venue-menus";

const PREVIEW_SCROLL_CLASS = "menu-preview-phone-scroll";

// MenuView é desenhado mobile-first para uma tela de celular REAL
// (~375-440px de largura) — textos, avatar e paddings em px fixos que só
// cabem nesse tamanho. O bezel do preview tem só ~278px de área útil
// (300px - bordas), então renderizar o MenuView direto nessa largura
// cortava tudo (hero "NOKTA TICKETS", nome da org, avatar). Em vez de
// reimplementar um MenuView "menor" (o que criaria divergência visual do
// componente real), ele é renderizado na largura REAL (FRAME_WIDTH) e
// escalado visualmente pra caber no bezel — como qualquer preview de
// celular de verdade (Figma, editores de site).
const FRAME_WIDTH = 390;
const BEZEL_INNER_WIDTH = 278; // 300px de bezel - 11px de borda de cada lado
const SCALE = BEZEL_INNER_WIDTH / FRAME_WIDTH;

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
    <div className="relative mx-auto w-[300px] rounded-[48px] border-[11px] border-[#0c0c0f] bg-[#0c0c0f] shadow-[0_40px_70px_rgba(20,20,40,.22),0_12px_24px_rgba(20,20,40,.12)]">
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-[25px] w-[92px] -translate-x-1/2 rounded-b-[14px] bg-[#0c0c0f]" />
      <div
        className={`relative h-[612px] overflow-y-auto overflow-x-hidden rounded-[38px] bg-[#e9e9ec] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${PREVIEW_SCROLL_CLASS}`}
      >
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
          <div style={{ width: FRAME_WIDTH, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
            <MenuView data={data} scrollContainerSelector={`.${PREVIEW_SCROLL_CLASS}`} />
          </div>
        )}
      </div>
    </div>
  );
}
