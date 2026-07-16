"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCentsBRL, formatRate, type VenueInsightsFilterParams, type VenueInsightsProductRow } from "@/services/venue-insights";
import { useVenueInsightsProducts } from "../../_hooks/use-venue-insights";
import { InsightsHorizontalMoneyBarChart } from "../insights-charts";
import { InsightsRankingTable, type InsightsTableColumn } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

const productColumns: InsightsTableColumn<VenueInsightsProductRow>[] = [
  { header: "Produto", render: (r) => `${r.nome}${r.variantNome ? ` · ${r.variantNome}` : ""}` },
  { header: "Qtd.", align: "right", mobileLabel: "Quantidade", render: (r) => String(r.quantitySold) },
  { header: "Preço médio", align: "right", mobileLabel: "Preço médio", render: (r) => (r.averagePriceCents !== null ? formatCentsBRL(r.averagePriceCents) : "—") },
  { header: "Faturamento", align: "right", mobileLabel: "Faturamento", render: (r) => formatCentsBRL(r.revenueCents) },
  { header: "Margem", align: "right", mobileLabel: "Margem", render: (r) => (r.marginPercentage !== null ? formatRate(r.marginPercentage) : "—") },
];

const canceledColumns: InsightsTableColumn<VenueInsightsProductRow>[] = [
  { header: "Produto", render: (r) => `${r.nome}${r.variantNome ? ` · ${r.variantNome}` : ""}` },
  { header: "Cancelamentos", align: "right", mobileLabel: "Cancelamentos", render: (r) => String(r.canceledCount) },
];

type RankingKey = "mostSold" | "topRevenue" | "topMargin" | "lowestMargin" | "mostCanceled";
const RANKING_TABS: { key: RankingKey; label: string }[] = [
  { key: "mostSold", label: "Mais vendidos" },
  { key: "topRevenue", label: "Maior faturamento" },
  { key: "topMargin", label: "Maior margem" },
  { key: "lowestMargin", label: "Menor margem" },
  { key: "mostCanceled", label: "Mais cancelados" },
];

export function ProdutosTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsProducts(orgId, params);
  const [ranking, setRanking] = useState<RankingKey>("mostSold");

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Tabs value={ranking} onValueChange={(v) => setRanking(v as RankingKey)}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-max min-w-full sm:w-fit">
              {RANKING_TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          {RANKING_TABS.map((t) => (
            <TabsContent key={t.key} value={t.key}>
              <InsightsRankingTable
                rows={data.rankings[t.key]}
                keyExtractor={(r) => `${r.productId}-${r.variantId}`}
                emptyTitle="Sem dados no período"
                emptyDescription="Este ranking aparecerá aqui conforme houver vendas no período selecionado."
                columns={t.key === "mostCanceled" ? canceledColumns : productColumns}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightsHorizontalMoneyBarChart
          data={data.categoriesRanking}
          isLoading={isLoading}
          title="Faturamento por categoria"
          dataKey="revenueCents"
          labelKey="nome"
          emptyTitle="Sem vendas no período"
          emptyDescription="O faturamento por categoria aparecerá aqui conforme houver vendas."
        />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Adicionais mais escolhidos</h3>
          <InsightsRankingTable
            rows={data.modifiersRanking}
            keyExtractor={(r) => r.modifierOptionId}
            emptyTitle="Sem adicionais vendidos no período"
            emptyDescription="Os adicionais mais escolhidos aparecerão aqui conforme houver vendas."
            columns={[
              { header: "Adicional", render: (r) => r.nome },
              { header: "Qtd.", align: "right", mobileLabel: "Quantidade", render: (r) => String(r.count) },
              { header: "Faturamento", align: "right", mobileLabel: "Faturamento", render: (r) => formatCentsBRL(r.revenueCents) },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Todos os produtos</h3>
        <InsightsRankingTable
          rows={data.table.data}
          keyExtractor={(r) => `${r.productId}-${r.variantId}`}
          emptyTitle="Sem vendas no período"
          emptyDescription="A lista completa de produtos aparecerá aqui conforme houver vendas."
          columns={productColumns}
        />
        <p className="text-xs text-black/40">
          Mostrando {data.table.data.length} de {data.table.total} produto(s).
        </p>
      </div>
    </div>
  );
}
