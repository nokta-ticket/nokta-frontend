"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useVenueFinanceCashSessions } from "../_hooks/use-venue-finance-cash-reports";
import { CashSessionReportSheet } from "./cash-session-report-sheet";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";

interface CashSessionRow {
  id: number;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  differenceCents: number | null;
  cashRegister: { id: number; nome: string };
}

export function CaixaTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const [onlyDivergent, setOnlyDivergent] = useState(false);
  const { data, isLoading } = useVenueFinanceCashSessions(orgId, locationId, { onlyDivergent });
  const [detailId, setDetailId] = useState<number | null>(null);

  const list = (data ?? []) as CashSessionRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch checked={onlyDivergent} onCheckedChange={setOnlyDivergent} />
        <Label>Só com divergência</Label>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhum fechamento encontrado" description="O histórico de sessões de caixa da Operação aparece aqui." />
      ) : (
        <div className="space-y-2">
          {list.map((session) => (
            <button
              key={session.id}
              className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white p-3 text-left"
              onClick={() => setDetailId(session.id)}
            >
              <div>
                <p className="text-sm font-medium">{session.cashRegister.nome}</p>
                <p className="text-xs text-black/50">{new Date(session.openedAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                {session.differenceCents !== null && session.differenceCents !== 0 ? (
                  <GenericStatusBadge label="Divergente" tone="danger" />
                ) : null}
                <GenericStatusBadge label={session.status === "OPEN" ? "Aberto" : "Fechado"} tone={session.status === "OPEN" ? "warning" : "neutral"} />
              </div>
            </button>
          ))}
        </div>
      )}

      <CashSessionReportSheet orgId={orgId} sessionId={detailId} open={detailId !== null} onOpenChange={(v) => !v && setDetailId(null)} />
    </div>
  );
}
