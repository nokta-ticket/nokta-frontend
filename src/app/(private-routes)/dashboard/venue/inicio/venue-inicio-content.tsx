"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  ClipboardList,
  CalendarClock,
  Clock3,
  Wallet,
  LayoutGrid,
  Users2,
  ChefHat,
  CheckCircle2,
  PackageX,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  UtensilsCrossed,
  Users,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { formatCentsBRL } from "@/services/venue-finance";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { FinanceTimelineChart } from "../../_components/finance-timeline-chart";
import { GoalProgressCard } from "../../_components/goal-progress-card";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { VenueReadinessChecklist } from "../_components/venue-readiness-checklist";
import { useVenueSetupLifecycle } from "../../configuracoes/_hooks/use-venue-settings";
import { useVenueFinanceTimeline } from "../../financeiro/_venue/_hooks/use-venue-finance-overview";
import { useVenueHome } from "./_hooks/use-venue-home";

const SHORTCUT_CONFIG: Record<string, { label: string; description: string; href: string }> = {
  new_reservation: { label: "Nova Reserva", description: "Criar uma nova reserva", href: "/dashboard/reservas" },
  open_tab: { label: "Abrir Comanda", description: "Abrir comanda para mesa", href: "/dashboard/operacao?tab=mesas" },
  new_order: { label: "Novo Pedido", description: "Registrar um novo pedido", href: "/dashboard/operacao?tab=pedidos" },
  open_cash: { label: "Abrir Caixa", description: "Abrir o caixa da unidade", href: "/dashboard/operacao?tab=caixa" },
  register_purchase: { label: "Registrar Compra", description: "Nova compra de estoque", href: "/dashboard/estoque" },
  invite_team: { label: "Convidar Equipe", description: "Adicionar membro à equipe", href: "/dashboard/equipe" },
};

const BUSINESS_OVERVIEW = [
  { key: "MENU", label: "Cardápio", metric: "Itens ativos", icon: UtensilsCrossed, href: "/dashboard/cardapio", cta: "Gerenciar cardápio" },
  { key: "STOCK", label: "Estoque", metric: "Itens com estoque baixo", icon: Boxes, href: "/dashboard/estoque", cta: "Ver estoque" },
  { key: "FINANCE", label: "Financeiro", metric: "Contas a receber", icon: DollarSign, href: "/dashboard/financeiro", cta: "Ver financeiro" },
  { key: "TEAM", label: "Equipe", metric: "Membros da equipe", icon: Users, href: "/dashboard/equipe", cta: "Ver equipe" },
];

/**
 * Rota inicial padrão do Venue. WAITER, KITCHEN_BAR e STOCK continuam sendo
 * redirecionados direto para a tela operacional que usam o dia todo (rota
 * sugerida pelo backend em `defaultRoute`); OWNER, MANAGER, RECEPTION e
 * CASHIER ficam aqui e veem um painel real, recortado pelo que cada um pode
 * ver (`/organizations/:id/venue/home`, já filtrado por permissão).
 *
 * Este componente vive fora de page.tsx de propósito: é reaproveitado por
 * /dashboard/inicio (a Início unificada — ver dashboard/inicio/page.tsx) e
 * um arquivo chamado `page.tsx` só pode exportar o conjunto reservado do
 * Next.js (default, metadata, ...) — um export nomeado extra quebra a
 * checagem de tipos de rota do Next.
 */
