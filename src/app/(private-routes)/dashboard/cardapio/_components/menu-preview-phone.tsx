"use client";

import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { centsToBRL, type VenueMenuCategory, type VenueMenuDetail, type VenueMenuItem } from "@/services/venue-menu";

/**
 * Mockup de celular mostrando o cardápio principal exatamente como o
 * cliente final vê na página pública — mesmos dados (useVenueMenu/
 * useVenueMenuItems), nunca uma cópia estática. Editar um produto/categoria
 * já invalida essas queries (ver hooks de mutation existentes), então o
 * preview atualiza sozinho sem nenhum mecanismo de "tempo real" novo.
 */
export function MenuPreviewPhone({
  organizationName,
  menu,
  items,
  isLoading,
}: {
  organizationName: string;
  menu: VenueMenuDetail | undefined;
  items: VenueMenuItem[] | undefined;
  isLoading: boolean;
}) {
  const itemsByCategory = new Map<number, VenueMenuItem[]>();
  for (const item of items ?? []) {
    if (!item.active) continue;
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  const categories: VenueMenuCategory[] = (menu?.categories ?? []).filter((c) => c.active);

  return (
    <div className="sticky top-4 mx-auto w-full max-w-[300px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-[#1c1830] bg-[#1c1830] shadow-[0_20px_50px_rgba(28,24,48,0.25)]">
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#1c1830]" />
        <div className="h-[560px] overflow-y-auto rounded-[2rem] bg-[#faf9fd]">
          <div className="bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] px-4 pb-5 pt-8 text-white">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">Cardápio</p>
            <h3 className="mt-0.5 truncate font-poppins text-lg font-bold tracking-tight">{organizationName}</h3>
          </div>

          <div className="space-y-5 px-4 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <UtensilsCrossed size={28} className="text-black/20" />
                <p className="text-xs text-muted-foreground">
                  Adicione categorias e produtos para ver o preview do cardápio.
                </p>
              </div>
            ) : (
              categories.map((category) => {
                const categoryItems = itemsByCategory.get(category.id) ?? [];
                if (categoryItems.length === 0) return null;
                return (
                  <section key={category.id}>
                    <h4 className="mb-2 text-sm font-semibold text-foreground">{category.nome}</h4>
                    <div className="space-y-2">
                      {categoryItems.map((item) => {
                        const price = item.prices[0];
                        const available = item.product.status === "ACTIVE";
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-2.5 rounded-xl bg-white p-2 shadow-[0_1px_2px_rgba(28,24,48,0.05)] ${
                              available ? "" : "opacity-60"
                            }`}
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/5">
                              {item.product.imageUrl ? (
                                <Image
                                  src={resolveMediaUrl(item.product.imageUrl) ?? "/logo.png"}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <p className="min-w-0 flex-1 truncate text-xs font-medium text-gray-900">{item.product.nome}</p>
                            {price ? (
                              <p className="shrink-0 text-xs font-semibold text-violet-600">
                                {centsToBRL(price.effectivePriceCents)}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Preview do cardápio público</p>
    </div>
  );
}
