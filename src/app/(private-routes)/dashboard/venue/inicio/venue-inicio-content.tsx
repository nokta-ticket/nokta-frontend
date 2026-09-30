"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  ChefHat,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  PackageMinus,
  PackagePlus,
  PackageX,
  Receipt,
  ReceiptText,
  UserPlus,
  Users2,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { periodDates, periodLabel, periodToFinanceParams, usePeriod } from "@/context/PeriodContext";
import { formatCentsBRL } from "@/services/venue-finance";
import { cn } from "@/lib/utils";
import { PageContainer } from "../../_components/page/page-container";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { formatMonthDelta } from "../../_components/month-revenue-card";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { useVenueFinanceTimeline } from "../../financeiro/_venue/_hooks/use-venue-finance-overview";
import { useVenueInsightsOverview } from "../../insights/_venue/_hooks/use-venue-insights";
import { useVenueHome } from "./_hooks/use-venue-home";
import { SalesByHourCard, TopProductsCard } from "./_components/home-insights";
import { summarizePresence } from "./_lib/reservation-presence";

const SHORTCUT_CONFIG: Record<string, { label: string; href: string; icon: LucideIcon }> = {
  new_reservation: { label: "Nova reserva", href: "/dashboard/reservas", icon: CalendarPlus },
  open_tab: { label: "Abrir comanda", href: "/dashboard/operacao?tab=mesas", icon: ClipboardList },
  new_order: { label: "Novo pedido", href: "/dashboard/operacao?tab=pedidos", icon: ReceiptText },
  open_cash: { label: "Abrir caixa", href: "/dashboard/operacao?tab=caixa", icon: Wallet },
  register_purchase: { label: "Registrar compra", href: "/dashboard/estoque", icon: PackagePlus },
  invite_team: { label: "Convidar equipe", href: "/dashboard/equipe", icon: UserPlus },
};

/**
 * Linguagem da Início: só o Panorama tem profundidade; o resto é plano com
 * borda. Vermelho contido (vinho) só para o que exige ação. Pressionáveis
 * respondem ao toque sem animação de entrada — a tela é aberta o dia todo.
 */
const SURFACE = "rounded-[20px] border border-[#ebe8f2] bg-white";
const PRESSABLE =
  "transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";
const ATTN_TEXT = "text-[#9b1c35]";
const GUESTS_MIN_COVERAGE = 0.8;

function moneyClass(hidden: boolean) {
  return cn("font-poppins tabular-nums transition-[filter] duration-200", hidden && "blur-md select-none");
}

function OperationRow({ href, icon: Icon, label, children }: { href: string; icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-[#f7f5fb]", PRESSABLE)}>
      <Icon size={16} strokeWidth={1.8} className="shrink-0 text-violet-500" />
      <span className="text-[14.5px] font-medium text-gray-900">{label}</span>
      <span className="ml-auto">{children}</span>
      <ChevronRight
        size={16}
        strokeWidth={1.8}
        className="shrink-0 text-black/25 transition-[transform,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-violet-600"
      />
    </Link>
  );
}

function CountValue({ value }: { value: number }) {
  return <span className={cn("font-poppins text-[15px] font-bold tabular-nums", value === 0 ? "text-black/35" : "text-gray-900")}>{value}</span>;
}

function HomeSkeleton() {
  return (
    <PageContainer>
      <BlockSkeleton className="h-9 w-2/3" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <BlockSkeleton className="h-72 rounded-[20px]" />
        <BlockSkeleton className="h-72 rounded-[20px]" />
        <BlockSkeleton className="h-72 rounded-[20px]" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_0.95fr]">
        <BlockSkeleton className="h-64 rounded-[20px]" />
        <BlockSkeleton className="h-64 rounded-[20px]" />
      </div>
    </PageContainer>
  );
}

