"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  DollarSign,
  Ticket,
  TicketCheck,
} from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { ContentGrid } from "../_components/page/content-grid";
import { MetricCard } from "../_components/metric-card";
import { DataTable, type Column } from "../_components/data-table";
import { ErrorState } from "../_components/states/error-state";
import { EmptyState } from "../_components/states/empty-state";
import {
  MetricsSkeleton,
  TableSkeleton,
} from "../_components/states/loading-state";

interface Metrics {
  ingressosVendidos: number;
  ingressosDisponiveis: number;
  arrecadacaoTotal: number;
  eventosCriados: number;
}

interface EventoRow {
  id: number;
  nome?: string;
  data?: string;
  status?: number | string;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<number, string> = {
  1: "Rascunho",
  2: "Publicado",
  3: "Cancelado",
  4: "Finalizado",
};

export default function InicioPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, e] = await Promise.all([
        api.get<Metrics>("/produtor/metrics"),
        api.get("/produtor/eventos"),
      ]);
      setMetrics(m.data);
      const list = Array.isArray(e.data?.data)
        ? e.data.data
        : Array.isArray(e.data)
          ? e.data
          : [];
      setEventos(list);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o início."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<EventoRow>[] = [
    { key: "nome", header: "Evento", render: (r) => r.nome ?? "—" },
    {
      key: "data",
      header: "Data",
      render: (r) =>
        r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        typeof r.status === "number"
          ? (STATUS_LABEL[r.status] ?? String(r.status))
          : (r.status ?? "—"),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Início"
        description="Resumo da operação da sua organização."
      />

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading ? (
        <>
          <MetricsSkeleton />
          <TableSkeleton />
        </>
      ) : (
        <>
          <ContentGrid cols={4}>
            <MetricCard
              label="Ingressos vendidos"
              value={String(metrics?.ingressosVendidos ?? 0)}
              icon={<TicketCheck size={16} />}
              delta={null}
            />
            <MetricCard
              label="Ingressos disponíveis"
              value={String(metrics?.ingressosDisponiveis ?? 0)}
              icon={<Ticket size={16} />}
              delta={null}
            />
            <MetricCard
              label="Arrecadação"
              value={brl(metrics?.arrecadacaoTotal ?? 0)}
              icon={<DollarSign size={16} />}
              delta={null}
            />
            <MetricCard
              label="Eventos criados"
              value={String(metrics?.eventosCriados ?? 0)}
              icon={<CalendarCheck size={16} />}
              delta={null}
            />
          </ContentGrid>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Atividade recente</h2>
            {eventos.length === 0 ? (
              <EmptyState
                title="Nenhum evento ainda"
                description="Crie seu primeiro evento em Tickets para ver a atividade aqui."
              />
            ) : (
              <DataTable columns={columns} data={eventos} pageSize={5} />
            )}
          </section>
        </>
      )}
    </PageContainer>
  );
}
