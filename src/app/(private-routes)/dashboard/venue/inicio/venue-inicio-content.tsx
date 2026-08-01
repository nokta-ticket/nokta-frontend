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
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { VenueReadinessChecklist } from "../_components/venue-readiness-checklist";
import { useVenueSetupLifecycle } from "../../configuracoes/_hooks/use-venue-settings";
import { useVenueFinanceTimeline } from "../../financeiro/_venue/_hooks/use-venue-finance-overview";
import { useVenueHome } from "./_hooks/use-venue-home";

const SHORTCUT_CONFIG: Record<string, { label: string; href: string }> = {
  new_reservation: { label: "Nova reserva", href: "/dashboard/reservas" },
  open_tab: { label: "Abrir comanda", href: "/dashboard/operacao?tab=mesas" },
  new_order: { label: "Novo pedido", href: "/dashboard/operacao?tab=pedidos" },
  open_cash: { label: "Abrir caixa", href: "/dashboard/operacao?tab=caixa" },
  register_purchase: { label: "Registrar compra", href: "/dashboard/estoque" },
  invite_team: { label: "Convidar equipe", href: "/dashboard/equipe" },
};

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

      {/* Panorama Geral */}
      <section className="rounded-2xl bg-gradient-to-br from-[#1d1834] to-[#141020] p-6 text-white">
        <p className="mb-5 text-sm font-medium text-white/60">Panorama Geral</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {home.financeSummary ? (
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-3 text-violet-300"><DollarSign size={20} /></div>
              <p className="font-serif text-2xl font-bold">{formatCentsBRL(home.financeSummary.totalCents)}</p>
              <p className="mt-1 text-xs text-white/50">Vendas de hoje</p>
            </div>
          ) : null}
          {home.openTabsCount !== null ? (
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-3 text-violet-300"><ClipboardList size={20} /></div>
              <p className="font-serif text-2xl font-bold">{home.openTabsCount}</p>
              <p className="mt-1 text-xs text-white/50">Comandas abertas</p>
            </div>
          ) : null}
          {home.tables !== null ? (
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-3 text-violet-300"><LayoutGrid size={20} /></div>
              <p className="font-serif text-2xl font-bold">
                {home.tables.occupied}/{home.tables.total}
              </p>
              <p className="mt-1 text-xs text-white/50">Mesas ocupadas</p>
            </div>
          ) : null}
          {home.todaysReservations !== null ? (
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-3 text-violet-300"><CalendarClock size={20} /></div>
              <p className="font-serif text-2xl font-bold">{home.todaysReservations.length}</p>
              <p className="mt-1 text-xs text-white/50">Reservas de hoje</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Desempenho Financeiro */}
      {canViewFinance ? <FinanceTimelineChart data={finance.data} isLoading={finance.isLoading} /> : null}

      {/* Ações Rápidas */}
      {shortcuts.length > 0 ? (
        <div>
          <p className="mb-3 text-lg font-semibold tracking-tight">Ações Rápidas</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative flex min-h-[120px] flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Plus size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <span className="absolute bottom-3.5 right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Indicadores do Dia */}
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <p className="mb-1 text-base font-semibold text-gray-900">Indicadores do Dia</p>
        <div className="divide-y divide-black/5">
          {home.cashSessions !== null ? (
            <div className="flex items-center gap-3 py-3">
              <Wallet size={16} className="text-violet-500" />
              <span className="text-sm font-medium text-gray-900">Caixa</span>
              <span className="ml-auto text-sm font-semibold">
                {home.cashSessions.length > 0 ? <span className="text-emerald-600">Aberto</span> : <span className="text-black/40">Fechado</span>}
              </span>
            </div>
          ) : null}
          {home.waitlistCount !== null ? (
            <div className="flex items-center gap-3 py-3">
              <Users2 size={16} className="text-violet-500" />
              <span className="text-sm font-medium text-gray-900">Clientes na fila</span>
              <span className="ml-auto text-sm font-semibold">{home.waitlistCount}</span>
            </div>
          ) : null}
          {home.ordersInPreparationCount !== null ? (
            <div className="flex items-center gap-3 py-3">
              <ChefHat size={16} className="text-violet-500" />
              <span className="text-sm font-medium text-gray-900">Pedidos em preparo</span>
              <span className="ml-auto text-sm font-semibold">{home.ordersInPreparationCount}</span>
            </div>
          ) : null}
          {home.ordersReadyCount !== null ? (
            <div className="flex items-center gap-3 py-3">
              <CheckCircle2 size={16} className="text-violet-500" />
              <span className="text-sm font-medium text-gray-900">Pedidos prontos</span>
              <span className="ml-auto text-sm font-semibold">{home.ordersReadyCount}</span>
            </div>
          ) : null}
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
        <div className="rounded-xl border bg-white p-4">
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
    </PageContainer>
  );
}
