"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "../../../cardapio/_hooks/use-debounce";
import { formatCentsBRL, VENUE_PAYABLE_STATUS_LABEL, type VenuePayable, type VenuePayableStatus } from "@/services/venue-finance";
import { useVenueFinancePayables } from "../_hooks/use-venue-finance-payables";
import { PayableDetailSheet } from "./payable-detail-sheet";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function statusTone(status: VenuePayable["status"]) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE" || status === "CANCELED") return "danger" as const;
  if (status === "PARTIALLY_PAID") return "warning" as const;
  return "neutral" as const;
}

export function ContasAPagarTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState<string>("all");
  const [detail, setDetail] = useState<VenuePayable | null>(null);

  const { data, isLoading, isError, refetch } = useVenueFinancePayables(orgId, {
    locationId,
    status: status !== "all" ? (status as VenuePayableStatus) : undefined,
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const list = data?.data ?? [];
  const now = Date.now();
  const dueBuckets = {
    today: list.filter((p) => p.dueAt && p.status !== "PAID" && p.status !== "CANCELED" && new Date(p.dueAt).toDateString() === new Date().toDateString()).length,
    in3: list.filter((p) => p.dueAt && p.status !== "PAID" && p.status !== "CANCELED" && new Date(p.dueAt).getTime() - now <= 3 * 86400000 && new Date(p.dueAt).getTime() - now >= 0).length,
    in7: list.filter((p) => p.dueAt && p.status !== "PAID" && p.status !== "CANCELED" && new Date(p.dueAt).getTime() - now <= 7 * 86400000 && new Date(p.dueAt).getTime() - now >= 0).length,
    in30: list.filter((p) => p.dueAt && p.status !== "PAID" && p.status !== "CANCELED" && new Date(p.dueAt).getTime() - now <= 30 * 86400000 && new Date(p.dueAt).getTime() - now >= 0).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DueBucket label="Vencendo hoje" value={dueBuckets.today} />
        <DueBucket label="Em 3 dias" value={dueBuckets.in3} />
        <DueBucket label="Em 7 dias" value={dueBuckets.in7} />
        <DueBucket label="Em 30 dias" value={dueBuckets.in30} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/30" size={16} />
          <Input className="pl-9" placeholder="Buscar por código ou descrição…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Parcialmente pagas</SelectItem>
            <SelectItem value="PAID">Pagas</SelectItem>
            <SelectItem value="OVERDUE">Vencidas</SelectItem>
            <SelectItem value="CANCELED">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as contas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhuma conta encontrada" description="Contas manuais e geradas a partir de compras do Estoque aparecem aqui." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Restante</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setDetail(p)}>
                  <TableCell className="font-medium">{p.publicCode}</TableCell>
                  <TableCell className="max-w-48 truncate">{p.description}</TableCell>
                  <TableCell>{p.supplier?.nome ?? "—"}</TableCell>
                  <TableCell className="text-xs text-black/50">{p.purchase ? `Compra ${p.purchase.publicCode}` : "Manual"}</TableCell>
                  <TableCell className="text-right">{formatCentsBRL(p.totalAmountCents)}</TableCell>
                  <TableCell className="text-right">{formatCentsBRL(p.totalAmountCents - p.paidAmountCents)}</TableCell>
                  <TableCell className="text-xs">{p.dueAt ? new Date(p.dueAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <GenericStatusBadge label={VENUE_PAYABLE_STATUS_LABEL[p.status]} tone={statusTone(p.status)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PayableDetailSheet orgId={orgId} payable={detail} open={detail !== null} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}

function DueBucket({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${value > 0 ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
