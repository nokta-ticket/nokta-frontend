"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  DollarSign,
  Ticket,
  TicketCheck,
} from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { PageState } from "@/components/ui/page-state";
import { useAuth } from "@/context/AuthContext";
import api, { getErrorMessage } from "@/lib/axios";
import MetricCard from "./_components/metric-card";
import { ChartAreaIngressos } from "./_components/chart-area-ingressos";

interface MetricsResponse {
  ingressosVendidos: number;
  ingressosDisponiveis: number;
  arrecadacaoTotal: number;
  eventosCriados: number;
}

export default function PainelMetrica() {
  const { user, isAuthResolved } = useAuth();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userLoaded = !!user?.nome && !!user?.sobrenome && !!user?.email;

  useEffect(() => {
    const refreshDone = Cookies.get("refreshDone");

    if (isAuthResolved && userLoaded && !refreshDone) {
      Cookies.set("refreshDone", "true", { expires: 0.01 });
      window.location.reload();
    }
  }, [isAuthResolved, userLoaded]);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<MetricsResponse>("/produtor/metrics");
      setMetrics(data);
    } catch (err) {
      setMetrics(null);
      setError(getErrorMessage(err, "Nao foi possivel carregar o painel."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthResolved && userLoaded) {
      void fetchMetrics();
    } else if (isAuthResolved) {
      setLoading(false);
    }
  }, [isAuthResolved, userLoaded]);

  if (!isAuthResolved || !userLoaded || loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-7 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageState
        title="Nao foi possivel carregar o painel"
        description={error}
        icon={<AlertCircle className="h-8 w-8 text-red-500" />}
        actionLabel="Tentar novamente"
        onAction={() => void fetchMetrics()}
      />
    );
  }

  if (!metrics) {
    return (
      <PageState
        title="Sem metricas disponiveis"
        description="Os indicadores do produtor aparecerao aqui quando seus eventos tiverem atividade."
        actionLabel="Atualizar"
        onAction={() => void fetchMetrics()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Ola, {user.nome} {user.sobrenome}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui estao as metricas do seu painel:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingressos vendidos"
          value={metrics.ingressosVendidos.toString()}
          icon={<TicketCheck className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Ingressos disponiveis"
          value={metrics.ingressosDisponiveis.toString()}
          icon={<Ticket className="h-5 w-5 text-yellow-500" />}
        />
        <MetricCard
          title="Arrecadacao total"
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

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void fetchMetrics()}>
          Atualizar metricas
        </Button>
      </div>

      <ChartAreaIngressos />
    </div>
  );
}
