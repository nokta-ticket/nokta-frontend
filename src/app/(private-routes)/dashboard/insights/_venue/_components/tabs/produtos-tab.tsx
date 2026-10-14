"use client";

import { useEffect, useState } from "react";
import { DataTablePagination } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { SectionHeader } from "@/components/ui/section-header";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { formatBRLCents } from "@/lib/format";
import type { VenueInsightsFilterParams, VenueInsightsProductRow, VenueInsightsProducts } from "@/services/venue-insights";
import { useVenueInsightsProducts } from "../../_hooks/use-venue-insights";
import { InsightsPanel, ProportionBars, RankList, type RankRow } from "../insights-charts";
import { InsightsTable, type InsightsColumn } from "../insights-ranking-table";
import { plural, TabError, TabSkeleton } from "../insights-states";

type RankingKey = keyof VenueInsightsProducts["rankings"];

const RANKING_OPTIONS: SegmentedOption<RankingKey>[] = [
  { value: "mostSold", label: "Mais vendidos" },
  { value: "topRevenue", label: "Maior faturamento" },
  { value: "topMargin", label: "Maior margem" },
  { value: "lowestMargin", label: "Menor margem" },
  { value: "mostCanceled", label: "Mais cancelados" },
];

const RANKING_DESCRIPTION: Record<RankingKey, string> = {
  mostSold: "Top 5 por quantidade vendida",
  topRevenue: "Top 5 por faturamento",
  topMargin: "Top 5 por margem em reais",
  lowestMargin: "Os 5 com a menor margem percentual",
  mostCanceled: "Top 5 por itens cancelados",
};

const PAGE_SIZE = 10;

const count = (n: number) => n.toLocaleString("pt-BR");

