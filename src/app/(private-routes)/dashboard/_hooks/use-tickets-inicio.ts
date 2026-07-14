"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useOrganizations } from "@/context/OrganizationContext";

export interface Metrics {
  ingressosVendidos: number;
  ingressosDisponiveis: number;
  arrecadacaoTotal: number;
  eventosCriados: number;
}

export interface EventoRow {
  id: number;
  nome?: string;
  data?: string;
  status?: number | string;
}

async function fetchMetrics(): Promise<Metrics> {
  const { data } = await api.get<Metrics>("/produtor/metrics");
  return data;
}

async function fetchEventos(): Promise<EventoRow[]> {
  const { data } = await api.get("/produtor/eventos");
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Dados do Início — Tickets, com cache por organização.
 * A key inclui o org id para não vazar dado entre organizações ao trocar.
 */
export function useTicketsInicio() {
  const { currentOrg } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const metrics = useQuery({
    queryKey: ["tickets", "metrics", orgId],
    queryFn: fetchMetrics,
    enabled: orgId !== null,
  });

  const eventos = useQuery({
    queryKey: ["tickets", "eventos", orgId],
    queryFn: fetchEventos,
    enabled: orgId !== null,
  });

  return {
    metrics: metrics.data,
    eventos: eventos.data ?? [],
    // Skeleton só quando não há nada em cache ainda.
    isLoading:
      (metrics.isLoading || eventos.isLoading) &&
      (!metrics.data || !eventos.data),
    isError: metrics.isError || eventos.isError,
    error: metrics.error ?? eventos.error,
    refetch: () => {
      void metrics.refetch();
      void eventos.refetch();
    },
  };
}
