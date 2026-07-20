"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { formatCentsBRL, VENUE_PAYABLE_STATUS_LABEL, type VenuePayable } from "@/services/venue-finance";
import { useVenueFinanceCategories } from "../_hooks/use-venue-finance-categories";
import { useVenueFinancePayables } from "../_hooks/use-venue-finance-payables";
import { useVenueFinanceOtherIncome, useVenueFinanceOtherIncomeMutations } from "../_hooks/use-venue-finance-other-income";
import { PayableFormDialog } from "./payable-form-dialog";
import { OtherIncomeFormDialog } from "./other-income-form-dialog";
import { PayableDetailSheet } from "./payable-detail-sheet";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";
import { CancelWithReasonDialog } from "../../../reservas/_components/cancel-with-reason-dialog";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";

function payableStatusTone(status: VenuePayable["status"]) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE" || status === "CANCELED") return "danger" as const;
  if (status === "PARTIALLY_PAID") return "warning" as const;
  return "neutral" as const;
}

export function DespesasTab({ orgId, locationId, locations }: { orgId: number; locationId: number; locations: VenueLocation[] }) {
  const { data: expenseCategories } = useVenueFinanceCategories(orgId, "EXPENSE");
  const { data: incomeCategories } = useVenueFinanceCategories(orgId, "OTHER_INCOME");
  const { data: recentPayables, isLoading: loadingPayables } = useVenueFinancePayables(orgId, { locationId, limit: 8 });
  const { data: recentIncome, isLoading: loadingIncome } = useVenueFinanceOtherIncome(orgId, { locationId, limit: 8 });
  const { cancel: cancelIncome } = useVenueFinanceOtherIncomeMutations(orgId);

  const [payableFormOpen, setPayableFormOpen] = useState(false);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [detailPayable, setDetailPayable] = useState<VenuePayable | null>(null);
  const [cancelIncomeId, setCancelIncomeId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPayableFormOpen(true)}>
          <Plus size={16} /> Nova despesa
        </Button>
        <Button variant="outline" onClick={() => setIncomeFormOpen(true)}>
          <Plus size={16} /> Nova receita
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Despesas recentes</h3>
          {loadingPayables ? (
            <TableSkeleton rows={4} />
          ) : (recentPayables?.data.length ?? 0) === 0 ? (
            <EmptyState title="Nenhuma despesa ainda" description="Registre a primeira despesa desta unidade." />
          ) : (
            <ul className="divide-y divide-black/5">
              {recentPayables!.data.map((p) => (
                <li key={p.id} className="flex cursor-pointer items-center justify-between py-2 text-sm" onClick={() => setDetailPayable(p)}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.description}</p>
                    <p className="text-xs text-black/50">{p.publicCode} · {p.category.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatCentsBRL(p.totalAmountCents)}</span>
                    <GenericStatusBadge label={VENUE_PAYABLE_STATUS_LABEL[p.status]} tone={payableStatusTone(p.status)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Outras receitas recentes</h3>
          {loadingIncome ? (
            <TableSkeleton rows={4} />
          ) : (recentIncome?.data.length ?? 0) === 0 ? (
            <EmptyState title="Nenhuma outra receita ainda" description="Registre entradas que não vêm de pedidos (aluguel de espaço, couvert, etc.)." />
          ) : (
            <ul className="divide-y divide-black/5">
              {recentIncome!.data.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${i.canceledAt ? "text-black/40 line-through" : ""}`}>{i.description}</p>
                    <p className="text-xs text-black/50">{i.category.nome} · {new Date(i.receivedAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatCentsBRL(i.amountCents)}</span>
                    {!i.canceledAt ? (
                      <Button size="sm" variant="ghost" onClick={() => setCancelIncomeId(i.id)}>Cancelar</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PayableFormDialog orgId={orgId} locations={locations} categories={expenseCategories ?? []} open={payableFormOpen} onOpenChange={setPayableFormOpen} />
      <OtherIncomeFormDialog orgId={orgId} locations={locations} categories={incomeCategories ?? []} open={incomeFormOpen} onOpenChange={setIncomeFormOpen} />
      <PayableDetailSheet orgId={orgId} payable={detailPayable} open={detailPayable !== null} onOpenChange={(v) => !v && setDetailPayable(null)} />

      <CancelWithReasonDialog
        open={cancelIncomeId !== null}
        onOpenChange={(v) => !v && setCancelIncomeId(null)}
        title="Cancelar receita — se foi em dinheiro, um movimento inverso será criado no caixa"
        loading={cancelIncome.isPending}
        onConfirm={(reason) =>
          cancelIncomeId &&
          cancelIncome.mutate(
            { incomeId: cancelIncomeId, reason },
            {
              onSuccess: () => { toast.success("Receita cancelada."); setCancelIncomeId(null); },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
            },
          )
        }
      />
    </div>
  );
}