export function VenueInicioPageContent() {
  const router = useRouter();
  const { loading: loadingAccess, defaultRoute, can, venueRole } = useVenueAccess();
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

  const { data: home, isLoading: loadingHome, isError: homeError } = useVenueHome(!redirecting ? orgId : null, locationId);
  const { dismiss } = useVenueSetupLifecycle(orgId ?? -1);

  const canManageSettings = can("organization.settings.manage");
  const canViewFinance = can("venue.finance.view");
  const finance = useVenueFinanceTimeline(canViewFinance ? orgId : null, locationId, { quickPeriod: "LAST_7_DAYS" });
  const financeThisMonth = useVenueFinanceTimeline(canViewFinance ? orgId : null, locationId, { quickPeriod: "THIS_MONTH" });
  const financeLastMonth = useVenueFinanceTimeline(canViewFinance ? orgId : null, locationId, { quickPeriod: "LAST_MONTH" });

  if (loadingAccess || redirecting || loadingOrgs || loadingLocations) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (homeError) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <EmptyState
          title="Não foi possível carregar a Início"
          description="Tente novamente em instantes. Se o problema continuar, avise o suporte."
        />
      </PageContainer>
    );
  }

  if (loadingHome || !home) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  // A lista de unidades acima inclui arquivadas; a Início só considera unidades
  // ativas. Se todas estiverem arquivadas, orienta em vez de mostrar um painel vazio.
  if (!home.hasLocation) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <EmptyState
          title="Nenhuma unidade ativa"
          description="Ative uma unidade em Configurações > Unidades para ver o painel da Início."
        />
      </PageContainer>
    );
  }

  const shortcuts = home.shortcuts.map((key) => SHORTCUT_CONFIG[key]).filter(Boolean);
  const showFullChecklist = !home.onboarding.restricted && home.onboarding.profile?.status !== "DISMISSED";
  const showRestrictedNotice = home.onboarding.restricted && !home.onboarding.readyToOperate;
  const thisMonthCents = (financeThisMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);
  const lastMonthCents = (financeLastMonth.data ?? []).reduce((sum, p) => sum + p.revenueCents, 0);

  const panoramaTiles = [
    home.openTabsCount !== null
      ? { key: "openTabs", icon: <ClipboardList size={20} strokeWidth={1.8} />, value: home.openTabsCount, label: "Comandas abertas" }
      : null,
    home.tables !== null
      ? {
          key: "tables",
          icon: <LayoutGrid size={20} strokeWidth={1.8} />,
          value: `${home.tables.occupied}/${home.tables.total}`,
          label: "Mesas ativas",
        }
      : null,
    home.todaysReservations !== null
      ? {
          key: "reservations",
          icon: <CalendarClock size={20} strokeWidth={1.8} />,
          value: home.todaysReservations.length,
          label: "Reservas de hoje",
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => t !== null);

  const alertTiles = [
    (home.outOfStockCount ?? 0) > 0
      ? { key: "outOfStock", label: "Sem estoque", value: home.outOfStockCount, icon: <PackageX size={16} />, tone: "danger" as const }
      : null,
    (home.lowStockCount ?? 0) > 0
      ? { key: "lowStock", label: "Estoque baixo", value: home.lowStockCount, icon: <AlertTriangle size={16} />, tone: "warning" as const }
      : null,
    (home.overduePayablesCount ?? 0) > 0
      ? { key: "overduePayables", label: "Contas vencidas", value: home.overduePayablesCount, icon: <Clock3 size={16} />, tone: "danger" as const }
      : null,
    (home.cashDiscrepancyCount ?? 0) > 0
      ? {
          key: "cashDiscrepancy",
          label: "Divergências de caixa hoje",
          value: home.cashDiscrepancyCount,
          icon: <AlertTriangle size={16} />,
          tone: "warning" as const,
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <PageContainer>
      <PageHeader
        title="Início"
        description={
          venueRole === "RECEPTION"
            ? "Reservas, fila de espera e chegadas de hoje."
            : venueRole === "CASHIER"
              ? "Situação do caixa e comandas aguardando pagamento."
              : "O que está acontecendo agora e o que precisa da sua atenção."
        }
        actions={
          activeLocations.length > 1 ? (
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
          ) : undefined
        }
      />

      {showRestrictedNotice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          O responsável pela organização ainda está concluindo a configuração do Venue.
        </div>
      ) : null}

      {showFullChecklist && !home.onboarding.readyToOperate ? (
        <VenueReadinessChecklist
          status={home.onboarding}
          onDismiss={canManageSettings ? () => dismiss.mutate() : undefined}
        />
      ) : null}

      {/* Row 1 — Panorama Geral | Desempenho Financeiro | Progresso do Mês */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.12fr_0.66fr]">
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

          {home.financeSummary ? (
            <div className="mb-5">
              <p className="mb-2 text-[13.5px] text-white/60">Faturamento do dia</p>
              <p className={`font-poppins text-[28px] font-bold tracking-tight ${hideValues ? "blur-md" : ""}`}>
                {formatCentsBRL(home.financeSummary.totalCents)}
              </p>
            </div>
          ) : null}

          <div className={`mt-auto grid gap-3 ${panoramaTiles.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {panoramaTiles.map((tile) => (
              <div key={tile.key} className="rounded-2xl bg-white/[0.06] p-4">
                <div className="mb-3.5 text-violet-300">{tile.icon}</div>
                <p className={`font-poppins text-xl font-bold ${hideValues ? "blur-md" : ""}`}>{tile.value}</p>
                <p className="mt-0.5 text-xs text-white/50">{tile.label}</p>
              </div>
            ))}
          </div>
        </section>

        {canViewFinance ? (
          <FinanceTimelineChart
            data={finance.data}
            isLoading={finance.isLoading}
            className="rounded-[22px] shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]"
          />
        ) : null}

        {canViewFinance ? (
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
            {home.cashSessions !== null ? (
              <div className="flex items-center gap-3 py-3">
                <Wallet size={16} className="shrink-0 text-violet-500" />
                <span className="text-[14.5px] font-medium text-gray-900">Caixa</span>
                <span className="ml-auto text-sm font-semibold">
                  {home.cashSessions.length > 0 ? <span className="text-emerald-600">Aberto</span> : <span className="text-black/40">Fechado</span>}
                </span>
              </div>
            ) : null}
            {home.waitlistCount !== null ? (
              <div className="flex items-center gap-3 py-3">
                <Users2 size={16} className="shrink-0 text-violet-500" />
                <span className="text-[14.5px] font-medium text-gray-900">Clientes na fila</span>
                <span className="ml-auto text-sm font-semibold">{home.waitlistCount}</span>
              </div>
            ) : null}
            {home.ordersInPreparationCount !== null ? (
              <div className="flex items-center gap-3 py-3">
                <ChefHat size={16} className="shrink-0 text-violet-500" />
                <span className="text-[14.5px] font-medium text-gray-900">Pedidos em preparo</span>
                <span className="ml-auto text-sm font-semibold">{home.ordersInPreparationCount}</span>
              </div>
            ) : null}
            {home.ordersReadyCount !== null ? (
              <div className="flex items-center gap-3 py-3">
                <CheckCircle2 size={16} className="shrink-0 text-violet-500" />
                <span className="text-[14.5px] font-medium text-gray-900">Pedidos prontos</span>
                <span className="ml-auto text-sm font-semibold">{home.ordersReadyCount}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-poppins text-[19px] font-semibold tracking-tight text-foreground">Ações Rápidas</h2>
          {shortcuts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {shortcuts.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group relative flex min-h-[158px] flex-col rounded-2xl bg-white p-[18px] shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)] transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Plus size={20} strokeWidth={1.8} />
                  </div>
                  <h4 className="text-[15px] font-semibold text-gray-900">{s.label}</h4>
                  <p className="mt-1 text-[12.5px] leading-tight text-black/50">{s.description}</p>
                  <span className="absolute bottom-3.5 right-3.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-transform group-hover:translate-x-0.5">
                    <ArrowUpRight size={14} strokeWidth={2.2} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/50">Nenhuma ação rápida disponível para o seu papel agora.</p>
          )}
        </div>
      </div>

      {alertTiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {alertTiles.map((tile) => (
            <div
              key={tile.key}
              className={`rounded-xl border p-4 ${tile.tone === "danger" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}
            >
              <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${tile.tone === "danger" ? "text-red-700" : "text-amber-700"}`}>
                {tile.icon}
                {tile.label}
              </div>
              <p className="text-2xl font-semibold text-gray-900">{tile.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {home.todaysReservations && home.todaysReservations.length > 0 ? (
        <div className="rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(28,24,48,0.05)]">
          <p className="mb-3 text-sm font-semibold text-black/70">Próximas reservas</p>
          <div className="space-y-2">
            {home.todaysReservations.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-black/80">
                  {r.customerName} · {r.partySize} pessoas
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-black/50">
                    {new Date(r.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showFullChecklist && home.onboarding.readyToOperate && home.onboarding.progress < 100 ? (
        <VenueReadinessChecklist
          status={home.onboarding}
          title="Melhore sua configuração"
          onDismiss={canManageSettings ? () => dismiss.mutate() : undefined}
        />
      ) : null}

      {/* Visão Geral do Negócio */}
      <div>
        <h2 className="mb-4 font-poppins text-[19px] font-semibold tracking-tight text-foreground">Visão Geral do Negócio</h2>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(28,24,48,0.05),0_2px_6px_rgba(28,24,48,0.04)]">
            <div className="mb-[18px] flex items-center gap-2.5">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-violet-100 text-violet-600">
                <LayoutGrid size={19} strokeWidth={1.8} />
              </span>
              <h4 className="text-[16px] font-semibold text-gray-900">Operação</h4>
            </div>
            <p className="mb-1.5 text-[13px] text-black/60">Mesas ocupadas</p>
            {home.tables !== null ? (
              <>
                <p className="font-poppins text-[28px] font-bold leading-none tracking-tight text-foreground">
                  {home.tables.occupied} <span className="text-lg font-semibold text-black/40">/{home.tables.total}</span>
                </p>
                <div className="relative mt-3.5 h-[7px] overflow-hidden rounded-full bg-violet-50">
                  <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${home.tables.total > 0 ? Math.round((home.tables.occupied / home.tables.total) * 100) : 0}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="mb-4 mt-4" />
            )}
            <Link
              href="/dashboard/operacao"
              className="mt-4 flex h-[42px] items-center justify-center rounded-xl border border-black/10 bg-white text-[13.5px] font-semibold text-violet-600 transition-colors hover:bg-violet-50"
            >
              Ver mesas
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
              {key === "STOCK" ? (
                <p className="font-poppins text-[28px] font-bold leading-none tracking-tight text-foreground">
                  {(home.lowStockCount ?? 0) + (home.outOfStockCount ?? 0)}
                </p>
              ) : (
                <div className="mb-4 mt-4" />
              )}
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
