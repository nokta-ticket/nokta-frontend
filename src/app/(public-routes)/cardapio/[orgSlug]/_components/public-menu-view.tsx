"use client";

import { useEffect, useRef, useState } from "react";
import { getVisitorToken, venueMenuPublicApi, type PublicMenuItem, type PublicMenuResponse } from "@/services/venue-menu-public";
import { MenuView } from "@/components/venue-menu/menu-view";

/**
 * Liga o MenuView (renderer compartilhado com o preview do painel) aos dados
 * e favoritos reais da API pública. Nenhuma decisão visual mora aqui.
 *
 * `initialData` vem do servidor sem visitorToken — ao montar, refaz o GET com
 * o token real em segundo plano só pra corrigir os corações favoritados em
 * visitas anteriores; nunca bloqueia a primeira renderização. Favoritar é
 * otimista, com rollback se a API falhar.
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
          highlights: prev.menu.highlights.map((it) => (it.id === menuItemId ? { ...it, favoritedByVisitor: favorited, favoriteCount: it.favoriteCount + delta } : it)),
          categories: prev.menu.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((it) => (it.id === menuItemId ? { ...it, favoritedByVisitor: favorited, favoriteCount: it.favoriteCount + delta } : it)),
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

  return <MenuView data={data} onToggleFavorite={toggleFavorite} orgSlug={orgSlug} />;
}
