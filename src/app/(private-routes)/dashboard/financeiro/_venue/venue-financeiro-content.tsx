"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodDates, periodLabel, periodToFinanceParams, usePeriod } from "@/context/PeriodContext";
import { formatBRLCents } from "@/lib/format";
import type { VenueFinanceBasis, VenueFinancePeriodParams } from "@/services/venue-finance";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { useVenueFinanceOverview } from "./_hooks/use-venue-finance-overview";
import { CashSessionReportSheet } from "./_components/cash-session-report-sheet";
import { CashTab } from "./_components/cash-tab";
import { ExportDialog } from "./_components/export-dialog";
import { FeeRulesTab } from "./_components/fee-rules-tab";
import { todayInSaoPaulo } from "./_components/finance-shared";
import { OtherIncomeTab } from "./_components/other-income-tab";
import { OverviewTab } from "./_components/overview-tab";
import { PayablesTab } from "./_components/payables-tab";
import { ReconciliationTab } from "./_components/reconciliation-tab";
import { SalesTab } from "./_components/sales-tab";

type TabKey = "overview" | "sales" | "payables" | "income" | "fees" | "reconciliation" | "cash";

const TABS: { value: TabKey; label: string }[] = [
  { value: "overview", label: "Visão geral" },
  { value: "sales", label: "Vendas" },
  { value: "payables", label: "Contas a pagar" },
  { value: "income", label: "Outras receitas" },
  { value: "fees", label: "Taxas" },
  { value: "reconciliation", label: "Conciliação" },
  { value: "cash", label: "Caixa" },
];

/** Título + seletor de contexto (Ingressos | Bar) no mesmo lugar do Financeiro de ingressos. */
function Frame({ contextSwitch, children }: { contextSwitch?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" actions={contextSwitch} />
      {children}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[118px] w-full rounded-card" />
      ))}
    </div>
  );
}

/**
 * Financeiro do bar e restaurante: o dinheiro entra direto na maquininha e
 * no caixa do estabelecimento — a Nokta só registra. Sem saldo, custódia ou
 * saque (isso é exclusivo de Ingressos e nunca é somado aqui).
 */
