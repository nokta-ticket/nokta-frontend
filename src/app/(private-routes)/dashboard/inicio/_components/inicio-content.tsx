"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Compass, DollarSign, LayoutGrid, LineChart, Settings, Users } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { formatarDataCurta } from "@/lib/formatarData";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { ErrorState } from "../../_components/states/error-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { MetricCard } from "../../_components/metric-card";
import { useDismissRecommendation, usePlatformHome, usePlatformNavigation, useRecommendations } from "../../_hooks/use-platform";
import { RecommendationsPanel } from "../../explorar/_components/recommendations-panel";

const QUICK_LINKS = [
  { key: "FINANCE", label: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { key: "INSIGHTS", label: "Insights", href: "/dashboard/insights", icon: LineChart },
  { key: "TEAM", label: "Equipe", href: "/dashboard/equipe", icon: Users },
  { key: "SETTINGS", label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

export function InicioContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const home = usePlatformHome(orgId);
  const navigation = usePlatformNavigation(orgId);
  const recommendations = useRecommendations(orgId);
  const dismiss = useDismissRecommendation(orgId ?? -1);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);

  const title = currentOrg ? `Olá, ${currentOrg.nome}` : "Início";

  if (loadingOrgs) {
    return (
      <PageContainer>
        <PageHeader title="Início" />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader title="Início" />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (home.isError) {
    return (
      <PageContainer>
        <PageHeader title={title} />
        <ErrorState description="Não foi possível carregar a Início." onRetry={() => home.refetch()} />
      </PageContainer>
    );
  }

  if (home.isLoading || !home.data) {
    return (
      <PageContainer>
        <PageHeader title={title} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const { sections } = home.data;
  const hasAnySection = Boolean(sections.events || sections.operation || sections.reservations);

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, { onSettled: () => setDismissingKey(null) });
  };

  return (
    <PageContainer>
      <PageHeader title={title} description="O que está acontecendo no seu negócio agora." />

      {!recommendations.isError && (recommendations.data?.length ?? 0) > 0 ? (
        <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} />
      ) : null}

      {!hasAnySection ? (
        <EmptyState
          title="Sua organização ainda não tem nada ativo"
          description="Explore a Nokta para ativar as funcionalidades que fazem sentido para o seu negócio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.events ? (
            <Link href="/dashboard/eventos" className="contents">
              <MetricCard
                label="Próximos eventos"
                value={String(sections.events.upcomingEventsCount)}
                icon={<CalendarDays size={16} />}
              />
            </Link>
          ) : null}

          {sections.operation ? (
            <Link href="/dashboard/operacao" className="contents">
              <MetricCard label="Comandas abertas agora" value={String(sections.operation.openTabsCount)} icon={<LayoutGrid size={16} />} />
            </Link>
          ) : null}

          {sections.reservations ? (
            <Link href="/dashboard/reservas" className="contents">
              <MetricCard label="Reservas de hoje" value={String(sections.reservations.todayReservationsCount)} icon={<CalendarDays size={16} />} />
            </Link>
          ) : null}
        </div>
      )}

      {sections.events?.nextEvent ? (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
          <p className="text-xs font-medium text-black/50">Próximo evento</p>
          <p className="mt-1 font-medium text-gray-900">{sections.events.nextEvent.nome}</p>
          <p className="text-black/60">{formatarDataCurta(sections.events.nextEvent.data)}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-black/70">Gestão</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_LINKS.map(({ key, label, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm hover:border-violet-300 hover:bg-violet-50"
            >
              <Icon size={16} className="text-violet-600" />
              {label}
            </Link>
          ))}
          {navigation.data?.canExplore ? (
            <Link
              href="/dashboard/explorar"
              className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-800 hover:bg-violet-100"
            >
              <Compass size={16} />
              Explore a Nokta
            </Link>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
