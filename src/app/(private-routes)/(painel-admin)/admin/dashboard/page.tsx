"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  DollarSign,
  RefreshCcw,
  TicketCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageState } from "@/components/ui/page-state";
import api, { getErrorMessage } from "@/lib/axios";
import MetricCard from "./_components/metric-card";
import { ChartAreaLinear } from "./_components/chart-area-linear";

interface DashboardData {
  users: number;
  events: number;
  ticketsSold: number;
  totalRevenue: number;
}

export default function DashboardAdmin() {
  const [usersTotal, setUsersTotal] = useState<number>();
  const [eventsTotal, setEventsTotal] = useState<number>();
  const [faturamentoTotal, setFaturamentoTotal] = useState<number>();
  const [ingressosVendidos, setIngressosVendidos] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getDashboardData() {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<DashboardData>("/admin/dashboard");
      setUsersTotal(data.users);
      setEventsTotal(data.events);
      setFaturamentoTotal(data.totalRevenue);
      setIngressosVendidos(data.ticketsSold);
    } catch (err) {
      setError(getErrorMessage(err, "Nao foi possivel carregar o dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getDashboardData();
  }, []);

  if (loading) {
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
        title="Nao foi possivel carregar o dashboard"
        description={error}
        icon={<AlertCircle className="h-8 w-8 text-red-500" />}
        actionLabel="Tentar novamente"
        onAction={() => void getDashboardData()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ola, Administrador</h1>
        <p className="mt-1 text-muted-foreground">
          Aqui estao as metricas globais da plataforma:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Usuarios cadastrados"
          value={usersTotal?.toString() ?? "--"}
          icon={<User className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Eventos criados"
          value={eventsTotal?.toString() ?? "--"}
          icon={<CalendarCheck className="h-5 w-5 text-purple-500" />}
        />
        <MetricCard
          title="Faturamento total"
          value={`R$ ${
            faturamentoTotal?.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "--"
          }`}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
        />
        <MetricCard
          title="Ingressos vendidos"
          value={ingressosVendidos?.toString() || "--"}
          icon={<TicketCheck className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void getDashboardData()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar metricas
        </Button>
      </div>

      <ChartAreaLinear />
    </div>
  );
}
