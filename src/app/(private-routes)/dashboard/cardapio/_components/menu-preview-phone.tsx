"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useVenueMenuPreview } from "../_hooks/use-venue-menus";

/**
 * Preview real do cardápio — a mesma renderização (MenuView) da página
 * pública dentro de um `<iframe>` (`/cardapio-preview/{org}/{menu}`), numa
 * moldura de celular. Um iframe tem a própria janela de renderização, então
 * os breakpoints do MenuView reagem à largura real do aparelho simulado.
 *
 * "Ao vivo": toda mutation do cardápio invalida a query `menuPreview`; quando
 * ela refaz o fetch, `dataUpdatedAt` muda e o iframe recarrega sozinho —
 * sem precisar de F5 depois de salvar um produto ou categoria.
 */
export function MenuPreviewPhone({ orgId, menuId, className, height = 720 }: { orgId: number | null; menuId: number | null; className?: string; height?: number }) {
  const preview = useVenueMenuPreview(orgId, menuId);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const lastUpdatedAt = useRef(0);

  // Só recarrega quando a query foi REFEITA (mutation invalidou) — a primeira
  // resposta não conta, senão o iframe carregaria duas vezes ao abrir.
  useEffect(() => {
    if (!preview.dataUpdatedAt) return;
    if (lastUpdatedAt.current && lastUpdatedAt.current !== preview.dataUpdatedAt) setVersion((v) => v + 1);
    lastUpdatedAt.current = preview.dataUpdatedAt;
  }, [preview.dataUpdatedAt]);

  useEffect(() => {
    setLoaded(false);
  }, [version, orgId, menuId]);

  if (orgId === null || menuId === null) return null;

  return (
    <div className={cn("mx-auto w-full max-w-[392px]", className)}>
      <div className="relative rounded-[36px] bg-surface p-2.5 shadow-card ring-1 ring-border">
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-surface" aria-hidden />
        <div className="relative overflow-hidden rounded-[28px] bg-surface-2" style={{ height }}>
          {!loaded ? <div className="skeleton-shimmer absolute inset-0" aria-hidden /> : null}
          <iframe
            key={`${orgId}-${menuId}-${version}`}
            src={`/cardapio-preview/${orgId}/${menuId}`}
            title="Prévia do cardápio"
            onLoad={() => setLoaded(true)}
            className={cn("relative h-full w-full border-0 transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <p className="text-caption text-muted-foreground">É assim que o cliente vê o cardápio.</p>
        <Button variant="subtle" size="sm" leftIcon="refresh" onClick={() => setVersion((v) => v + 1)}>
          Atualizar
        </Button>
      </div>
    </div>
  );
}
