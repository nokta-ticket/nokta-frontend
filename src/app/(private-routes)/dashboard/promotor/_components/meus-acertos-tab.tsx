"use client";

import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { SETTLEMENT_STATUS_LABEL, formatCents, type SettlementStatus } from "@/services/promoters";
import { useMyPromoterSettlements } from "../_hooks/use-my-promoter";

function statusTone(status: SettlementStatus) {
  if (status === "PAID_MANUALLY") return "success" as const;
  if (status === "CONFIRMED") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "neutral" as const;
}

export function MeusAcertosTab() {
  const { data: settlements, isLoading } = useMyPromoterSettlements(true);

  if (isLoading) return <TableSkeleton />;
  if (!settlements || settlements.length === 0) {
    return (
      <EmptyState
        title="Nenhum acerto ainda"
        description="Quando uma organização criar um acerto com sua comissão disponível, ele aparece aqui — você nunca cria, confirma ou marca um acerto como pago."
      />
    );
  }

  return (
    <div className="space-y-2">
      {settlements.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{formatCents(s.totalCommissionCents)}</p>
            <p className="text-xs text-black/50">
              {s.periodStart.slice(0, 10)} — {s.periodEnd.slice(0, 10)}
            </p>
          </div>
          <GenericStatusBadge label={SETTLEMENT_STATUS_LABEL[s.status]} tone={statusTone(s.status)} />
        </div>
      ))}
    </div>
  );
}
