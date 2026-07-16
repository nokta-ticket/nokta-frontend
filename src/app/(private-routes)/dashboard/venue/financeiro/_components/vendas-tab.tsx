"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "../../cardapio/_hooks/use-debounce";
import {
  formatCentsBRL,
  VENUE_PAYMENT_METHOD_LABEL,
  type VenueFinancePeriodParams,
  type VenuePaymentMethod,
  type VenuePaymentStatus,
} from "@/services/venue-finance";
import { useVenueFinanceSales } from "../_hooks/use-venue-finance-sales";
import { SaleDetailSheet } from "./sale-detail-sheet";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

export function VendasTab({ orgId, locationId, period }: { orgId: number; locationId: number; period: VenueFinancePeriodParams }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [method, setMethod] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useVenueFinanceSales(orgId, locationId, {
    ...period,
    search: debouncedSearch || undefined,
    method: method !== "all" ? (method as VenuePaymentMethod) : undefined,
    status: status !== "all" ? (status as VenuePaymentStatus) : undefined,
    limit: 50,
  });

  const list = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/30" size={16} />
          <Input className="pl-9" placeholder="Buscar por comanda…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Forma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as formas</SelectItem>
            {(Object.keys(VENUE_PAYMENT_METHOD_LABEL) as VenuePaymentMethod[]).map((m) => (
              <SelectItem key={m} value={m}>{VENUE_PAYMENT_METHOD_LABEL[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="CONFIRMED">Confirmado</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as vendas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhuma venda no período" description="Os pagamentos confirmados na Operação aparecerão aqui." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Comanda</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer" onClick={() => setDetailId(sale.id)}>
                    <TableCell className="text-xs">{new Date(sale.confirmedAt).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{sale.tab.publicCode} {sale.tab.customerName ? `· ${sale.tab.customerName}` : ""}</TableCell>
                    <TableCell>{VENUE_PAYMENT_METHOD_LABEL[sale.method]}</TableCell>
                    <TableCell className="text-right">{formatCentsBRL(sale.amountCents)}</TableCell>
                    <TableCell className="text-right text-xs text-black/50">{formatCentsBRL(sale.financialSnapshot?.estimatedFeeCents ?? 0)}</TableCell>
                    <TableCell className="text-right">{formatCentsBRL(sale.financialSnapshot?.estimatedNetCents ?? sale.amountCents)}</TableCell>
                    <TableCell>
                      <GenericStatusBadge label={sale.status === "CONFIRMED" ? "Confirmado" : "Cancelado"} tone={sale.status === "CONFIRMED" ? "success" : "danger"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 sm:hidden">
            {list.map((sale) => (
              <div key={sale.id} className="rounded-xl border border-black/10 bg-white p-3" onClick={() => setDetailId(sale.id)}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sale.tab.publicCode}</span>
                  <GenericStatusBadge label={sale.status === "CONFIRMED" ? "Confirmado" : "Cancelado"} tone={sale.status === "CONFIRMED" ? "success" : "danger"} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-black/50">
                  <span>{VENUE_PAYMENT_METHOD_LABEL[sale.method]}</span>
                  <span>{new Date(sale.confirmedAt).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm font-medium">
                  <span>{formatCentsBRL(sale.amountCents)}</span>
                  <span className="text-black/60">líq. {formatCentsBRL(sale.financialSnapshot?.estimatedNetCents ?? sale.amountCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SaleDetailSheet orgId={orgId} paymentId={detailId} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} />
    </div>
  );
}