/** `marginPercentage` já vem em porcento (0–100), como `averageServiceChargeRateBps` vem em bps. */
function formatMarginPct(value: number | null): string {
  return value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function rankRow(r: VenueInsightsProductRow, key: RankingKey): RankRow {
  const base = { key: `${r.productId}-${r.variantId}`, label: r.nome, sublabel: r.variantNome || undefined };
  switch (key) {
    case "mostSold":
      return { ...base, value: r.quantitySold, display: `${count(r.quantitySold)} un.`, meta: formatBRLCents(r.revenueCents) };
    case "topRevenue":
      return { ...base, value: r.revenueCents, display: formatBRLCents(r.revenueCents), meta: `${count(r.quantitySold)} un. · margem de ${formatMarginPct(r.marginPercentage)}` };
    case "topMargin":
      return { ...base, value: r.marginCents, display: formatBRLCents(r.marginCents), meta: `Margem de ${formatMarginPct(r.marginPercentage)}` };
    case "lowestMargin":
      return { ...base, value: r.marginPercentage ?? 0, display: formatMarginPct(r.marginPercentage), meta: `${formatBRLCents(r.marginCents)} de margem` };
    case "mostCanceled":
      return { ...base, value: r.canceledCount, display: plural(r.canceledCount, "cancelamento", "cancelamentos"), meta: `${count(r.quantitySold)} un. vendidas` };
  }
}

const TABLE_COLUMNS: InsightsColumn<VenueInsightsProductRow>[] = [
  {
    key: "produto",
    header: "Produto",
    render: (r) => (
      <span className="font-medium">
        {r.nome}
        {r.variantNome ? <span className="ml-1.5 font-normal text-muted-foreground">{r.variantNome}</span> : null}
      </span>
    ),
  },
  { key: "qtd", header: "Qtd.", num: true, mobileLabel: "Quantidade", render: (r) => count(r.quantitySold) },
  { key: "preco", header: "Preço médio", num: true, mobileLabel: "Preço médio", render: (r) => (r.averagePriceCents !== null ? formatBRLCents(r.averagePriceCents) : "—") },
  { key: "fat", header: "Faturamento", num: true, mobileLabel: "Faturamento", render: (r) => formatBRLCents(r.revenueCents) },
  { key: "margem", header: "Margem", num: true, mobileLabel: "Margem", render: (r) => formatMarginPct(r.marginPercentage) },
];

export function ProdutosTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const [ranking, setRanking] = useState<RankingKey>("mostSold");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search.trim());

  // Rankings e categorias vêm do mesmo endpoint, sem busca/página — a tabela
  // completa faz a própria chamada pra não piscar os rankings a cada tecla.
  const rankings = useVenueInsightsProducts(orgId, params);
  const table = useVenueInsightsProducts(orgId, { ...params, search: debounced || undefined, page, limit: PAGE_SIZE });

  // Mantém a última página na tela enquanto a próxima carrega (busca/paginação).
  const [cachedTable, setCachedTable] = useState<VenueInsightsProducts["table"] | null>(null);
  useEffect(() => {
    if (table.data) setCachedTable(table.data.table);
  }, [table.data]);
  useEffect(() => {
    setPage(1);
  }, [debounced, params]);

  if (rankings.isLoading) return <TabSkeleton secondary={false} />;
  if (rankings.isError || !rankings.data) return <TabError onRetry={() => void rankings.refetch()} />;

  const data = rankings.data;
  const rows = data.rankings[ranking];
  const current = table.data?.table ?? cachedTable;
  const lastPage = current ? Math.max(1, Math.ceil(current.total / Math.max(1, current.limit))) : 1;

  return (
    <div className="space-y-6">
      <InsightsPanel title="Rankings de produtos" description={RANKING_DESCRIPTION[ranking]}>
        <div className="scrollbar-hide -mx-5 mb-5 overflow-x-auto px-5">
          <SegmentedControl size="sm" value={ranking} onChange={setRanking} options={RANKING_OPTIONS} />
        </div>
        {rows.length === 0 ? <EmptyState compact icon="utensils" title="Sem vendas no período" description="Este ranking aparece aqui conforme houver vendas no período." /> : <RankList rows={rows.map((r) => rankRow(r, ranking))} />}
      </InsightsPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Faturamento por categoria" description="Fatia de cada categoria no faturamento" empty={data.categoriesRanking.length === 0} emptyIcon="layers" emptyTitle="Sem vendas no período" emptyDescription="O faturamento por categoria aparece aqui conforme houver vendas.">
          <ProportionBars
            rows={data.categoriesRanking.map((c) => ({
              key: c.nome,
              label: (
                <>
                  {c.nome} <span className="text-muted-foreground">· {count(c.quantitySold)} un.</span>
                </>
              ),
              value: c.revenueCents,
              display: formatBRLCents(c.revenueCents),
            }))}
          />
        </InsightsPanel>
        <InsightsPanel title="Adicionais mais escolhidos" description="Vezes que cada adicional entrou num pedido" empty={data.modifiersRanking.length === 0} emptyIcon="plus-circle" emptyTitle="Sem adicionais no período" emptyDescription="Os adicionais mais escolhidos aparecem aqui conforme houver vendas.">
          <RankList color="var(--chart-2)" rows={data.modifiersRanking.map((m) => ({ key: m.modifierOptionId, label: m.nome, value: m.count, display: `${count(m.count)}×`, meta: m.revenueCents > 0 ? formatBRLCents(m.revenueCents) : "Sem cobrança" }))} />
        </InsightsPanel>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Todos os produtos" description={current ? `${plural(current.total, "produto com venda", "produtos com venda")} no período` : undefined} />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar produto…" className="max-w-xl" />
        <InsightsTable
          rows={current?.data ?? []}
          columns={TABLE_COLUMNS}
          rowKey={(r) => `${r.productId}-${r.variantId}`}
          loading={!current && table.isLoading}
          fetching={table.isFetching}
          emptyIcon="utensils"
          emptyTitle={debounced ? "Nenhum produto encontrado" : "Sem vendas no período"}
          emptyDescription={debounced ? `Nada com “${debounced}” no período.` : "A lista completa aparece aqui conforme houver vendas."}
          title={(r) => r.nome}
          subtitle={(r) => r.variantNome || undefined}
          footer={current && lastPage > 1 ? <DataTablePagination page={current.page} lastPage={lastPage} total={current.total} perPage={current.limit} noun="produtos" onPageChange={setPage} /> : undefined}
        />
      </section>
    </div>
  );
}
