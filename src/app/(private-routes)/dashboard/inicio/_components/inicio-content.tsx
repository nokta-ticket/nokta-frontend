"use client";

import { useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodLabel, periodToFinanceParams, usePeriod } from "@/context/PeriodContext";
import { formatarDataCurta } from "@/lib/formatarData";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { LegalFinancialPendingBanner } from "../../_components/legal-financial-pending-banner";
import { MonthRevenueCard } from "../../_components/month-revenue-card";
import { useDismissRecommendation, usePlatformHome, usePlatformNavigation, useRecommendations } from "../../_hooks/use-platform";
import { RecommendationsPanel } from "../../explorar/_components/recommendations-panel";
import { useTicketsFinanceTimeline } from "../_hooks/use-tickets-finance";
import { HomeChecklist } from "./home-checklist";

type Shortcut = { key: string; label: string; description: string; href: string; icon: IconName };

const SHORTCUTS: Shortcut[] = [
  { key: "EVENT", label: "Novo evento", description: "Cadastrar um novo evento", href: "/dashboard/eventos/criar", icon: "calendar-plus" },
  { key: "EVENTS", label: "Eventos", description: "Ver e editar seus eventos", href: "/dashboard/eventos", icon: "calendar" },
  { key: "FINANCE", label: "Financeiro", description: "Saldo, extrato e saques", href: "/dashboard/financeiro", icon: "wallet" },
  { key: "INSIGHTS", label: "Insights", description: "Métricas do negócio", href: "/dashboard/insights", icon: "chart-line" },
  { key: "TEAM", label: "Equipe", description: "Membros e permissões", href: "/dashboard/equipe", icon: "users" },
  { key: "SETTINGS", label: "Configurações", description: "Preferências da organização", href: "/dashboard/configuracoes", icon: "settings" },
];

const OPERATION_SHORTCUT: Shortcut = { key: "OPERATION", label: "Mesas e comandas", description: "Abrir comanda para mesa", href: "/dashboard/operacao", icon: "chair" };
const RESERVATION_SHORTCUT: Shortcut = { key: "RESERVATION", label: "Reservas", description: "Criar uma nova reserva", href: "/dashboard/reservas", icon: "calendar-check" };

export function InicioSkeleton({ title = "Início" }: { title?: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
      <Skeleton className="h-40 rounded-card" />
    </div>
  );
}

