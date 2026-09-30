"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { formatCentsBRL } from "@/services/venue-finance";
import { cn } from "@/lib/utils";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { hourlyTotals, peakHour } from "../_lib/hourly-sales";

const SURFACE = "rounded-[20px] border border-[#ebe8f2] bg-white";

function moneyClass(hidden: boolean) {
  return cn("font-poppins tabular-nums transition-[filter] duration-200", hidden && "blur-md select-none");
}

/** Top 5 do período por faturamento (Insights · overview.topProducts). */
export function TopProductsCard({
  products,
  isLoading,
  periodText,
  hideValues,
}: {
  products: { productId: number; nome: string; revenueCents: number }[] | undefined;
  isLoading: boolean;
  periodText: string;
  hideValues: boolean;
}) {
  const max = Math.max(1, ...(products ?? []).map((p) => p.revenueCents));
  return (
    <section aria-labelledby="home-top-products" className={cn(SURFACE, "flex flex-col px-3 pb-3 pt-6")}>
      <div className="mb-2 flex items-baseline justify-between gap-3 px-3">
        <h2 id="home-top-products" className="text-[17px] font-semibold text-gray-900">
          Mais vendidos · {periodText}
        </h2>
        <Link href="/dashboard/insights" className="rounded-md text-[13px] font-semibold text-violet-700 hover:text-violet-800">
          Ver no Insights
        </Link>
      </div>
      {isLoading ? (
        <BlockSkeleton className="mx-3 h-48" />
      ) : !products || products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <UtensilsCrossed size={22} strokeWidth={1.8} className="text-black/30" />
          <p className="mt-2.5 text-[13.5px] text-black/60">Sem vendas no período.</p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {products.map((p, i) => (
            <li key={p.productId} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-4 font-poppins text-[13px] font-semibold tabular-nums text-black/35">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-gray-900">{p.nome}</span>
                <span className="relative mt-1.5 block h-1.5 rounded-full bg-violet-50" aria-hidden="true">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-violet-500" style={{ width: `${Math.max(4, (p.revenueCents / max) * 100)}%` }} />
                </span>
              </span>
              <span className={cn(moneyClass(hideValues), "w-24 text-right text-[13.5px] font-semibold")}>{formatCentsBRL(p.revenueCents)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Em que hora a casa vende mais, somando o período (Insights · overview.salesByHour). */
export function SalesByHourCard({
  entries,
  isLoading,
  periodText,
  multiDay,
  hideValues,
}: {
  entries: { hour: number; amountCents: number }[] | undefined;
  isLoading: boolean;
  periodText: string;
  multiDay: boolean;
  hideValues: boolean;
}) {
  const totals = hourlyTotals(entries ?? []);
  const peak = peakHour(totals);
  const max = Math.max(1, ...totals);

  return (
    <section aria-labelledby="home-by-hour" className={cn(SURFACE, "p-6")}>
      <h2 id="home-by-hour" className="text-[17px] font-semibold text-gray-900">
        Vendas por horário · {periodText}
      </h2>
      <p className="mt-0.5 text-[13.5px] text-black/60">
        {peak === null ? "Sem vendas no período." : `Pico às ${peak}h${multiDay ? ", somando o período" : ""}`}
      </p>
      {isLoading ? (
        <BlockSkeleton className="mt-4 h-[150px]" />
      ) : (
        <>
          <div className="mt-4 flex h-[150px] items-end gap-1.5" role="img" aria-label={peak === null ? "Sem vendas no período" : `Maior venda às ${peak}h`}>
            {totals.map((v, h) => (
              <div
                key={h}
                title={hideValues ? `${String(h).padStart(2, "0")}h` : `${String(h).padStart(2, "0")}h · ${formatCentsBRL(v)}`}
                className={cn(
                  "flex-1 rounded-t-[5px] transition-colors duration-150",
                  v === 0 ? "bg-[#efedf4]" : h === peak ? "bg-violet-600" : "bg-violet-300 hover:bg-violet-400",
                )}
                style={{ height: v === 0 ? "3%" : `${Math.max(6, (v / max) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-center text-[11px] text-black/45" aria-hidden="true">
            {totals.map((_, h) => (
              <span key={h} className="flex-1">
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}h` : ""}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
