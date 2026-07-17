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
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { formatCentsBRL } from "@/services/venue-finance";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { useVenueLocations } from "../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../operacao/_components/onboarding-location";
import { VenueReadinessChecklist } from "../_components/venue-readiness-checklist";
import { useVenueSetupLifecycle } from "../../configuracoes/_hooks/use-venue-settings";
import { useVenueHome } from "./_hooks/use-venue-home";
import { HomeMetricCard } from "./_components/home-metric-card";

const SHORTCUT_CONFIG: Record<string, { label: string; href: string }> = {
  new_reservation: { label: "Nova reserva", href: "/dashboard/venue/reservas" },
  open_tab: { label: "Abrir comanda", href: "/dashboard/venue/operacao?tab=mesas" },
  new_order: { label: "Novo pedido", href: "/dashboard/venue/operacao?tab=pedidos" },
  open_cash: { label: "Abrir caixa", href: "/dashboard/venue/operacao?tab=caixa" },
  register_purchase: { label: "Registrar compra", href: "/dashboard/venue/estoque" },
  invite_team: { label: "Convidar equipe", href: "/dashboard/equipe" },
};

/**
 * Rota inicial padrão do Venue. WAITER, KITCHEN_BAR e STOCK continuam sendo
 * redirecionados direto para a tela operacional que usam o dia todo (rota
 * sugerida pelo backend em `defaultRoute`); OWNER, MANAGER, RECEPTION e
 * CASHIER ficam aqui e veem um painel real, recortado pelo que cada um pode
 * ver (`/organizations/:id/venue/home`, já filtrado por permissão).
 */
export default function VenueInicioPage() {
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
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    if (locationId !== null || !locations || locations.length === 0) return;
    setLocationId((locations.find((l) => l.isMain) ?? locations[0]).id);
  }, [locations, locationId]);

  const { data: home, isLoading: loadingHome } = useVenueHome(!redirecting ? orgId : null, locationId);
  const { dismiss } = useVenueSetupLifecycle(orgId ?? -1);

  const canManageSettings = can("organization.settings.manage");

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

  if (loadingHome || !home) {
    return (
      <PageContainer>
        <PageHeader title="Início" description="O que está acontecendo agora e o que precisa da sua atenção." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const shortcuts = home.shortcuts.map((key) => SHORTCUT_CONFIG[key]).filter(Boolean);
  const showFullChecklist = !home.onboarding.restricted && home.onboarding.profile?.status !== "DISMISSED";
  const showRestrictedNotice = home.onboarding.restricted && !home.onboarding.readyToOperate;

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
          locations && locations.length > 1 ? (
            <Select value={locationId ? String(locationId) : ""} onValueChange={(v) => setLocationId(Number(v))}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
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

      {shortcuts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <Button key={s.href} variant="outline" size="sm" asChild>
              <Link href={s.href}>
                <Plus size={14} /> {s.label}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}

      {showFullChecklist && !home.onboarding.readyToOperate ? (
        <VenueReadinessChecklist
          status={home.onboarding}
          onDismiss={canManageSettings ? () => dismiss.mutate() : undefined}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {home.financeSummary ? (
          <HomeMetricCard
            label="Vendas de hoje"
            value={formatCentsBRL(home.financeSummary.totalCents)}
            icon={<DollarSign size={16} />}
          />
        ) : null}
        {home.openTabsCount !== null ? (
          <HomeMetricCard label="Comandas abertas" value={home.openTabsCount} icon={<ClipboardList size={16} />} />
        ) : null}
        {home.todaysReservations !== null ? (
          <HomeMetricCard
            label="Reservas de hoje"
            value={home.todaysReservations.length}
            icon={<CalendarClock size={16} />}
          />
        ) : null}
        {home.ordersInPreparationCount !== null ? (
          <HomeMetricCard label="Pedidos em preparo" value={home.ordersInPreparationCount} icon={<ChefHat size={16} />} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {home.cashSessions !== null ? (
          <HomeMetricCard
            label="Caixa"
            value={
              home.cashSessions.length > 0 ? (
                <span className="text-emerald-600">Aberto</span>
              ) : (
                <span className="text-black/40">Fechado</span>
              )
            }
            icon={<Wallet size={16} />}
          />
        ) : null}
        {home.tables !== null ? (
          <HomeMetricCard
            label="Mesas ocupadas"
            value={`${home.tables.occupied}/${home.tables.total}`}
            icon={<LayoutGrid size={16} />}
          />
        ) : null}
        {home.waitlistCount !== null ? (
          <HomeMetricCard label="Clientes na fila" value={home.waitlistCount} icon={<Users2 size={16} />} />
        ) : null}
        {home.ordersReadyCount !== null ? (
          <HomeMetricCard label="Pedidos prontos" value={home.ordersReadyCount} icon={<CheckCircle2 size={16} />} />
        ) : null}
      </div>

      {(home.lowStockCount ?? 0) > 0 || (home.outOfStockCount ?? 0) > 0 || (home.overduePayablesCount ?? 0) > 0 || (home.cashDiscrepancyCount ?? 0) > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(home.outOfStockCount ?? 0) > 0 ? (
            <HomeMetricCard label="Sem estoque" value={home.outOfStockCount} icon={<PackageX size={16} />} tone="danger" />
          ) : null}
          {(home.lowStockCount ?? 0) > 0 ? (
            <HomeMetricCard label="Estoque baixo" value={home.lowStockCount} icon={<AlertTriangle size={16} />} tone="warning" />
          ) : null}
          {(home.overduePayablesCount ?? 0) > 0 ? (
            <HomeMetricCard label="Contas vencidas" value={home.overduePayablesCount} icon={<Clock3 size={16} />} tone="danger" />
          ) : null}
          {(home.cashDiscrepancyCount ?? 0) > 0 ? (
            <HomeMetricCard
              label="Divergências de caixa hoje"
              value={home.cashDiscrepancyCount}
              icon={<AlertTriangle size={16} />}
              tone="warning"
            />
          ) : null}
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