function ShortcutCard({ shortcut, index }: { shortcut: Shortcut; index: number }) {
  return (
    <Link href={shortcut.href} className="group fade-up block min-w-0" style={{ ["--i" as string]: index } as never}>
      <Card interactive className="h-full gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <Icon name={shortcut.icon} size={16} className="transition-colors group-hover:text-brand" />
          <Icon name="arrow-right" size={11} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{shortcut.label}</p>
          <p className="mt-0.5 truncate text-caption text-muted-foreground">{shortcut.description}</p>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Início da organização sem bar e restaurante (só Tickets, ou híbrida nesta
 * fase), orientada pelo endpoint Home v1 + timelines financeiras do Tickets.
 * O gráfico e o faturamento seguem o filtro de período da topbar; o card
 * "Este mês" continua comparando este mês com o anterior.
 */
export function InicioContent() {
  const { user } = useAuth();
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const home = usePlatformHome(orgId);
  const navigation = usePlatformNavigation(orgId);
  const recommendations = useRecommendations(orgId);
  const dismiss = useDismissRecommendation(orgId ?? -1);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);
  const [hideValues, setHideValues] = useState(false);

  const { period } = usePeriod();
  const finance = useTicketsFinanceTimeline(orgId, periodToFinanceParams(period));
  const financeThisMonth = useTicketsFinanceTimeline(orgId, { quickPeriod: "THIS_MONTH" });
  const financeLastMonth = useTicketsFinanceTimeline(orgId, { quickPeriod: "LAST_MONTH" });

  const firstName = user?.nome?.trim().split(/\s+/)[0] ?? currentOrg?.nome.split(" ")[0];
  const title = firstName ? `Olá, ${firstName}` : "Início";

  if (loadingOrgs) return <InicioSkeleton title={title} />;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </div>
    );
  }

  if (home.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <ErrorState description="Não foi possível carregar a Início." onRetry={() => home.refetch()} />
      </div>
    );
  }

  if (home.isLoading || !home.data) return <InicioSkeleton title={title} />;

  const { sections, checklist } = home.data;
  const hasAnySection = Boolean(sections.events || sections.operation || sections.reservations);
  const pendingChecklistGroups = checklist.filter((g) => g.items.some((i) => !i.done));
  const financeForbidden = isAxiosError(finance.error) && finance.error.response?.status === 403;
  const showFinance = !financeForbidden;
  const periodCents = (finance.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const thisMonthCents = (financeThisMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const lastMonthCents = (financeLastMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, { onSettled: () => setDismissingKey(null) });
  };

  // Sempre 3 cards: faturamento do período (quando a pessoa pode ver), depois
  // os indicadores das seções ativas, completando com "Este mês".
  const stats: { key: string; node: React.ReactNode }[] = [];
  const blur = cn(hideValues && "[&_.text-stat]:blur-md [&_.text-stat]:select-none");
  if (showFinance) stats.push({ key: "revenue", node: <StatCard label={`Faturamento · ${periodLabel(period)}`} icon="money" format="currency" value={periodCents / 100} loading={finance.isLoading} className={blur} /> });
  if (sections.events) stats.push({ key: "events", node: <StatCard label="Próximos eventos" icon="calendar" value={sections.events.upcomingEventsCount} hint={sections.events.nextEvent ? `Próximo: ${sections.events.nextEvent.nome}` : "Nenhum evento agendado"} /> });
  if (sections.operation) stats.push({ key: "operation", node: <StatCard label="Comandas abertas agora" icon="chair" value={sections.operation.openTabsCount} hint={`${sections.operation.openCashSessionsCount} caixa${sections.operation.openCashSessionsCount === 1 ? "" : "s"} aberto${sections.operation.openCashSessionsCount === 1 ? "" : "s"}`} /> });
  if (sections.reservations) stats.push({ key: "reservations", node: <StatCard label="Reservas de hoje" icon="calendar-check" value={sections.reservations.todayReservationsCount} /> });
  if (showFinance) stats.push({ key: "month", node: <StatCard label="Faturamento este mês" icon="chart-line" format="currency" value={thisMonthCents / 100} loading={financeThisMonth.isLoading} className={blur} /> });
  const visibleStats = stats.slice(0, 3);

  const shortcuts = [...SHORTCUTS];
  if (sections.operation) shortcuts.splice(1, 0, OPERATION_SHORTCUT);
  if (sections.reservations) shortcuts.splice(sections.operation ? 2 : 1, 0, RESERVATION_SHORTCUT);
  const nextEvent = sections.events?.nextEvent ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        meta={<span>{currentOrg?.nome}</span>}
        actions={
          <>
            {showFinance ? (
              <Button variant="subtle" size="sm" leftIcon={hideValues ? "eye" : "eye-slash"} onClick={() => setHideValues((v) => !v)} aria-pressed={hideValues}>
                {hideValues ? "Mostrar valores" : "Ocultar valores"}
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link href="/dashboard/eventos/criar">
                <Icon name="plus" size={14} />
                Novo evento
              </Link>
            </Button>
          </>
        }
      />

      <LegalFinancialPendingBanner orgId={orgId} />

      {!recommendations.isError && (recommendations.data?.length ?? 0) > 0 ? <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} /> : null}

      {visibleStats.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {visibleStats.map((s, i) => (
            <div key={s.key} className="slide-up min-w-0" style={{ ["--i" as string]: i } as never}>
              {s.node}
            </div>
          ))}
        </div>
      ) : null}

      {showFinance ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <FinanceTimelineChart data={finance.data} isLoading={finance.isLoading} description={`Faturamento e resultado · ${periodLabel(period)}`} hideValues={hideValues} className="min-w-0" />
          <MonthRevenueCard currentCents={thisMonthCents} previousCents={lastMonthCents} isLoading={financeThisMonth.isLoading || financeLastMonth.isLoading} hideValues={hideValues} />
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeader title="Atalhos" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {shortcuts.map((s, i) => (
            <ShortcutCard key={s.key} shortcut={s} index={i} />
          ))}
          {navigation.data?.canExplore ? (
            <Link href="/dashboard/explorar" className="fade-up flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-strong p-4 text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand" style={{ ["--i" as string]: shortcuts.length } as never}>
              <Icon name="compass" size={18} />
              Explore a Nokta
            </Link>
          ) : null}
        </div>
      </section>

      {nextEvent ? (
        <section className="space-y-4">
          <SectionHeader
            title="Próximo evento"
            action={
              <Link href="/dashboard/eventos" className="text-sm font-semibold text-brand hover:underline">
                Ver todos
              </Link>
            }
          />
          <Link href={`/dashboard/eventos/${nextEvent.id}`} className="block">
            <Card interactive glow className="flex-row items-center gap-4 p-4 sm:p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name="ticket" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">{nextEvent.nome}</p>
                <p className="mt-0.5 text-caption text-brand">{formatarDataCurta(nextEvent.data)}</p>
              </div>
              <Icon name="chevron-right" size={12} className="text-subtle-foreground" />
            </Card>
          </Link>
        </section>
      ) : null}

      {pendingChecklistGroups.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader title="Próximos passos" description="O que ainda falta configurar nas áreas que você ativou." />
          <HomeChecklist groups={pendingChecklistGroups} />
        </section>
      ) : !hasAnySection ? (
        <EmptyState
          icon="compass"
          title="Sua organização ainda não tem nada ativo"
          description="Explore a Nokta para ativar as funcionalidades que fazem sentido para o seu negócio."
          action={
            navigation.data?.canExplore ? (
              <Button asChild>
                <Link href="/dashboard/explorar">Explorar funcionalidades</Link>
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </div>
  );
}
