"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { MenuView } from "@/components/venue-menu/menu-view";
import { venueMenuApi } from "@/services/venue-menu";
import type { PublicMenuResponse } from "@/services/venue-menu-public";

/**
 * Documento próprio para o preview do cardápio (`MenuPreviewPhone`, montado
 * dentro de um `<iframe>`) — nunca renderizado fora dele.
 *
 * Existe porque `MenuView` usa breakpoints Tailwind (`md:`/`lg:`, ~40
 * ocorrências) que reagem à largura REAL da janela do navegador, não à
 * largura visual de um elemento com `transform: scale()` — a tentativa
 * anterior (escalar o MenuView dentro do bezel via CSS) ficava com o
 * conteúdo "espremido" em telas de desktop largas, porque os estilos
 * `md:`/`lg:` disparavam mesmo a área visual real sendo ~278px (relatado
 * pelo usuário com print comparando ao vivo vs preview). Um `<iframe>` tem
 * sua PRÓPRIA janela de renderização, com a largura que o `width` do
 * elemento define de verdade — os breakpoints passam a reagir a essa
 * largura real, exatamente como um celular de verdade. Sem `transform` no
 * ancestral (diferente da tentativa anterior), `sticky` volta a funcionar
 * normalmente — nenhum motivo pra `disableSticky` aqui.
 *
 * Fora de dashboard/ de propósito: precisa de layout "nu" (sem sidebar/
 * topbar), mas ainda autenticado (dentro de (private-routes), protegido
 * pelo middleware via PLATFORM_ONLY_PREFIXES). Usa `api` (axios) direto em
 * vez do hook useVenueMenuPreview (React Query) porque o QueryClientProvider
 * só existe dentro do layout do dashboard, que esta rota não usa.
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
      <div className="space-y-3 bg-[#e9e9ec] p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />
        ))}
      </div>
    );
  }

  if (!data || (data.menu.categories.length === 0 && data.menu.highlights.length === 0)) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 bg-[#e9e9ec] px-6 text-center">
        <UtensilsCrossed size={28} className="text-black/20" />
        <p className="text-xs text-muted-foreground">
          Adicione categorias e produtos para ver o preview do cardápio.
        </p>
      </div>
    );
  }

  return <MenuView data={data} />;
}
