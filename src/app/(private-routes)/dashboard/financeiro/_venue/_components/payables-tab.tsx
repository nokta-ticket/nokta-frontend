"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_PAYABLE_STATUS_LABEL, type VenuePayable, type VenuePayableStatus } from "@/services/venue-finance";
import { useVenueStockSuppliers } from "../../../estoque/_hooks/use-venue-stock-catalog";
import { useVenueFinanceCategories } from "../_hooks/use-venue-finance-categories";
import { useVenueFinancePayableMutations, useVenueFinancePayables } from "../_hooks/use-venue-finance-payables";
import { PAYABLE_STATUS_TONE, formatFullDateSP, todayInSaoPaulo } from "./finance-shared";
import { PayableFormDialog } from "./payable-form-dialog";
import { PayablePaymentDialog } from "./payable-payment-dialog";

const LIMIT = 20;
const STATUSES: VenuePayableStatus[] = ["PENDING", "PARTIALLY_PAID", "OVERDUE", "PAID", "CANCELED"];
const SHORT_STATUS: Record<VenuePayableStatus, string> = { PENDING: "Pendente", PARTIALLY_PAID: "Parcial", PAID: "Paga", OVERDUE: "Vencida", CANCELED: "Cancelada" };

const canPay = (p: VenuePayable) => p.status === "PENDING" || p.status === "PARTIALLY_PAID" || p.status === "OVERDUE";
const canCancel = (p: VenuePayable) => p.status !== "PAID" && p.status !== "CANCELED";

function DueDate({ payable }: { payable: VenuePayable }) {
  if (!payable.dueAt) return <span className="text-subtle-foreground">Sem vencimento</span>;
  const overdue = payable.status === "OVERDUE" || (canPay(payable) && payable.dueAt.slice(0, 10) < todayInSaoPaulo());
  return <span className={cn("tnum", overdue ? "font-semibold text-danger" : "text-foreground")}>{formatFullDateSP(payable.dueAt)}</span>;
}

