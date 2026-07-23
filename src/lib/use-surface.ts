"use client";

import { useEffect, useState } from "react";
import { resolveSurfaceFromHost, type Surface } from "@/lib/surfaces";

/**
 * Superfície atual (PLATFORM/TICKETS_PUBLIC/MARKETING), resolvida no client
 * a partir de `window.location.hostname` — ver docs/platform/surfaces.md.
 * Nunca decide isso em Server Component/layout (quebraria o cache estático
 * compartilhado pelas três superfícies, ver comentário em src/app/layout.tsx).
 *
 * Retorna `null` até montar (SSR/primeira renderização), pra nunca divergir
 * do HTML gerado no servidor — quem usa este hook deve tratar `null` como
 * "ainda não sei, renderize o padrão (Nokta Tickets)".
 */
export function useSurface(): Surface | null {
  const [surface, setSurface] = useState<Surface | null>(null);

  useEffect(() => {
    setSurface(resolveSurfaceFromHost(window.location.hostname));
  }, []);

  return surface;
}
