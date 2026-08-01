"use client";

import { useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ArrowUpRight, CalendarDays, Compass, DollarSign, LayoutGrid, LineChart, Settings, Users } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { formatarDataCurta } from "@/lib/formatarData";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { ErrorState } from "../../_components/states/error-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { useDismissRecommendation, usePlatformHome, usePlatformNavigation, useRecommendations } from "../../_hooks/use-platform";
import { useTicketsFinanceTimeline } from "../_hooks/use-tickets-finance";
import { RecommendationsPanel } from "../../explorar/_components/recommendations-panel";
import { LegalFinancialPendingBanner } from "../../_components/legal-financial-pending-banner";
import { HomeChecklist } from "./home-checklist";

const QUICK_LINKS = [
  { key: "FINANCE", label: "Financeiro", description: "Faturamento e repasses", href: "/dashboard/financeiro", icon: DollarSign },
  { key: "INSIGHTS", label: "Insights", description: "Métricas do seu negócio", href: "/dashboard/insights", icon: LineChart },
  { key: "TEAM", label: "Equipe", description: "Membros e permissões", href: "/dashboard/equipe", icon: Users },
  { key: "SETTINGS", label: "Configurações", description: "Preferências da organização", href: "/dashboard/configuracoes", icon: Settings },
];

export function InicioContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const home = usePlatformHome(orgId);
  const navigation = usePlatformNavigation(orgId);
  const recommendations = useRecommendations(orgId);
  const dismiss = useDismissRecommendation(orgId ?? -1);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);
  const finance = useTicketsFinanceTimeline(orgId, { quickPeriod: "LAST_7_DAYS" });

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

  const { sections, checklist } = home.data;
  const hasAnySection = Boolean(sections.events || sections.operation || sections.reservations);
  const pendingChecklistGroups = checklist.filter((g) => g.items.some((i) => !i.done));
  const financeForbidden = isAxiosError(finance.error) && finance.error.response?.status === 403;
  const showFinanceCard = !financeForbidden;

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, { onSettled: () => setDismissingKey(null) });
  };

  return (
    <PageContainer>
      <PageHeader title={title} description="O que está acontecendo no seu negócio agora." />

      <LegalFinancialPendingBanner orgId={orgId} />

      {!recommendations.isError && (recommendations.data?.length ?? 0) > 0 ? (
        <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} />
      ) : null}

      {/* Painel Geral */}
      {hasAnySection ? (
        <section className="rounded-2xl bg-gradient-to-br from-[#1d1834] to-[#141020] p-6 text-white">
          <p className="mb-5 text-sm font-medium text-white/60">Panorama Geral</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sections.events ? (
              <Link href="/dashboard/eventos" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="mb-3 text-violet-300"><CalendarDays size={20} /></div>
                <p className="font-serif text-2xl font-bold">{sections.events.upcomingEventsCount}</p>
                <p className="mt-1 text-xs text-white/50">Próximos eventos</p>
              </Link>
            ) : null}
            {sections.operation ? (
              <Link href="/dashboard/operacao" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="mb-3 text-violet-300"><LayoutGrid size={20} /></div>
                <p className="font-serif text-2xl font-bold">{sections.operation.openTabsCount}</p>
                <p className="mt-1 text-xs text-white/50">Comandas abertas agora</p>
              </Link>
            ) : null}
            {sections.reservations ? (
              <Link href="/dashboard/reservas" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="mb-3 text-violet-300"><CalendarDays size={20} /></div>
                <p className="font-serif text-2xl font-bold">{sections.reservations.todayReservationsCount}</p>
                <p className="mt-1 text-xs text-white/50">Reservas de hoje</p>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Desempenho Financeiro */}
      {showFinanceCard ? <FinanceTimelineChart data={finance.data} isLoading={finance.isLoading} /> : null}

      {pendingChecklistGroups.length > 0 ? (
        <HomeChecklist groups={pendingChecklistGroups} />
      ) : !hasAnySection ? (
        <EmptyState
          title="Sua organização ainda não tem nada ativo"
          description="Explore a Nokta para ativar as funcionalidades que fazem sentido para o seu negócio."
        />
      ) : null}

      {sections.events?.nextEvent ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="text-xs font-medium text-black/50">Próximo evento</p>
          <p className="mt-1 font-medium text-gray-900">{sections.events.nextEvent.nome}</p>
          <p className="text-black/60">{formatarDataCurta(sections.events.nextEvent.data)}</p>
        </div>
      ) : null}

      {/* Ações Rápidas */}
      <div>
        <p className="mb-3 text-lg font-semibold tracking-tight">Ações Rápidas</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ key, label, description, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group relative flex min-h-[140px] flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Icon size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-1 text-xs text-black/50">{description}</p>
              <span className="absolute bottom-3.5 right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight size={13} />
              </span>
            </Link>
          ))}
          {navigation.data?.canExplore ? (
            <Link
              href="/dashboard/explorar"
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-4 text-center text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Compass size={20} />
              Explore a Nokta
            </Link>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
