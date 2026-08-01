"use client";

import { useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Compass,
  DollarSign,
  Eye,
  EyeOff,
  LayoutGrid,
  LineChart,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { formatarDataCurta } from "@/lib/formatarData";
import { formatCentsBRL } from "@/services/venue-finance";
import { PageContainer } from "../../_components/page/page-container";
import { EmptyState } from "../../_components/states/empty-state";
import { ErrorState } from "../../_components/states/error-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { GoalProgressCard } from "../../_components/goal-progress-card";
import { useDismissRecommendation, usePlatformHome, usePlatformNavigation, useRecommendations } from "../../_hooks/use-platform";
import { useTicketsFinanceTimeline } from "../_hooks/use-tickets-finance";
import { RecommendationsPanel } from "../../explorar/_components/recommendations-panel";
import { LegalFinancialPendingBanner } from "../../_components/legal-financial-pending-banner";
import { HomeChecklist } from "./home-checklist";

const QUICK_LINKS = [
  { key: "OPERATION", label: "Novo Pedido", description: "Abrir comanda para mesa", href: "/dashboard/operacao", icon: LayoutGrid },
  { key: "RESERVATION", label: "Nova Reserva", description: "Criar uma nova reserva", href: "/dashboard/reservas", icon: CalendarDays },
  { key: "EVENT", label: "Novo Evento", description: "Cadastrar um novo evento", href: "/dashboard/eventos/criar", icon: Ticket },
  { key: "SETTINGS", label: "Configurações", description: "Preferências da organização", href: "/dashboard/configuracoes", icon: Settings },
];

const BUSINESS_OVERVIEW = [
  { key: "FINANCE", label: "Financeiro", metric: "Contas a receber", icon: DollarSign, href: "/dashboard/financeiro", cta: "Ver financeiro" },
  { key: "INSIGHTS", label: "Insights", metric: "Métricas do negócio", icon: LineChart, href: "/dashboard/insights", cta: "Ver insights" },
  { key: "TEAM", label: "Equipe", metric: "Membros e permissões", icon: Users, href: "/dashboard/equipe", cta: "Ver equipe" },
];

export function InicioContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const home = usePlatformHome(orgId);
  const navigation = usePlatformNavigation(orgId);
  const recommendations = useRecommendations(orgId);
  const dismiss = useDismissRecommendation(orgId ?? -1);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);
  const [hideValues, setHideValues] = useState(false);

  const finance = useTicketsFinanceTimeline(orgId, { quickPeriod: "LAST_7_DAYS" });
  const financeThisMonth = useTicketsFinanceTimeline(orgId, { quickPeriod: "THIS_MONTH" });
  const financeLastMonth = useTicketsFinanceTimeline(orgId, { quickPeriod: "LAST_MONTH" });

  const title = currentOrg ? `Olá, ${currentOrg.nome.split(" ")[0]}` : "Início";

  if (loadingOrgs) {
    return (
      <PageContainer>
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (home.isError) {
    return (
      <PageContainer>
        <ErrorState description="Não foi possível carregar a Início." onRetry={() => home.refetch()} />
      </PageContainer>
    );
  }

  if (home.isLoading || !home.data) {
    return (
      <PageContainer>
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const { sections, checklist } = home.data;
  const hasAnySection = Boolean(sections.events || sections.operation || sections.reservations);
  const pendingChecklistGroups = checklist.filter((g) => g.items.some((i) => !i.done));
  const financeForbidden = isAxiosError(finance.error) && finance.error.response?.status === 403;
  const showFinanceCard = !financeForbidden;
  const thisMonthCents = (financeThisMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const lastMonthCents = (financeLastMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);

  const panoramaTiles = [
    sections.events
      ? {
          key: "events",
          href: "/dashboard/eventos",
          icon: <CalendarDays size={20} strokeWidth={1.8} />,
          value: sections.events.upcomingEventsCount,
          label: "Próximos eventos",
        }
      : null,
    sections.operation
      ? {
          key: "operation",
          href: "/dashboard/operacao",
          icon: <LayoutGrid size={20} strokeWidth={1.8} />,
          value: sections.operation.openTabsCount,
          label: "Comandas abertas agora",
        }
      : null,
    sections.reservations
      ? {
          key: "reservations",
          href: "/dashboard/reservas",
          icon: <CalendarDays size={20} strokeWidth={1.8} />,
          value: sections.reservations.todayReservationsCount,
          label: "Reservas de hoje",
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => t !== null);

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, { onSettled: () => setDismissingKey(null) });
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-poppins text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">{title}! 👋</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Aqui está o panorama do seu negócio hoje.</p>
        </div>
      </div>

      <LegalFinancialPendingBanner orgId={orgId} />

      {!recommendations.isError && (recommendations.data?.length ?? 0) > 0 ? (
        <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} />
      ) : null}

      {/* Row 1 — Panorama Geral | Desempenho Financeiro | Progresso do Mês */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.12fr_0.66fr]">
        {hasAnySection ? (
          <section className="flex flex-col rounded-[22px] bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] p-6 text-white shadow-[0_10px_30px_rgba(28,24,48,0.25)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Panorama Geral</h3>
              <button
                onClick={() => setHideValues((v) => !v)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white/80"
              >
                {hideValues ? <Eye size={16} /> : <EyeOff size={16} />}
                {hideValues ? "Mostrar valores" : "Ocultar valores"}
              </button>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-[13.5px] text-white/60">Faturamento do mês</p>
              <p className={`font-poppins text-[28px] font-bold tracking-tight ${hideValues ? "blur-md" : ""}`}>
                {financeThisMonth.isLoading ? "—" : formatCentsBRL(thisMonthCents)}
              </p>
            </div>

            <div
              className={`mt-auto grid gap-3 ${panoramaTiles.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
            >
              {panoramaTiles.map((tile) => (
                <Link key={tile.key} href={tile.href} className="rounded-2xl bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.1]">
                  <div className="mb-3.5 text-violet-300">{tile.icon}</div>
                  <p className={`font-poppins text-xl font-bold ${hideValues ? "blur-md" : ""}`}>{tile.value}</p>
                  <p className="mt-0.5 text-xs text-white/50">{tile.label}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {showFinanceCard ? (
          <FinanceTimelineChart
            data={finance.data}
            isLoading={finance.isLoading}
            className="rounded-[22px] shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]"
          />
        ) : null}

        {showFinanceCard ? (
          <GoalProgressCard
            currentCents={thisMonthCents}
            previousCents={lastMonthCents}
            isLoading={financeThisMonth.isLoading || financeLastMonth.isLoading}
          />
        ) : null}
      </div>

      {/* Row 2 — Indicadores do Dia | Ações Rápidas */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_2.55fr]">
        <div className="rounded-[22px] border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]">
          <p className="mb-2 text-[17px] font-semibold text-gray-900">Indicadores do Dia</p>
          <div className="divide-y divide-black/5">
            {sections.events ? (
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-violet-200 text-violet-500">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span className="text-[14.5px] font-medium text-gray-900">Próximos eventos</span>
                <span className="ml-auto text-sm font-semibold">{sections.events.upcomingEventsCount}</span>
              </div>
            ) : null}
            {sections.operation ? (
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-violet-200 text-violet-500">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span className="text-[14.5px] font-medium text-gray-900">Comandas abertas agora</span>
                <span className="ml-auto text-sm font-semibold">{sections.operation.openTabsCount}</span>
              </div>
            ) : null}
            {sections.reservations ? (
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-violet-200 text-violet-500">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span className="text-[14.5px] font-medium text-gray-900">Reservas de hoje</span>
                <span className="ml-auto text-sm font-semibold">{sections.reservations.todayReservationsCount}</span>
              </div>
            ) : null}
            {!hasAnySection ? <p className="py-3 text-sm text-black/50">Nada para mostrar ainda hoje.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-poppins text-[19px] font-semibold tracking-tight text-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK_LINKS.map(({ key, label, description, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className="group relative flex min-h-[158px] flex-col rounded-2xl bg-white p-[18px] shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)] transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h4 className="text-[15px] font-semibold text-gray-900">{label}</h4>
                <p className="mt-1 text-[12.5px] leading-tight text-black/50">{description}</p>
                <span className="absolute bottom-3.5 right-3.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={14} strokeWidth={2.2} />
                </span>
              </Link>
            ))}
            {navigation.data?.canExplore ? (
              <Link
                href="/dashboard/explorar"
                className="flex min-h-[158px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-transparent p-4 text-center text-sm font-semibold text-black/60 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
              >
                <Compass size={20} />
                Explore a Nokta
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {pendingChecklistGroups.length > 0 ? (
        <HomeChecklist groups={pendingChecklistGroups} />
      ) : !hasAnySection ? (
        <EmptyState
          title="Sua organização ainda não tem nada ativo"
          description="Explore a Nokta para ativar as funcionalidades que fazem sentido para o seu negócio."
        />
      ) : null}

      {sections.events?.nextEvent ? (
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-[0_1px_2px_rgba(28,24,48,0.05)]">
          <p className="text-xs font-medium text-black/50">Próximo evento</p>
          <p className="mt-1 font-medium text-gray-900">{sections.events.nextEvent.nome}</p>
          <p className="text-black/60">{formatarDataCurta(sections.events.nextEvent.data)}</p>
        </div>
      ) : null}

      {/* Visão Geral do Negócio */}
      <div>
        <h2 className="mb-4 font-poppins text-[19px] font-semibold tracking-tight text-foreground">Visão Geral do Negócio</h2>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]">
            <div className="mb-[18px] flex items-center gap-2.5">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-violet-100 text-violet-600">
                <Ticket size={19} strokeWidth={1.8} />
              </span>
              <h4 className="text-[16px] font-semibold text-gray-900">Eventos</h4>
            </div>
            <p className="mb-1.5 text-[13px] text-black/60">Próximos eventos</p>
            <p className="font-poppins text-[28px] font-bold leading-none tracking-tight text-foreground">
              {sections.events?.upcomingEventsCount ?? "—"}
            </p>
            <div className="mb-4 mt-4" />
            <Link
              href="/dashboard/eventos"
              className="mt-auto flex h-[42px] items-center justify-center rounded-xl border border-black/10 bg-white text-[13.5px] font-semibold text-violet-600 transition-colors hover:bg-violet-50"
            >
              Ver eventos
            </Link>
          </div>

          {BUSINESS_OVERVIEW.map(({ key, label, metric, icon: Icon, href, cta }) => (
            <div key={key} className="flex flex-col rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]">
              <div className="mb-[18px] flex items-center gap-2.5">
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-violet-100 text-violet-600">
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <h4 className="text-[16px] font-semibold text-gray-900">{label}</h4>
              </div>
              <p className="mb-1.5 text-[13px] text-black/60">{metric}</p>
              <div className="mb-4 mt-4" />
              <Link
                href={href}
                className="mt-auto flex h-[42px] items-center justify-center rounded-xl border border-black/10 bg-white text-[13.5px] font-semibold text-violet-600 transition-colors hover:bg-violet-50"
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
