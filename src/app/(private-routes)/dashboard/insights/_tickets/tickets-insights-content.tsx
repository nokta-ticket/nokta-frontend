"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarCheck, DollarSign, Ticket, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageState } from "@/components/ui/page-state";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import MetricCard from "./_components/metric-card";
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

  async function fetchMetrics() {
    if (!currentOrg) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<MetricsResponse>("/produtor/metrics", {
        params: { organizationId: currentOrg.id },
      });
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

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Insights — Tickets" description="Desempenho de vendas de ingressos." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Insights — Tickets" description="Desempenho de vendas de ingressos." />
        <PageState
          title="Não foi possível carregar as métricas"
          description={error}
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          actionLabel="Tentar novamente"
          onAction={() => void fetchMetrics()}
        />
      </PageContainer>
    );
  }

  if (!metrics) {
    return (
      <PageContainer>
        <PageHeader title="Insights — Tickets" description="Desempenho de vendas de ingressos." />
        <PageState
          title="Sem métricas disponíveis"
          description="Os indicadores aparecerão aqui quando seus eventos tiverem atividade."
          actionLabel="Atualizar"
          onAction={() => void fetchMetrics()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Insights — Tickets" description="Desempenho de vendas de ingressos desta organização." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingressos vendidos"
          value={metrics.ingressosVendidos.toString()}
          icon={<TicketCheck className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Ingressos disponíveis"
          value={metrics.ingressosDisponiveis.toString()}
          icon={<Ticket className="h-5 w-5 text-yellow-500" />}
        />
        <MetricCard
          title="Arrecadação total"
          value={`R$ ${metrics.arrecadacaoTotal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Eventos criados"
          value={metrics.eventosCriados.toString()}
          icon={<CalendarCheck className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={() => void fetchMetrics()}>
          Atualizar métricas
        </Button>
      </div>

      <div className="mt-4">
        <ChartAreaIngressos organizationId={currentOrg.id} />
      </div>
    </PageContainer>
  );
}