/**
 * Rota inicial padrão do Venue. WAITER, KITCHEN_BAR e STOCK continuam sendo
 * redirecionados direto para a tela operacional que usam o dia todo (rota
 * sugerida pelo backend em `defaultRoute`); OWNER, MANAGER, RECEPTION e
 * CASHIER ficam aqui e veem um painel real, recortado pelo que cada um pode
 * ver (`/organizations/:id/venue/home`, já filtrado por permissão).
 *
 * Organizada pelo turno, não por módulo: primeiro o que está acontecendo
 * agora (Panorama, operação, reservas), depois o dinheiro (gráfico e mês).
 *
 * Este componente vive fora de page.tsx de propósito: é reaproveitado por
 * /dashboard/inicio (a Início unificada — ver dashboard/inicio/page.tsx) e
 * um arquivo chamado `page.tsx` só pode exportar o conjunto reservado do
 * Next.js (default, metadata, ...) — um export nomeado extra quebra a
 * checagem de tipos de rota do Next.
 */
export function VenueInicioPageContent() {
  const router = useRouter();
  const { loading: loadingAccess, defaultRoute, can } = useVenueAccess();
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  useEffect(() => {
    if (!loadingAccess && defaultRoute && defaultRoute !== "/dashboard/venue/inicio") {
      router.replace(defaultRoute);
    }
  }, [loadingAccess, defaultRoute, router]);

  const redirecting = Boolean(defaultRoute && defaultRoute !== "/dashboard/venue/inicio");

  const { data: locations, isLoading: loadingLocations } = useVenueLocations(!redirecting ? orgId : null);
  // A lista de unidades inclui arquivadas, mas /venue/home só considera
  // unidades ATIVAS — nunca escolher/oferecer uma arquivada, senão a busca
  // falha com 404 (já aconteceu em produção: unidade principal arquivada).
  const activeLocations = locations?.filter((l) => l.active) ?? [];
  const [locationId, setLocationId] = useState<number | null>(null);
  const [hideValues, setHideValues] = useState(false);
  // Relógio da tolerância de "não compareceu" — avança sozinho, sem depender de refetch.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Troca de organização — sem isso o locationId da org anterior ficava
  // "preso" e nunca era recalculado, causando o mesmo 404 ao trocar de org.
  useEffect(() => {
    setLocationId(null);
  }, [orgId]);

  useEffect(() => {
    if (locationId !== null || activeLocations.length === 0) return;
    setLocationId((activeLocations.find((l) => l.isMain) ?? activeLocations[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocations.length, locationId]);

  const { data: home, isLoading: loadingHome, isError: homeError, refetch: refetchHome } = useVenueHome(
    !redirecting ? orgId : null,
    locationId,
  );

  const canViewFinance = can("venue.finance.view");
  // Faturamento e gráfico seguem o filtro de período do header;
  // o card do mês compara sempre este mês com o anterior inteiro.
  const { period } = usePeriod();
  const periodParams = periodToFinanceParams(period);
  const financeOrgId = canViewFinance ? orgId : null;
  const finance = useVenueFinanceTimeline(financeOrgId, locationId, periodParams);
  const financeThisMonth = useVenueFinanceTimeline(financeOrgId, locationId, { quickPeriod: "THIS_MONTH" });
  const financeLastMonth = useVenueFinanceTimeline(financeOrgId, locationId, { quickPeriod: "LAST_MONTH" });
  // Ticket médio, pessoas atendidas, mais vendidos e vendas por horário: um único endpoint do Insights.
  const canViewInsights = can("venue.insights.view");
  const insights = useVenueInsightsOverview(canViewInsights && locationId !== null ? orgId : null, {
    locationId: locationId ?? undefined,
    ...periodParams,
    comparison: "PREVIOUS_PERIOD",
  });

  if (loadingAccess || redirecting || loadingOrgs || loadingLocations) {
    return <HomeSkeleton />;
  }

  if (!orgId) {
    return (
      <PageContainer>
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (homeError) {
    return (
      <PageContainer>
        <EmptyState
          title="Não foi possível carregar a Início"
          description="Tente novamente em instantes. Se o problema continuar, avise o suporte."
          actionLabel="Tentar de novo"
          onAction={() => refetchHome()}
        />
      </PageContainer>
    );
  }

  if (loadingHome || !home) {
    return <HomeSkeleton />;
  }

  // A lista de unidades acima inclui arquivadas; a Início só considera unidades
  // ativas. Se todas estiverem arquivadas, orienta em vez de mostrar um painel vazio.
  if (!home.hasLocation) {
    return (
      <PageContainer>
        <EmptyState
          title="Nenhuma unidade ativa"
          description="Ative uma unidade em Configurações > Unidades para ver o painel da Início."
        />
      </PageContainer>
    );
  }

  const cashOpen = (home.cashSessions?.length ?? 0) > 0;
  // "Abrir caixa" não faz sentido com o caixa já aberto.
  const shortcuts = home.shortcuts
    .filter((key) => !(key === "open_cash" && cashOpen))
    .map((key) => SHORTCUT_CONFIG[key])
    .filter(Boolean);
  const showRestrictedNotice = home.onboarding.restricted && !home.onboarding.readyToOperate;
  const periodCents = (finance.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const thisMonthCents = (financeThisMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const lastMonthCents = (financeLastMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const money = moneyClass(hideValues);

  const alerts = [
    (home.outOfStockCount ?? 0) > 0
      ? { key: "outOfStock", label: "sem estoque", value: home.outOfStockCount ?? 0, icon: PackageX, href: "/dashboard/estoque" }
      : null,
    (home.lowStockCount ?? 0) > 0
      ? { key: "lowStock", label: "com estoque baixo", value: home.lowStockCount ?? 0, icon: PackageMinus, href: "/dashboard/estoque" }
      : null,
    (home.overduePayablesCount ?? 0) > 0
      ? { key: "overdue", label: home.overduePayablesCount === 1 ? "conta vencida" : "contas vencidas", value: home.overduePayablesCount ?? 0, icon: CalendarX2, href: "/dashboard/financeiro" }
      : null,
    (home.cashDiscrepancyCount ?? 0) > 0
      ? { key: "cash", label: home.cashDiscrepancyCount === 1 ? "divergência de caixa hoje" : "divergências de caixa hoje", value: home.cashDiscrepancyCount ?? 0, icon: Clock3, href: "/dashboard/operacao/caixa" }
      : null,
  ].filter((a): a is NonNullable<typeof a> => a !== null);
  // Só afirma "nada precisa de atenção" para quem enxerga ao menos uma das fontes de alerta.
  const seesAnyAlertSource = [home.outOfStockCount, home.lowStockCount, home.overduePayablesCount, home.cashDiscrepancyCount].some(
    (v) => v !== null,
  );

  const reservations = home.todaysReservations !== null ? summarizePresence(home.todaysReservations, nowMs) : null;
  const shownReservations = reservations?.actionable.slice(0, 3) ?? [];
  const moreWaiting = reservations ? reservations.actionable.length - shownReservations.length : 0;

  const monthDelta = formatMonthDelta(thisMonthCents, lastMonthCents);
  const insightsCards = insights.data?.cards;
  const ticket = insightsCards?.averageTicketCents;
  const guests = insightsCards?.guestsServed;
  // Pessoas atendidas depende do garçom informar quantas pessoas há na comanda; com
  // pouco preenchimento o número mente, então só aparece com >= 80% de cobertura.
  const showGuests = guests !== undefined && (guests.coverage === null || guests.coverage >= GUESTS_MIN_COVERAGE);

  const hasOperation =
    home.openTabsCount !== null ||
    home.cashSessions !== null ||
    home.ordersInPreparationCount !== null ||
    home.ordersReadyCount !== null ||
    home.waitlistCount !== null;
  const firstRowCount = 1 + (hasOperation ? 1 : 0) + (reservations ? 1 : 0);
  const firstRowCols =
    firstRowCount === 3
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.95fr)]"
      : firstRowCount === 2
        ? "xl:grid-cols-2"
        : "xl:grid-cols-1";

  return (
    <PageContainer>
      {activeLocations.length > 1 ? (
        <div className="flex justify-end">
          <Select value={locationId ? String(locationId) : ""} onValueChange={(v) => setLocationId(Number(v))}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {activeLocations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.nome} {loc.isMain ? "· Principal" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showRestrictedNotice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          O responsável pela organização ainda está concluindo a configuração do Venue.
        </div>
      ) : null}

      {/* Ações + estado de atenção */}
      <div className="flex flex-col gap-4">
        {shortcuts.length > 0 || (seesAnyAlertSource && alerts.length === 0) ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {shortcuts.length > 0 ? (
              <nav aria-label="Ações rápidas" className="flex flex-wrap items-center gap-2">
                {shortcuts.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "group flex h-9 items-center gap-2 rounded-[10px] border border-[#e6e2ef] bg-white px-3.5 text-[13.5px] font-medium text-gray-900 hover:border-[#d9cdf6] hover:bg-[#faf8ff]",
                      PRESSABLE,
                    )}
                  >
                    <Icon size={16} strokeWidth={1.8} className="text-violet-600 transition-colors group-hover:text-violet-700" />
                    {label}
                  </Link>
                ))}
              </nav>
            ) : (
              <span />
            )}
            {seesAnyAlertSource && alerts.length === 0 ? (
              <p role="status" className="flex items-center gap-2 text-[13.5px] text-black/60">
                <CircleCheck size={16} strokeWidth={1.8} className="text-emerald-700" />
                Nada precisa de atenção agora
              </p>
            ) : null}
          </div>
        ) : null}

        {alerts.length > 0 ? (
          <div role="status" className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-[14px] border border-[#f0d7dc] bg-[#fcf5f6] px-3 py-2 text-sm">
            <span className={cn("mr-2 flex items-center gap-2 pl-1 font-semibold", ATTN_TEXT)}>
              <span className="h-2 w-2 rounded-full bg-[#cf3b55] shadow-[0_0_0_3px_rgba(207,59,85,0.14)]" aria-hidden="true" />
              Precisa de atenção
            </span>
            {alerts.map(({ key, label, value, icon: Icon, href }) => (
              <Link key={key} href={href} className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium hover:bg-[#f8e7ea]", ATTN_TEXT, PRESSABLE)}>
                <Icon size={16} strokeWidth={1.8} />
                <b className="font-poppins tabular-nums">{value}</b> {label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Linha 1 — o turno agora */}
      <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", firstRowCols)}>
        <section
          aria-labelledby="home-panorama"
          className="flex flex-col rounded-[20px] bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] p-6 text-white shadow-[0_10px_30px_rgba(28,24,48,0.22)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="home-panorama" className="text-[17px] font-semibold">
              Panorama Geral
            </h2>
            {canViewFinance || home.financeSummary ? (
              <button
                type="button"
                aria-pressed={hideValues}
                onClick={() => setHideValues((v) => !v)}
                className={cn("flex items-center gap-1.5 rounded-md text-[13px] font-medium text-white/60 hover:text-white/90", PRESSABLE)}
              >
                {hideValues ? <Eye size={16} strokeWidth={1.8} /> : <EyeOff size={16} strokeWidth={1.8} />}
                {hideValues ? "Mostrar valores" : "Ocultar valores"}
              </button>
            ) : null}
          </div>

          {canViewFinance ? (
            <div className="mt-5">
              <p className="text-[13.5px] text-white/65">Faturamento · {periodLabel(period)}</p>
              <p className={cn(money, "mt-1.5 text-[30px] font-bold leading-none tracking-tight")}>
                {finance.isLoading ? "…" : formatCentsBRL(periodCents)}
              </p>
              {/* "Este mês" era um card inteiro para três informações; virou esta linha. */}
              {!financeThisMonth.isLoading && !financeLastMonth.isLoading ? (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/65">
                  Este mês <b className={cn(money, "font-semibold text-white")}>{formatCentsBRL(thisMonthCents)}</b>
                  {monthDelta ? (
                    <>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-poppins text-[12px] font-semibold tabular-nums",
                          thisMonthCents >= lastMonthCents ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300",
                        )}
                      >
                        {monthDelta}
                      </span>
                      <span className="text-white/50">vs. mês anterior</span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : home.financeSummary ? (
            <div className="mt-5">
              <p className="text-[13.5px] text-white/65">Faturamento do dia</p>
              <p className={cn(money, "mt-1.5 text-[30px] font-bold leading-none tracking-tight")}>{formatCentsBRL(home.financeSummary.totalCents)}</p>
            </div>
          ) : null}

          {ticket ? (
            <div className={cn("mt-auto grid gap-2.5 pt-6", showGuests ? "grid-cols-2" : "grid-cols-1")}>
              <Link href="/dashboard/insights" className={cn("rounded-[14px] bg-white/[0.06] px-4 py-3.5 hover:bg-white/[0.09]", PRESSABLE)}>
                <Receipt size={18} strokeWidth={1.8} className="text-violet-300" />
                <p className={cn(money, "mt-3 text-xl font-bold", ticket.current === 0 && "text-white/50")}>{formatCentsBRL(ticket.current)}</p>
                <p className="mt-0.5 text-xs text-white/65">
                  Ticket médio
                  {ticket.percentDiff !== null && ticket.current > 0 ? (
                    <span className={ticket.percentDiff >= 0 ? "text-emerald-300" : "text-rose-300"}>
                      {" · "}
                      {ticket.percentDiff >= 0 ? "+" : "−"}
                      {Math.abs(Math.round(ticket.percentDiff))}%
                    </span>
                  ) : null}
                </p>
              </Link>
              {showGuests && guests ? (
                <Link href="/dashboard/insights" className={cn("rounded-[14px] bg-white/[0.06] px-4 py-3.5 hover:bg-white/[0.09]", PRESSABLE)}>
                  <UsersRound size={18} strokeWidth={1.8} className="text-violet-300" />
                  <p className={cn("mt-3 font-poppins text-xl font-bold tabular-nums", guests.current === 0 && "text-white/50")}>{guests.current}</p>
                  <p className="mt-0.5 text-xs text-white/65">Pessoas atendidas</p>
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        {hasOperation ? (
          <section aria-labelledby="home-operation" className={cn(SURFACE, "flex flex-col px-3 pb-3 pt-6")}>
            <h2 id="home-operation" className="mb-2 px-3 text-[17px] font-semibold text-gray-900">
              Agora na operação
            </h2>
            {home.openTabsCount !== null ? (
              <OperationRow href="/dashboard/operacao" icon={ClipboardList} label="Comandas abertas">
                <CountValue value={home.openTabsCount} />
              </OperationRow>
            ) : null}
            {home.ordersInPreparationCount !== null ? (
              <OperationRow href="/dashboard/operacao/pedidos" icon={ChefHat} label="Itens em preparo">
                <CountValue value={home.ordersInPreparationCount} />
              </OperationRow>
            ) : null}
            {home.ordersReadyCount !== null ? (
              <OperationRow href="/dashboard/operacao/pedidos" icon={BellRing} label="Itens prontos para entregar">
                <CountValue value={home.ordersReadyCount} />
              </OperationRow>
            ) : null}
            {home.waitlistCount !== null ? (
              <OperationRow href="/dashboard/reservas?tab=fila" icon={Users2} label="Clientes na fila">
                <CountValue value={home.waitlistCount} />
              </OperationRow>
            ) : null}
            {home.cashSessions !== null ? (
              <OperationRow href="/dashboard/operacao/caixa" icon={Wallet} label="Caixa">
                <span className={cn("text-sm font-semibold", cashOpen ? "text-emerald-700" : "text-black/45")}>{cashOpen ? "Aberto" : "Fechado"}</span>
              </OperationRow>
            ) : null}
          </section>
        ) : null}

        {reservations ? (
          <section aria-labelledby="home-reservations" className={cn(SURFACE, "flex flex-col px-3 pb-3 pt-6")}>
            <div className="mb-3 flex items-baseline justify-between gap-3 px-3">
              <h2 id="home-reservations" className="text-[17px] font-semibold text-gray-900">
                Reservas de hoje <span className="ml-1 font-poppins text-[15px] tabular-nums text-black/35">{reservations.total}</span>
              </h2>
              <Link href="/dashboard/reservas" className={cn("rounded-md text-[13px] font-semibold text-violet-700 hover:text-violet-800", PRESSABLE)}>
                Ver todas
              </Link>
            </div>

            {reservations.total === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center pb-3 text-center">
                <CalendarClock size={22} strokeWidth={1.8} className="text-black/30" />
                <p className="mt-2.5 text-[13.5px] text-black/60">Nenhuma reserva para hoje.</p>
              </div>
            ) : (
              <>
                <dl className="mx-3 grid grid-cols-3 divide-x divide-black/[0.06] rounded-[14px] bg-[#f7f5fb] py-2.5 text-center">
                  <div>
                    <dd className="font-poppins text-lg font-bold tabular-nums">{reservations.arrived}</dd>
                    <dt className="text-xs text-black/60">Chegaram</dt>
                  </div>
                  <div>
                    <dd className="font-poppins text-lg font-bold tabular-nums">{reservations.waiting}</dd>
                    <dt className="text-xs text-black/60">A chegar</dt>
                  </div>
                  <div>
                    <dd className={cn("font-poppins text-lg font-bold tabular-nums", reservations.noShow > 0 && ATTN_TEXT)}>{reservations.noShow}</dd>
                    <dt className="text-xs text-black/60">Não vieram</dt>
                  </div>
                </dl>

                {shownReservations.length > 0 ? (
                  <ul className="mt-2 flex flex-col">
                    {shownReservations.map((r) => {
                      const noShow = r.presence === "NO_SHOW";
                      return (
                        <li key={r.id}>
                          <Link href="/dashboard/reservas" className={cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f7f5fb]", PRESSABLE)}>
                            <span
                              className={cn(
                                "w-11 font-poppins text-[13.5px] font-semibold tabular-nums",
                                noShow && "text-black/45 line-through decoration-black/25",
                              )}
                            >
                              {new Date(r.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium text-gray-900">{r.customerName}</span>
                              <span className="text-xs text-black/55">
                                {r.partySize} {r.partySize === 1 ? "pessoa" : "pessoas"}
                              </span>
                            </span>
                            {noShow ? (
                              <span className={cn("rounded-md bg-[#fcf5f6] px-2 py-0.5 text-xs font-semibold shadow-[inset_0_0_0_1px_#f0d7dc]", ATTN_TEXT)}>
                                Não compareceu
                              </span>
                            ) : (
                              <span className="rounded-md bg-black/[0.05] px-2 py-0.5 text-xs font-semibold text-black/65">Aguardando</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-3 pt-3 text-[13.5px] text-black/60">Todos que reservaram já chegaram.</p>
                )}

                {moreWaiting > 0 || reservations.canceled > 0 ? (
                  <p className="px-3 pt-1 text-[12.5px] text-black/55">
                    {[
                      moreWaiting > 0 ? `e mais ${moreWaiting} na lista` : null,
                      reservations.canceled > 0 ? `${reservations.canceled} ${reservations.canceled === 1 ? "cancelada" : "canceladas"}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </>
            )}
          </section>
        ) : null}
      </div>

      {/* Linha 2 — tendência e o que vende */}
      {canViewFinance || canViewInsights ? (
        <div className={cn("grid grid-cols-1 gap-4", canViewFinance && canViewInsights && "xl:grid-cols-[minmax(0,2fr)_minmax(0,0.95fr)]")}>
          {canViewFinance ? (
            <FinanceTimelineChart
              data={finance.data}
              isLoading={finance.isLoading}
              // Resultado líquido = resultCents do timeline (faturamento − custo dos produtos − despesas pagas); o cálculo final ainda será definido.
              description={`Faturamento e resultado líquido por dia · ${periodLabel(period)}`}
              resultLabel="Resultado líquido"
              zeroDates={home.date ? periodDates(period, home.date) : undefined}
              hideValues={hideValues}
              className="rounded-[20px] border-[#ebe8f2] shadow-none"
            />
          ) : null}
          {canViewInsights ? (
            <TopProductsCard products={insights.data?.topProducts} isLoading={insights.isLoading} periodText={periodLabel(period)} hideValues={hideValues} />
          ) : null}
        </div>
      ) : null}

      {/* Linha 3 — em que hora a casa vende */}
      {canViewInsights ? (
        <SalesByHourCard
          entries={insights.data?.salesByHour}
          isLoading={insights.isLoading}
          periodText={periodLabel(period)}
          multiDay={period.key !== "today" && !(period.key === "custom" && period.range.from === period.range.to)}
          hideValues={hideValues}
        />
      ) : null}
    </PageContainer>
  );
}
