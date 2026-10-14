"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { useTicketsAccess } from "@/context/TicketsAccessContext";
import { periodDates, periodLabel, periodToFinanceParams, usePeriod } from "@/context/PeriodContext";
import { cn } from "@/lib/cn";
import { formatBRLCents, formatEventDate } from "@/lib/format";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { writeBootHint } from "../../_lib/boot-prefetch";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { LocationSelect } from "../../operacao/_components/location-select";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { useVenueFinanceTimeline } from "../../financeiro/_venue/_hooks/use-venue-finance-overview";
import { useTicketsFinanceTimeline } from "../../inicio/_hooks/use-tickets-finance";
import { useVenueInsightsOverview } from "../../insights/_venue/_hooks/use-venue-insights";
import { useVenueHome } from "./_hooks/use-venue-home";
import { SalesByHourCard, TopProductsCard } from "./_components/home-insights";
import { HomeMoneyStat } from "./_components/home-money-stat";
import { summarizePresence } from "./_lib/reservation-presence";

const SHORTCUT_CONFIG: Record<string, { label: string; href: string; icon: IconName }> = {
  new_reservation: { label: "Nova reserva", href: "/dashboard/reservas", icon: "calendar-plus" },
  open_tab: { label: "Abrir comanda", href: "/dashboard/operacao", icon: "clipboard-list" },
  new_order: { label: "Novo pedido", href: "/dashboard/operacao", icon: "receipt" },
  open_cash: { label: "Abrir caixa", href: "/dashboard/operacao/caixa", icon: "wallet" },
  register_purchase: { label: "Registrar compra", href: "/dashboard/estoque", icon: "box" },
  invite_team: { label: "Convidar equipe", href: "/dashboard/equipe", icon: "user-plus" },
};

const GUESTS_MIN_COVERAGE = 0.8;