/** Contas a pagar: lista com status, nova conta, pagamento e cancelamento. */
export function PayablesTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VenuePayableStatus | "">("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [paying, setPaying] = useState<VenuePayable | null>(null);
  const [canceling, setCanceling] = useState<VenuePayable | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const debounced = useDebouncedValue(search.trim());

  const query = useVenueFinancePayables(orgId, { locationId, status: status || undefined, search: debounced || undefined, page, limit: LIMIT });
  const categories = useVenueFinanceCategories(orgId, "EXPENSE");
  const suppliers = useVenueStockSuppliers(orgId);
  const { cancel } = useVenueFinancePayableMutations(orgId);

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / LIMIT));
  const filtered = Boolean(debounced || status);

  const handleCancel = async () => {
    if (!canceling) return;
    try {
      await cancel.mutateAsync({ payableId: canceling.id, reason: cancelReason.trim() || undefined });
      toast.success("Conta cancelada.");
      setCancelReason("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar a conta."));
      throw err;
    }
  };

  const actions = (p: VenuePayable, labels = false) => (
    <>
      <Button variant="subtle" size={labels ? "sm" : "icon-sm"} aria-label="Registrar pagamento" title={canPay(p) ? "Registrar pagamento" : "Essa conta não aceita pagamento"} disabled={!canPay(p)} className={cn(!canPay(p) && "opacity-40")} onClick={() => setPaying(p)} leftIcon={labels ? "hand-dollar" : undefined}>
        {labels ? "Pagar" : <Icon name="hand-dollar" size={14} />}
      </Button>
      <Button variant="subtle" size={labels ? "sm" : "icon-sm"} aria-label="Cancelar conta" title={canCancel(p) ? "Cancelar conta" : p.status === "PAID" ? "Conta paga não pode ser cancelada" : "Conta já cancelada"} disabled={!canCancel(p)} className={cn("hover:bg-danger-bg hover:text-danger", !canCancel(p) && "opacity-40")} onClick={() => setCanceling(p)} leftIcon={labels ? "ban" : undefined}>
        {labels ? "Cancelar" : <Icon name="ban" size={14} />}
      </Button>
    </>
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <div className="flex w-full flex-1 items-center gap-2 sm:max-w-xl">
          <SearchInput value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Descrição, código, fornecedor ou documento" className="min-w-0 flex-1" />
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()} className="shrink-0 sm:hidden">
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <NativeSelect aria-label="Status" value={status} onChange={(e) => (setStatus(e.target.value as VenuePayableStatus | ""), setPage(1))} className="min-w-0 flex-1 sm:w-44 sm:flex-none">
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {VENUE_PAYABLE_STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()} className="hidden shrink-0 sm:inline-flex">
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
          <Button leftIcon="plus" onClick={() => setFormOpen(true)} className="shrink-0">
            Nova conta
          </Button>
        </div>
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState description="Não foi possível carregar as contas." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="invoice"
          title={filtered ? "Nenhuma conta com esses filtros" : "Nenhuma conta a pagar"}
          description={filtered ? "Tente outro status ou limpe a busca." : "Lance fornecedores, aluguel e equipe pra enxergar o resultado de verdade."}
          action={
            filtered ? (
              <Button variant="outline" size="sm" onClick={() => (setSearch(""), setStatus(""), setPage(1))}>
                Limpar filtros
              </Button>
            ) : (
              <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
                Nova conta
              </Button>
            )
          }
        />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Vencimento</DataTableHeadCell>
                  <DataTableHeadCell>Conta</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Total</DataTableHeadCell>
                  <DataTableHeadCell align="right">Pago</DataTableHeadCell>
                  <DataTableHeadCell align="right">Saldo</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={96}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((p, i) => {
                  const remaining = p.status === "CANCELED" ? 0 : p.totalAmountCents - p.paidAmountCents;
                  return (
                    <DataTableRow key={p.id} index={i}>
                      <DataTableCell className="whitespace-nowrap">
                        <DueDate payable={p} />
                      </DataTableCell>
                      <DataTableCell>
                        <span className={cn("block font-medium text-foreground", p.status === "CANCELED" && "text-muted-foreground line-through")}>{p.description}</span>
                        <span className="block text-caption text-muted-foreground">
                          {p.publicCode} · {p.category.nome}
                          {p.supplier ? ` · ${p.supplier.nome}` : ""}
                          {p.documentNumber ? ` · ${p.documentNumber}` : ""}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={PAYABLE_STATUS_TONE[p.status]}>{SHORT_STATUS[p.status]}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell num>{formatBRLCents(p.totalAmountCents)}</DataTableCell>
                      <DataTableCell num className={cn(p.paidAmountCents > 0 ? "text-money-in" : "text-muted-foreground")}>
                        {formatBRLCents(p.paidAmountCents)}
                      </DataTableCell>
                      <DataTableCell num className={cn("font-semibold", remaining > 0 ? (p.status === "OVERDUE" ? "text-money-out" : "text-money-pending") : "font-normal text-muted-foreground")}>
                        {formatBRLCents(remaining)}
                      </DataTableCell>
                      <DataTableCell align="right" stopPropagation>
                        <span className="inline-flex items-center justify-end gap-0.5">{actions(p)}</span>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((p, i) => {
                const remaining = p.status === "CANCELED" ? 0 : p.totalAmountCents - p.paidAmountCents;
                return (
                  <MobileCard
                    key={p.id}
                    index={i}
                    title={p.description}
                    subtitle={`${p.publicCode} · ${p.category.nome}${p.supplier ? ` · ${p.supplier.nome}` : ""}`}
                    badge={<StatusBadge tone={PAYABLE_STATUS_TONE[p.status]}>{SHORT_STATUS[p.status]}</StatusBadge>}
                    meta={[
                      { label: "Vencimento", value: <DueDate payable={p} /> },
                      { label: "Saldo", value: <span className={cn("font-semibold", remaining > 0 ? (p.status === "OVERDUE" ? "text-money-out" : "text-money-pending") : "font-normal text-muted-foreground")}>{formatBRLCents(remaining)}</span>, num: true },
                      { label: "Total", value: formatBRLCents(p.totalAmountCents), num: true },
                      { label: "Pago", value: formatBRLCents(p.paidAmountCents), num: true },
                    ]}
                    actions={canPay(p) || canCancel(p) ? actions(p, true) : undefined}
                  />
                );
              })}
            </MobileCardList>
          }
          footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={LIMIT} noun="contas" onPageChange={setPage} />}
        />
      )}

      <PayableFormDialog orgId={orgId} locationId={locationId} categories={categories.data ?? []} suppliers={suppliers.data ?? []} open={formOpen} onOpenChange={setFormOpen} />
      <PayablePaymentDialog orgId={orgId} payable={paying} open={paying !== null} onOpenChange={(v) => !v && setPaying(null)} />
      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => {
          if (!v) {
            setCanceling(null);
            setCancelReason("");
          }
        }}
        danger
        icon="ban"
        title="Cancelar essa conta?"
        description={canceling ? `${canceling.publicCode} · ${canceling.description}. Ela sai do resultado e não aceita mais pagamentos.` : undefined}
        confirmLabel="Cancelar conta"
        cancelLabel="Voltar"
        onConfirm={handleCancel}
      >
        <Field label="Motivo" htmlFor="payable-cancel-reason" optional>
          <Textarea id="payable-cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex.: lançado em duplicidade" className="min-h-20" />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
