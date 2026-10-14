"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { hourlyTotals, peakHour } from "../_lib/hourly-sales";

function moneyClass(hidden: boolean) {
  return cn("tnum transition-[filter] duration-200", hidden && "select-none blur-md");
}

/** Top 5 do período por faturamento (Insights · overview.topProducts). */
export function TopProductsCard({ products, isLoading, periodText, hideValues }: { products: { productId: number; nome: string; revenueCents: number }[] | undefined; isLoading: boolean; periodText: string; hideValues: boolean }) {
  const max = Math.max(1, ...(products ?? []).map((p) => p.revenueCents));
  return (
    <Card className="gap-0">
      <CardHeader className="items-center">
        <CardTitle>Mais vendidos · {periodText}</CardTitle>
        <Link href="/dashboard/insights" className="inline-flex items-center gap-1 text-caption font-semibold text-brand underline-offset-4 hover:underline">
          Ver no Insights
          <Icon name="arrow-right" size={10} />
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <EmptyState compact icon="utensils" title="Sem vendas no período" className="border-0 bg-transparent py-6" />
        ) : (
          <ol className="flex flex-col gap-3">
            {products.map((p, i) => (
              <li key={p.productId} className="flex items-center gap-3">
                <span className="w-5 text-caption font-semibold text-subtle-foreground tnum">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{p.nome}</span>
                  <span className="relative mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                    <span className="progress-draw absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${Math.max(4, (p.revenueCents / max) * 100)}%`, ["--i" as string]: i } as never} />
                  </span>
                </span>
                <span className={cn(moneyClass(hideValues), "w-24 text-right text-sm font-semibold text-foreground")}>{formatBRLCents(p.revenueCents)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/** Em que hora a casa vende mais, somando o período (Insights · overview.salesByHour). */
export function SalesByHourCard({ entries, isLoading, periodText, multiDay, hideValues }: { entries: { hour: number; amountCents: number }[] | undefined; isLoading: boolean; periodText: string; multiDay: boolean; hideValues: boolean }) {
  const totals = hourlyTotals(entries ?? []);
  const peak = peakHour(totals);
  const max = Math.max(1, ...totals);

  return (
    <Card className="gap-0">
      <CardHeader>
        <div>
          <CardTitle>Vendas por horário · {periodText}</CardTitle>
          <p className="mt-1 text-body text-muted-foreground">{peak === null ? "Sem vendas no período." : `Pico às ${peak}h${multiDay ? ", somando os dias do período" : ""}.`}</p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (
          <>
            <div className="flex h-40 items-end gap-1" role="img" aria-label={peak === null ? "Sem vendas no período" : `Maior venda às ${peak}h`}>
              {totals.map((v, h) => (
                <div
                  key={h}
                  title={hideValues ? `${String(h).padStart(2, "0")}h` : `${String(h).padStart(2, "0")}h · ${formatBRLCents(v)}`}
                  className={cn("progress-draw progress-draw-y flex-1 rounded-t-md transition-colors duration-150", v === 0 ? "bg-surface-2" : h === peak ? "bg-brand" : "bg-brand/40 hover:bg-brand/60")}
                  style={{ height: v === 0 ? "3%" : `${Math.max(6, (v / max) * 100)}%`, ["--i" as string]: Math.floor(h / 3) } as never}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-1 text-center text-micro text-subtle-foreground tnum" aria-hidden="true">
              {totals.map((_, h) => (
                <span key={h} className="flex-1">
                  {h % 3 === 0 ? `${String(h).padStart(2, "0")}h` : ""}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
