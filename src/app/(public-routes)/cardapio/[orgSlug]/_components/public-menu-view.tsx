"use client";

import { useEffect, useRef, useState } from "react";
import { getVisitorToken, venueMenuPublicApi, type PublicMenuItem, type PublicMenuResponse } from "@/services/venue-menu-public";
import { MenuView } from "@/components/venue-menu/menu-view";

/**
 * Página pública de cardápio (nokta.live/cardapio/{slug}) — só liga o
 * MenuView (renderer real, compartilhado com o preview autenticado do
 * dashboard) aos dados/favoritos de verdade da API pública. Nenhuma
 * decisão visual mora aqui — está toda em MenuView, pra nunca existir uma
 * segunda implementação divergente do cardápio.
 *
 * initialData vem do servidor (page.tsx é Server Component agora, ver
 * comentário lá) sem visitorToken — favoritedByVisitor chega sempre false
 * nesse fetch inicial (localStorage não existe no servidor). Assim que o
 * componente monta no navegador, refaz o mesmo GET com o token real em
 * segundo plano (sem mostrar loading) só pra corrigir os corações já
 * favoritados em visitas anteriores — nunca bloqueia a primeira renderização.
 */
export function PublicMenuView({ initialData, orgSlug }: { initialData: PublicMenuResponse; orgSlug: string }) {
  const [data, setData] = useState(initialData);
  const visitorTokenRef = useRef<string>("");
  if (!visitorTokenRef.current && typeof window !== "undefined") {
    visitorTokenRef.current = getVisitorToken();
  }

  useEffect(() => {
    const token = visitorTokenRef.current;
    if (!token) return;
    venueMenuPublicApi
      .getByOrgSlug(orgSlug, token)
      .then(setData)
      .catch(() => {});
  }, [orgSlug]);

  async function toggleFavorite(item: PublicMenuItem) {
    const token = visitorTokenRef.current;
    if (!token) return;

    const applyLocal = (menuItemId: number, favorited: boolean, delta: number) => {
      setData((prev) => ({
        ...prev,
        menu: {
          ...prev.menu,
          highlights: prev.menu.highlights.map((it) =>
            it.id === menuItemId ? { ...it, favoritedByVisitor: favorited, favoriteCount: it.favoriteCount + delta } : it,
          ),
          categories: prev.menu.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((it) =>
              it.id === menuItemId ? { ...it, favoritedByVisitor: favorited, favoriteCount: it.favoriteCount + delta } : it,
            ),
          })),
        },
      }));
    };

    const willFavorite = !item.favoritedByVisitor;
    applyLocal(item.id, willFavorite, willFavorite ? 1 : -1);

    try {
      if (willFavorite) {
        await venueMenuPublicApi.favorite(orgSlug, item.id, token);
      } else {
        await venueMenuPublicApi.unfavorite(orgSlug, item.id, token);
      }
    } catch {
      applyLocal(item.id, !willFavorite, willFavorite ? -1 : 1);
    }
  }

  return <MenuView data={data} onToggleFavorite={toggleFavorite} scrollContainerSelector="main" orgSlug={orgSlug} />;
}
