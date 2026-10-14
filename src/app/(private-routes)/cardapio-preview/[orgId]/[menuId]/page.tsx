"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuView } from "@/components/venue-menu/menu-view";
import { venueMenuApi } from "@/services/venue-menu";
import type { PublicMenuResponse } from "@/services/venue-menu-public";

/**
 * Preview do cardápio montado dentro de um `<iframe>` pelo painel (nunca
 * renderizado fora dele). Um iframe tem a própria janela, então os
 * breakpoints do MenuView reagem à largura real do bezel — como num celular.
 * Fora de dashboard/ de propósito (layout nu, mas autenticado pelo
 * middleware). Usa `api` direto: o QueryClientProvider só existe no painel.
 */
export default function CardapioPreviewFramePage() {
  const params = useParams<{ orgId: string; menuId: string }>();
  const orgId = Number(params.orgId);
  const menuId = Number(params.menuId);

  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(orgId) || !Number.isFinite(menuId)) return;
    let cancelled = false;
    setLoading(true);
    venueMenuApi
      .getMenuPreview(orgId, menuId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, menuId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Skeleton className="aspect-[430/190] w-full rounded-none" />
        <div className="-mt-10 flex items-end gap-4 px-4">
          <Skeleton className="size-20 rounded-full ring-4 ring-background" />
          <Skeleton className="mb-2 h-6 w-40" />
        </div>
        <div className="space-y-2.5 px-4 pt-8">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || (data.menu.categories.length === 0 && data.menu.highlights.length === 0)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <EmptyState compact icon="utensils" title="Cardápio vazio" description="Adicione categorias e produtos pra ver o preview." className="w-full" />
      </div>
    );
  }

  return <MenuView data={data} />;
}
