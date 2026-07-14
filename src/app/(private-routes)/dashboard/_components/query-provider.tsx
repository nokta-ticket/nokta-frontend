"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Camada de cache do dashboard (stale-while-revalidate).
 *
 * Ao revisitar uma página, o dado do cache aparece na hora e revalida em
 * segundo plano — skeleton só na primeiríssima carga. Cada painel/gráfico
 * futuro vira um useQuery com cache próprio, sem refetch a cada navegação.
 */
export function DashboardQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 60s "fresco": navegar de volta não refaz a requisição.
            staleTime: 60_000,
            // Mantém no cache por 5min mesmo sem observers montados.
            gcTime: 5 * 60_000,
            // Revalida ao voltar o foco (silencioso, sem skeleton).
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
