"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";

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
            // 401 é estado de autenticação, não erro transitório — tentar de
            // novo só atrasa o redirect que o AuthContext/interceptor do axios
            // já vão disparar. Demais erros (rede, 5xx) continuam com 1 retry.
            retry: (failureCount, error) => {
              if (axios.isAxiosError(error) && error.response?.status === 401) return false;
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
