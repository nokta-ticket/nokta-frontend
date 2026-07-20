"use client";

import {
  CalendarCheck,
  DollarSign,
  Ticket,
  TicketCheck,
} from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { isUnifiedDashboardEnabled } from "@/lib/feature-flags";
import { RouteRedirect } from "../../_components/route-redirect";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { ContentGrid } from "../../_components/page/content-grid";
import { MetricCard } from "../../_components/metric-card";
import { DataTable, type Column } from "../../_components/data-table";
import { ErrorState } from "../../_components/states/error-state";
import { EmptyState } from "../../_components/states/empty-state";
import {
  MetricsSkeleton,
  TableSkeleton,
} from "../../_components/states/loading-state";
import {
  useTicketsInicio,
  type EventoRow,
} from "../../_hooks/use-tickets-inicio";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<number, string> = {
  1: "Rascunho",
  2: "Publicado",
  3: "Cancelado",
  4: "Finalizado",
};

function TicketsInicioPage() {
  const { metrics, eventos, isLoading, isError, error, refetch } =
    useTicketsInicio();

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
        title="Início — Tickets"
        description="Resumo da operação de bilheteria da sua organização."
      />

      {isError ? (
        <ErrorState
          description={getErrorMessage(
            error,
            "Não foi possível carregar o início.",
          )}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
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
                description="Crie seu primeiro evento em Eventos para ver a atividade aqui."
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

/**
 * Com a navegação unificada (Fase 3) ligada, esta rota antiga vira um
 * redirect fino para a Início unificada (`/dashboard/inicio`) — ver
 * docs/platform/unified-navigation.md. Com a flag desligada, mantém o
 * conteúdo original acima intacto (fallback de rollback).
 */
export default function TicketsInicioPageRoute() {
  if (isUnifiedDashboardEnabled()) {
    return <RouteRedirect to="/dashboard/inicio" />;
  }
  return <TicketsInicioPage />;
}
