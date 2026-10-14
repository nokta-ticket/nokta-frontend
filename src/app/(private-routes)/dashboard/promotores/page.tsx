"use client";

import { useState } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { useTicketsAccess } from "@/context/TicketsAccessContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTab } from "../_hooks/use-url-tab";
import { usePromoterAnalytics } from "./_hooks/use-promoters";
import { PromotersTab } from "./_components/promoters-tab";
import { InvitePromoterDialog } from "./_components/invite-promoter-dialog";
import { AssignmentsTab } from "./_components/assignments-tab";
import { SalesAnalyticsTab } from "./_components/sales-analytics-tab";
import { SettlementsTab } from "./_components/settlements-tab";

const TABS = ["promoters", "atribuicoes", "vendas", "acertos"] as const;
type TabKey = (typeof TABS)[number];

export default function PromotoresPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useTicketsAccess();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "promoters");
  const [inviteOpen, setInviteOpen] = useState(false);
  const orgId = currentOrg?.id ?? null;
  const canView = can("tickets.promoters.view");
  const { data: metrics, isLoading: loadingMetrics } = usePromoterAnalytics(canView ? orgId : null);

  if (loadingOrgs || loadingAccess) {
    return (
      <div className="space-y-6">
        <PageHeader title="Promotores" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Promotores" />
        <EmptyState icon="megaphone" title="Nenhuma organização selecionada" description="Selecione uma organização para ver os promoters." />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Promotores" />
        <EmptyState icon="lock" title="Sem acesso" description="Você não tem permissão para ver os promoters desta organização." />
      </div>
    );
  }

  const canManage = can("tickets.promoters.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotores"
        actions={
          canManage ? (
            <Button leftIcon="user-plus" onClick={() => setInviteOpen(true)}>
              Convidar promoter
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Promoters ativos" icon="megaphone" value={metrics?.promotersAtivos} loading={loadingMetrics} hint={metrics ? `${metrics.linksAtivos} ${metrics.linksAtivos === 1 ? "link" : "links"} · ${metrics.codigosAtivos} ${metrics.codigosAtivos === 1 ? "código" : "códigos"}` : undefined} />
        <StatCard label="Pedidos pagos atribuídos" icon="receipt" value={metrics?.pedidosPagos} loading={loadingMetrics} hint={metrics ? `${metrics.ingressos} ingressos · ${metrics.cliquesUnicosEstimados.toLocaleString("pt-BR")} cliques únicos` : undefined} />
        <StatCard label="Comissão disponível" icon="hand-dollar" format="currency" value={metrics ? metrics.commissionAvailableCents / 100 : undefined} loading={loadingMetrics} hint={metrics ? `Pendente: ${(metrics.commissionPendingCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : undefined} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="-mx-4 px-4 lg:mx-0 lg:px-0">
        <TabsList variant="line" aria-label="Seções de promotores">
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="atribuicoes">Atribuições</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="acertos">Acertos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div key={tab} className="route-enter">
        {tab === "promoters" && <PromotersTab orgId={currentOrg.id} canManage={canManage} onInvite={() => setInviteOpen(true)} />}
        {tab === "atribuicoes" && <AssignmentsTab orgId={currentOrg.id} canManage={can("tickets.promoters.assignments.manage")} />}
        {tab === "vendas" && <SalesAnalyticsTab orgId={currentOrg.id} canExport={can("tickets.promoters.export")} />}
        {tab === "acertos" && <SettlementsTab orgId={currentOrg.id} canManageSettlements={can("tickets.promoters.settlements.manage")} />}
      </div>

      <InvitePromoterDialog orgId={currentOrg.id} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