function greeting(name: string | undefined): string {
  const h = new Date().getHours();
  const hello = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${hello}, ${name}` : hello;
}

function OperationRow({ href, icon, label, children }: { href: string; icon: IconName; label: string; children: ReactNode }) {
  return (
    <Link href={href} className="press group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-2">
      <Icon name={icon} size={14} className="shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="ml-auto">{children}</span>
      <Icon name="chevron-right" size={11} className="shrink-0 text-subtle-foreground transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}

function CountValue({ value }: { value: number }) {
  return <span className={cn("text-[15px] font-semibold tnum", value === 0 ? "text-subtle-foreground" : "text-foreground")}>{value}</span>;
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-2/3 max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

/**
 * Início do Venue (também usada por /dashboard/inicio quando o módulo está
 * ativo). WAITER, KITCHEN_BAR e STOCK vão direto pra tela operacional
 * (`defaultRoute` do backend); OWNER, MANAGER, RECEPTION e CASHIER ficam
 * aqui. Organizada pelo turno: o que está acontecendo agora, depois o
 * dinheiro. Vive fora de page.tsx de propósito (export nomeado reaproveitado).
 */
export function VenueInicioPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: loadingAccess, defaultRoute, can } = useVenueAccess();
  const { currentOrg, loadingOrgs, organizations } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  useEffect(() => {
    if (!loadingAccess && defaultRoute && defaultRoute !== "/dashboard/venue/inicio") {
      router.replace(defaultRoute);
    }
  }, [loadingAccess, defaultRoute, router]);

  const redirecting = Boolean(defaultRoute && defaultRoute !== "/dashboard/venue/inicio");

  const { data: locations, isLoading: loadingLocations } = useVenueLocations(!redirecting ? orgId : null);
  // /venue/home só aceita unidades ATIVAS — nunca oferecer uma arquivada.
  const activeLocations = locations?.filter((l) => l.active) ?? [];
  const [locationId, setLocationId] = useState<number | null>(null);
  const [hideValues, setHideValues] = useState(false);
  // Relógio da tolerância de "não compareceu" — avança sozinho.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setLocationId(null);
  }, [orgId]);

  // Sem escolha manual, /venue/home responde pela unidade principal — a
  // primeira busca já serve a tela, sem segunda ida ao servidor.
  const { data: home, isLoading: loadingHome, isError: homeError, refetch: refetchHome } = useVenueHome(!redirecting ? orgId : null, locationId);
  const selectedLocationId = locationId ?? (activeLocations.find((l) => l.isMain) ?? activeLocations[0])?.id ?? home?.location?.id ?? null;

  const canViewFinance = can("venue.finance.view");
  const { period } = usePeriod();
  const periodParams = periodToFinanceParams(period);
  const financeOrgId = canViewFinance ? orgId : null;
  const finance = useVenueFinanceTimeline(financeOrgId, selectedLocationId, periodParams);
  const financeThisMonth = useVenueFinanceTimeline(financeOrgId, selectedLocationId, { quickPeriod: "THIS_MONTH" });
  const financeLastMonth = useVenueFinanceTimeline(financeOrgId, selectedLocationId, { quickPeriod: "LAST_MONTH" });
  // Organização que também vende ingressos: a venda entra no faturamento.
  const { can: canTickets } = useTicketsAccess();
  const ticketsOrgId = canViewFinance && canTickets("tickets.finance.view") ? orgId : null;
  const tickets = useTicketsFinanceTimeline(ticketsOrgId, periodParams);
  const ticketsThisMonth = useTicketsFinanceTimeline(ticketsOrgId, { quickPeriod: "THIS_MONTH" });
  const ticketsLastMonth = useTicketsFinanceTimeline(ticketsOrgId, { quickPeriod: "LAST_MONTH" });
  const canViewInsights = can("venue.insights.view");
  const insights = useVenueInsightsOverview(canViewInsights && selectedLocationId !== null ? orgId : null, {
    locationId: selectedLocationId ?? undefined,
    ...periodParams,
    comparison: "PREVIOUS_PERIOD",
  });

  // Dica pra próxima abertura disparar tudo de uma vez (boot-prefetch.ts).
  const hasHome = Boolean(home);
  const canTicketsFinance = ticketsOrgId !== null;
  useEffect(() => {
    if (orgId === null || !hasHome || locationId !== null || organizations[0]?.id !== orgId) return;
    writeBootHint({ orgId, venue: true, locationId: selectedLocationId, venueFinance: canViewFinance, ticketsFinance: canTicketsFinance, insights: canViewInsights });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, hasHome, locationId, selectedLocationId, canViewFinance, canTicketsFinance, canViewInsights]);

  if (loadingAccess || redirecting || loadingOrgs || loadingLocations) return <HomeSkeleton />;

  if (!orgId) {
    return <EmptyState icon="building" title="Nenhuma organização selecionada" description="Escolha uma organização no menu lateral pra continuar." />;
  }

  if (locations && locations.length === 0) {
    return <OnboardingLocation orgId={orgId} />;
  }

  if (homeError) {
    return <ErrorState title="Não deu pra carregar a Início" description="Tenta de novo em instantes. Se continuar, avise o suporte." onRetry={() => refetchHome()} />;
  }

  if (loadingHome || !home) return <HomeSkeleton />;

  if (!home.hasLocation) {
    return <EmptyState icon="store" title="Nenhuma unidade ativa" description="Ative uma unidade em Configurações > Unidades pra ver o painel da Início." />;
  }

  const cashOpen = (home.cashSessions?.length ?? 0) > 0;
  const shortcuts = home.shortcuts
    .filter((key) => !(key === "open_cash" && cashOpen))
    .map((key) => SHORTCUT_CONFIG[key])
    .filter(Boolean);
  const showRestrictedNotice = home.onboarding.restricted && !home.onboarding.readyToOperate;
  const ticketsPeriodCents = sumRevenue(tickets.data);
  const periodCents = sumRevenue(finance.data) + ticketsPeriodCents;
  const thisMonthCents = sumRevenue(financeThisMonth.data) + sumRevenue(ticketsThisMonth.data);
  const lastMonthCents = sumRevenue(financeLastMonth.data) + sumRevenue(ticketsLastMonth.data);
  const financeLoading = finance.isLoading || tickets.isLoading;
  const monthLoading = financeThisMonth.isLoading || financeLastMonth.isLoading || ticketsThisMonth.isLoading || ticketsLastMonth.isLoading;
  const chartData = finance.data ? mergeTimelines(finance.data, tickets.data ?? []) : undefined;
  const monthTrend = !monthLoading && lastMonthCents > 0 ? { pct: ((thisMonthCents - lastMonthCents) / lastMonthCents) * 100, label: "vs. mês anterior" } : null;

  const alerts = [
    (home.outOfStockCount ?? 0) > 0 ? { key: "outOfStock", label: "sem estoque", value: home.outOfStockCount ?? 0, icon: "box" as IconName, href: "/dashboard/estoque" } : null,
    (home.lowStockCount ?? 0) > 0 ? { key: "lowStock", label: "com estoque baixo", value: home.lowStockCount ?? 0, icon: "warehouse" as IconName, href: "/dashboard/estoque" } : null,
    (home.overduePayablesCount ?? 0) > 0 ? { key: "overdue", label: home.overduePayablesCount === 1 ? "conta vencida" : "contas vencidas", value: home.overduePayablesCount ?? 0, icon: "invoice" as IconName, href: "/dashboard/financeiro" } : null,
    (home.cashDiscrepancyCount ?? 0) > 0 ? { key: "cash", label: home.cashDiscrepancyCount === 1 ? "divergência de caixa hoje" : "divergências de caixa hoje", value: home.cashDiscrepancyCount ?? 0, icon: "wallet" as IconName, href: "/dashboard/operacao/caixa" } : null,
  ].filter((a): a is NonNullable<typeof a> => a !== null);
  const seesAnyAlertSource = [home.outOfStockCount, home.lowStockCount, home.overduePayablesCount, home.cashDiscrepancyCount].some((v) => v !== null);

  const reservations = home.todaysReservations !== null ? summarizePresence(home.todaysReservations, nowMs) : null;
  const shownReservations = reservations?.actionable.slice(0, 4) ?? [];
  const moreWaiting = reservations ? reservations.actionable.length - shownReservations.length : 0;

  const insightsCards = insights.data?.cards;
  const venueTicket = insightsCards?.averageTicketCents;
  // Ticket médio junta comandas fechadas e pedidos de ingresso; com ingressos
  // no período a variação some (período anterior de ingressos não é consultado).
  const ticketOrders = (tickets.data ?? []).reduce((sum, p) => sum + (p.ordersCount ?? 0), 0);
  const closedTabs = insights.data?.secondary.closedTabsCount ?? 0;
  const ticket = venueTicket && ticketOrders > 0 ? { current: Math.round((venueTicket.current * closedTabs + ticketsPeriodCents) / (closedTabs + ticketOrders)), percentDiff: null } : venueTicket;
  const guests = insightsCards?.guestsServed;
  const showGuests = guests !== undefined && (guests.coverage === null || guests.coverage >= GUESTS_MIN_COVERAGE);

  const hasOperation = home.openTabsCount !== null || home.cashSessions !== null || home.ordersInPreparationCount !== null || home.ordersReadyCount !== null || home.waitlistCount !== null;
  const showMoney = canViewFinance || home.financeSummary !== null;
  const moneyCents = canViewFinance ? (financeLoading ? null : periodCents) : (home.financeSummary?.totalCents ?? null);
  const showTicket = showMoney && Boolean(ticket);
  const statCount = [showMoney, home.openTabsCount !== null, reservations !== null, showTicket].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting(user?.nome)}
        description={[home.date ? formatEventDate(home.date) : null, home.location?.nome].filter(Boolean).join(" · ")}
        actions={
          <>
            {activeLocations.length > 1 ? <LocationSelect locations={activeLocations} value={selectedLocationId} onChange={setLocationId} className="w-48" /> : null}
            {showMoney ? (
              <Button variant="outline" size="icon" aria-pressed={hideValues} aria-label={hideValues ? "Mostrar valores" : "Ocultar valores"} title={hideValues ? "Mostrar valores" : "Ocultar valores"} onClick={() => setHideValues((v) => !v)}>
                <Icon name={hideValues ? "eye" : "eye-slash"} size={14} />
              </Button>
            ) : null}
          </>
        }
      />

      {showRestrictedNotice ? <Callout tone="warning">O responsável pela organização ainda está concluindo a configuração do Venue.</Callout> : null}

      {shortcuts.length > 0 ? (
        <nav aria-label="Ações rápidas" className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {shortcuts.map(({ label, href, icon }) => (
            <Button key={label} asChild variant="outline" size="sm" shape="pill" className="shrink-0">
              <Link href={href}>
                <Icon name={icon} size={13} className="text-brand" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
      ) : null}

      {alerts.length > 0 ? (
        <Callout tone="danger" title="Precisa de atenção">
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {alerts.map(({ key, label, value, icon, href }) => (
              <Link key={key} href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline">
                <Icon name={icon} size={12} className="text-danger" />
                <b className="tnum">{value}</b> {label}
              </Link>
            ))}
          </div>
        </Callout>
      ) : seesAnyAlertSource ? (
        <p role="status" className="flex items-center gap-2 text-caption text-muted-foreground">
          <Icon name="check-circle" size={12} className="text-success" />
          Nada precisa de atenção agora
        </p>
      ) : null}

      <div className={cn("grid gap-4", statCount >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : statCount === 3 ? "sm:grid-cols-3" : statCount === 2 ? "sm:grid-cols-2" : "")}>
        {showMoney ? (
          <HomeMoneyStat label={canViewFinance ? `Faturamento · ${periodLabel(period)}` : "Faturamento do dia"} icon="chart-line" cents={moneyCents} hidden={hideValues} trend={canViewFinance ? monthTrend : null} hint={canViewFinance && !monthLoading ? `Este mês ${formatBRLCents(thisMonthCents)}` : home.financeSummary ? `${home.financeSummary.paymentsCount} ${home.financeSummary.paymentsCount === 1 ? "pagamento" : "pagamentos"}` : undefined} />
        ) : null}
        {home.openTabsCount !== null ? <StatCard label="Comandas abertas" icon="clipboard-list" value={home.openTabsCount} hint={home.tables ? `${home.tables.occupied} de ${home.tables.total} mesas ocupadas` : undefined} /> : null}
        {reservations ? <StatCard label="Reservas hoje" icon="calendar-check" value={reservations.total} hint={reservations.total > 0 ? `${reservations.arrived} chegaram · ${reservations.waiting} a chegar${reservations.noShow > 0 ? ` · ${reservations.noShow} não vieram` : ""}` : "nenhuma reserva pra hoje"} /> : null}
        {showTicket && ticket ? <HomeMoneyStat label="Ticket médio" icon="receipt" cents={ticket.current} hidden={hideValues} trend={ticket.percentDiff !== null && ticket.current > 0 ? { pct: ticket.percentDiff, label: "" } : null} hint={showGuests && guests ? `${guests.current} ${guests.current === 1 ? "pessoa atendida" : "pessoas atendidas"}` : undefined} /> : null}
      </div>

      {hasOperation || reservations ? (
        <div className={cn("grid gap-4", hasOperation && reservations && "xl:grid-cols-2")}>
          {hasOperation ? (
            <Card className="gap-0">
              <CardHeader>
                <CardTitle>Agora na operação</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 pt-3">
                {home.openTabsCount !== null ? (
                  <OperationRow href="/dashboard/operacao" icon="clipboard-list" label="Comandas abertas">
                    <CountValue value={home.openTabsCount} />
                  </OperationRow>
                ) : null}
                {home.ordersInPreparationCount !== null ? (
                  <OperationRow href="/dashboard/operacao/pedidos" icon="fire" label="Itens em preparo">
                    <CountValue value={home.ordersInPreparationCount} />
                  </OperationRow>
                ) : null}
                {home.ordersReadyCount !== null ? (
                  <OperationRow href="/dashboard/operacao/pedidos" icon="bell" label="Prontos pra entregar">
                    <CountValue value={home.ordersReadyCount} />
                  </OperationRow>
                ) : null}
                {home.waitlistCount !== null ? (
                  <OperationRow href="/dashboard/reservas?tab=fila" icon="users" label="Clientes na fila">
                    <CountValue value={home.waitlistCount} />
                  </OperationRow>
                ) : null}
                {home.cashSessions !== null ? (
                  <OperationRow href="/dashboard/operacao/caixa" icon="wallet" label="Caixa">
                    <StatusBadge tone={cashOpen ? "success" : "neutral"} pulse={cashOpen}>
                      {cashOpen ? "Aberto" : "Fechado"}
                    </StatusBadge>
                  </OperationRow>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {reservations ? (
            <Card className="gap-0">
              <CardHeader className="items-center">
                <CardTitle>
                  Reservas de hoje <span className="ml-1 text-sm font-normal text-subtle-foreground tnum">{reservations.total}</span>
                </CardTitle>
                <Link href="/dashboard/reservas" className="inline-flex items-center gap-1 text-caption font-semibold text-brand underline-offset-4 hover:underline">
                  Ver todas
                  <Icon name="arrow-right" size={10} />
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                {reservations.total === 0 ? (
                  <EmptyState compact icon="calendar" title="Nenhuma reserva pra hoje" className="border-0 bg-transparent py-6" />
                ) : (
                  <>
                    <dl className="grid grid-cols-3 divide-x divide-border rounded-xl bg-surface-2 py-3 text-center">
                      <div>
                        <dd className="text-lg font-semibold text-foreground tnum">{reservations.arrived}</dd>
                        <dt className="text-caption text-muted-foreground">Chegaram</dt>
                      </div>
                      <div>
                        <dd className="text-lg font-semibold text-foreground tnum">{reservations.waiting}</dd>
                        <dt className="text-caption text-muted-foreground">A chegar</dt>
                      </div>
                      <div>
                        <dd className={cn("text-lg font-semibold tnum", reservations.noShow > 0 ? "text-danger" : "text-foreground")}>{reservations.noShow}</dd>
                        <dt className="text-caption text-muted-foreground">Não vieram</dt>
                      </div>
                    </dl>

                    {shownReservations.length > 0 ? (
                      <ul className="mt-3 flex flex-col">
                        {shownReservations.map((r) => {
                          const noShow = r.presence === "NO_SHOW";
                          return (
                            <li key={r.id}>
                              <Link href="/dashboard/reservas" className="press flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                                <span className={cn("w-12 text-sm font-semibold tnum", noShow ? "text-subtle-foreground line-through" : "text-foreground")}>{new Date(r.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-foreground">{r.customerName}</span>
                                  <span className="text-caption text-muted-foreground tnum">
                                    {r.partySize} {r.partySize === 1 ? "pessoa" : "pessoas"}
                                  </span>
                                </span>
                                <StatusBadge tone={noShow ? "danger" : "warning"}>{noShow ? "Não compareceu" : "Aguardando"}</StatusBadge>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="px-2 pt-3 text-body text-muted-foreground">Todos que reservaram já chegaram.</p>
                    )}

                    {moreWaiting > 0 || reservations.canceled > 0 ? <p className="px-2 pt-2 text-caption text-subtle-foreground">{[moreWaiting > 0 ? `e mais ${moreWaiting} na lista` : null, reservations.canceled > 0 ? `${reservations.canceled} ${reservations.canceled === 1 ? "cancelada" : "canceladas"}` : null].filter(Boolean).join(" · ")}</p> : null}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {canViewFinance || canViewInsights ? (
        <div className={cn("grid gap-4", canViewFinance && canViewInsights && "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
          {canViewFinance ? (
            <FinanceTimelineChart
              data={chartData}
              isLoading={financeLoading}
              // Resultado líquido = resultCents do timeline (faturamento − custo dos produtos − despesas pagas).
              description={`Faturamento e resultado líquido por dia · ${periodLabel(period)}`}
              resultLabel="Resultado líquido"
              zeroDates={home.date ? periodDates(period, home.date) : undefined}
              hideValues={hideValues}
            />
          ) : null}
          {canViewInsights ? <TopProductsCard products={insights.data?.topProducts} isLoading={insights.isLoading} periodText={periodLabel(period)} hideValues={hideValues} /> : null}
        </div>
      ) : null}

      {canViewInsights ? <SalesByHourCard entries={insights.data?.salesByHour} isLoading={insights.isLoading} periodText={periodLabel(period)} multiDay={period.key !== "today" && !(period.key === "custom" && period.range.from === period.range.to)} hideValues={hideValues} /> : null}
    </div>
  );
}

interface TimelinePoint {
  date: string;
  revenueCents: number;
  resultCents: number;
}

function sumRevenue(points: TimelinePoint[] | undefined): number {
  return (points ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
}

/** Soma bar e ingressos dia a dia; nos ingressos o resultado é o líquido do produtor. */
function mergeTimelines(venue: TimelinePoint[], tickets: TimelinePoint[]): TimelinePoint[] {
  if (tickets.length === 0) return venue;
  const byDate = new Map<string, TimelinePoint>();
  for (const p of [...venue, ...tickets]) {
    const current = byDate.get(p.date);
    byDate.set(p.date, { date: p.date, revenueCents: (current?.revenueCents ?? 0) + p.revenueCents, resultCents: (current?.resultCents ?? 0) + p.resultCents });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
