"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import api, { getErrorMessage } from "@/lib/axios";
import { RefreshButton } from "../_components/refresh-button";
import { ADMIN_NAV } from "../_lib/nav";
import { ChartAreaLinear } from "./_components/chart-area-linear";

interface DashboardData {
  users: number;
  events: number;
  ticketsSold: number;
  totalRevenue: number;
}

const SHORTCUTS = ADMIN_NAV.flatMap((g) => g.items).filter((i) => ["/admin/usuarios", "/admin/workspaces", "/admin/juridico-financeiro", "/admin/pedidos-produtor", "/admin/evidencias", "/admin/ingressos"].includes(i.href));

export default function DashboardAdmin() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>("/admin/dashboard");
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o dashboard."));
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Métricas globais da plataforma." actions={<RefreshButton onClick={() => void load()} pending={pending} />} />

      {error && !data ? (
        <ErrorState title="Não deu pra carregar o dashboard" description={error} onRetry={() => void load()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuários cadastrados" icon="users" value={data?.users} loading={!data} className="slide-up" />
          <StatCard label="Eventos criados" icon="calendar" value={data?.events} loading={!data} className="slide-up [--i:1]" />
          <StatCard label="Ingressos vendidos" icon="ticket" value={data?.ticketsSold} loading={!data} className="slide-up [--i:2]" />
          <StatCard label="Faturamento total" icon="sack-dollar" value={data?.totalRevenue} format="currency" loading={!data} className="slide-up [--i:3]" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartAreaLinear />
        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <ul className="divide-y divide-border">
              {SHORTCUTS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-3 py-3 text-sm font-medium text-foreground transition-colors hover:text-brand">
                    <Icon name={item.icon} size={14} fw className="text-muted-foreground group-hover:text-brand" />
                    <span className="flex-1">{item.label}</span>
                    <Icon name="chevron-right" size={11} className="text-subtle-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