export default function VenueFinanceiroPage({ contextSwitch }: { contextSwitch?: ReactNode }) {
  const { currentOrg, activeModuleKeys } = useOrganizations();
  const { period } = usePeriod();
  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");
  const locations = useVenueLocations(venueActive ? orgId : null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [basis, setBasis] = useState<VenueFinanceBasis>("CASH");
  const [tab, setTab] = useState<TabKey>("overview");
  const [exportOpen, setExportOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  useEffect(() => setLocationId(null), [orgId]);
  useEffect(() => {
    if (locationId !== null || !locations.data || locations.data.length === 0) return;
    setLocationId((locations.data.find((l) => l.isMain) ?? locations.data[0]).id);
  }, [locations.data, locationId]);

  const params = useMemo<VenueFinancePeriodParams>(() => ({ ...periodToFinanceParams(period), basis }), [period, basis]);
  const label = periodLabel(period);
  const days = useMemo(() => periodDates(period, todayInSaoPaulo()), [period]);
  const sessionRange = useMemo(() => {
    const last = new Date(`${days[days.length - 1]}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    return { startDate: `${days[0]}T03:00:00.000Z`, endDate: `${last.toISOString().slice(0, 10)}T03:00:00.000Z` };
  }, [days]);

  const overview = useVenueFinanceOverview(orgId, locationId, params);
  const o = overview.data;
  const location = locations.data?.find((l) => l.id === locationId) ?? null;

  if (!orgId || !venueActive) {
    return (
      <Frame contextSwitch={contextSwitch}>
        <EmptyState icon="store" title="Operação não está ativa" description="Ative a Operação do bar e restaurante em Explore a Nokta para ver as vendas aqui." />
      </Frame>
    );
  }
  if (locations.isError) {
    return (
      <Frame contextSwitch={contextSwitch}>
        <ErrorState description="Não foi possível carregar as unidades." onRetry={() => locations.refetch()} />
      </Frame>
    );
  }
  if (locations.data && locations.data.length === 0) {
    return (
      <Frame contextSwitch={contextSwitch}>
        <OnboardingLocation orgId={orgId} />
      </Frame>
    );
  }

  const overdue = o?.payablesOverdueCount ?? 0;

  return (
    <Frame contextSwitch={contextSwitch}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedControl<VenueFinanceBasis>
          size="sm"
          value={basis}
          onChange={setBasis}
          options={[
            { value: "CASH", label: "Regime de caixa", icon: "wallet" },
            { value: "ACCRUAL", label: "Competência", icon: "calendar" },
          ]}
        />
        <div className="flex items-center gap-2">
          {locations.data && locations.data.length > 1 && locationId !== null ? (
            <NativeSelect aria-label="Unidade" value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className="flex-1 lg:w-60 lg:flex-none">
              {locations.data.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </NativeSelect>
          ) : null}
          <Button variant="outline" leftIcon="download" onClick={() => setExportOpen(true)} disabled={locationId === null} className="shrink-0">
            Exportar CSV
          </Button>
        </div>
      </div>

      {locationId === null ? (
        <StatsSkeleton />
      ) : overview.isError ? (
        <ErrorState description="Não foi possível carregar o resumo financeiro." onRetry={() => overview.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Receita bruta" icon="sack-dollar" format="currency" value={o ? o.grossRevenueCents / 100 : null} loading={overview.isLoading} hint={o ? `${label} · ${formatBRLCents(o.discountCents)} em descontos` : label} />
            <StatCard label="Receita líquida" icon="hand-dollar" format="currency" value={o ? o.netRevenueCents / 100 : null} loading={overview.isLoading} hint={o ? `Taxas estimadas: ${formatBRLCents(o.estimatedFeeCents)}` : label} />
            <StatCard
              label="Resultado operacional"
              icon="chart-line"
              format="currency"
              value={o ? o.operationalResultCents / 100 : null}
              loading={overview.isLoading}
              hint={o ? (o.operationalResultCents < 0 ? <span className="font-medium text-danger">Prejuízo em {label.toLowerCase()}</span> : `Após CMV, despesas e outras receitas`) : label}
            />
            <StatCard
              label="Contas a pagar em aberto"
              icon="invoice"
              value={o?.payablesOpenCount}
              loading={overview.isLoading}
              hint={o ? (overdue > 0 ? <span className="font-medium text-danger">{overdue === 1 ? "1 vencida" : `${overdue} vencidas`}</span> : "Nenhuma vencida") : undefined}
            />
          </div>

          {overview.isLoading || !o ? (
            <Skeleton className="h-14 w-full rounded-card" />
          ) : (
            <Callout tone="neutral" icon="info">
              {o.disclaimer}
            </Callout>
          )}
        </>
      )}

      {locationId !== null ? (
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList variant="line" className="-mx-4 w-auto px-4 lg:mx-0 lg:px-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab orgId={orgId} locationId={locationId} params={params} days={days} periodLabel={label} sessionRange={sessionRange} onOpenCashTab={() => setTab("cash")} onOpenSession={setSessionId} />
          </TabsContent>
          <TabsContent value="sales">
            <SalesTab key={locationId} orgId={orgId} locationId={locationId} params={params} periodLabel={label} />
          </TabsContent>
          <TabsContent value="payables">
            <PayablesTab key={locationId} orgId={orgId} locationId={locationId} />
          </TabsContent>
          <TabsContent value="income">
            <OtherIncomeTab key={locationId} orgId={orgId} locationId={locationId} days={days} periodLabel={label} />
          </TabsContent>
          <TabsContent value="fees">
            <FeeRulesTab key={locationId} orgId={orgId} locationId={locationId} locationName={location?.nome ?? null} />
          </TabsContent>
          <TabsContent value="reconciliation">
            <ReconciliationTab key={locationId} orgId={orgId} locationId={locationId} days={days} periodLabel={label} />
          </TabsContent>
          <TabsContent value="cash">
            <CashTab key={locationId} orgId={orgId} locationId={locationId} sessionRange={sessionRange} periodLabel={label} onOpenSession={setSessionId} />
          </TabsContent>
        </Tabs>
      ) : null}

      {locationId !== null ? <ExportDialog orgId={orgId} locationId={locationId} locationName={location?.nome ?? null} params={params} days={days} periodLabel={label} open={exportOpen} onOpenChange={setExportOpen} /> : null}
      <CashSessionReportSheet orgId={orgId} sessionId={sessionId} open={sessionId !== null} onOpenChange={(v) => !v && setSessionId(null)} />
    </Frame>
  );
}
