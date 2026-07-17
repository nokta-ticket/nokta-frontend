"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Sincroniza a aba ativa de uma página com `?tab=` na URL — refresh mantém a
 * aba, links diretos funcionam, e um valor inválido/não permitido volta
 * silenciosamente para a aba padrão (nunca cria loop, pois só substitui a URL
 * quando o valor realmente muda).
 */
export function useUrlTab<T extends string>(validTabs: readonly T[], defaultTab: T): [T, (tab: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tab");
  const current = (validTabs as readonly string[]).includes(raw ?? "") ? (raw as T) : defaultTab;

  useEffect(() => {
    if (raw !== current) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", current);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, current]);

  const setTab = useCallback(
    (tab: T) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [current, setTab];
}
