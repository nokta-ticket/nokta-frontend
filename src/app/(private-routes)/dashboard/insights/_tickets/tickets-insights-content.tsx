"use client";

import { useEffect, useState } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ChartAreaIngressos } from "./_components/chart-area-ingressos";

interface MetricsResponse {
  ingressosVendidos: number;
  ingressosDisponiveis: number;
  arrecadacaoTotal: number;
  eventosCriados: number;
}

/**
 * Bloco de Insights de Tickets — migrado de `/produtor/metricas` (Fase 5).
 * Escopado pela organização ativa (`organizationId`), não mais por `userId`
 * — ver docs/platform/unified-navigation.md "Fase 5".
 */
export default function TicketsInsightsPage() {
  const { currentOrg } = useOrganizations();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function fetchMetrics() {
    if (!currentOrg) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<MetricsResponse>("/produtor/metrics", { params: { organizationId: currentOrg.id } });
      setMetrics(data);
    } catch (err) {
      setMetrics(null);
      setError(getErrorMessage(err, "Não foi possível carregar as métricas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id]);

  if (!currentOrg) return null;

  const refresh = () => {
    void fetchMetrics();
    setRefreshKey((k) => k + 1);
  };

  const sold = metrics?.ingressosVendidos ?? 0;
  const available = metrics?.ingressosDisponiveis ?? 0;
  const capacity = sold + available;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="Desempenho de vendas de ingressos desta organização."
        actions={
          <Button variant="subtle" size="icon" aria-label="Atualizar métricas" title="Atualizar" onClick={refresh}>
            <Icon name="refresh" size={14} className={cn(loading && "animate-spin")} />
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Não foi possível carregar as métricas" description={error} onRetry={refresh} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Ingressos vendidos" icon="ticket" value={metrics?.ingressosVendidos} loading={loading} hint={capacity > 0 ? `${Math.round((sold / capacity) * 100)}% da capacidade` : undefined} />
          <StatCard label="Ingressos disponíveis" icon="ticket-simple" value={metrics?.ingressosDisponiveis} loading={loading} hint="Ainda à venda" />
          <StatCard label="Arrecadação" icon="sack-dollar" format="currency" value={metrics?.arrecadacaoTotal} loading={loading} hint="Valor dos ingressos vendidos" />
          <StatCard label="Eventos criados" icon="calendar" value={metrics?.eventosCriados} loading={loading} />
        </div>
      )}

      <ChartAreaIngressos key={refreshKey} organizationId={currentOrg.id} />
    </div>
  );
}
