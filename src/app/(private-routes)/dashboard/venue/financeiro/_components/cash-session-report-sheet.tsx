"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCentsBRL } from "@/services/venue-finance";
import { useVenueFinanceCashSessionReport } from "../_hooks/use-venue-finance-cash-reports";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";

export function CashSessionReportSheet({ orgId, sessionId, open, onOpenChange }: { orgId: number; sessionId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: report, isLoading } = useVenueFinanceCashSessionReport(orgId, sessionId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Fechamento — {report?.cashRegister.nome ?? ""}</SheetTitle>
        </SheetHeader>
        {isLoading || !report ? (
          <div className="px-4"><BlockSkeleton className="h-96" /></div>
        ) : (
          <div className="space-y-4 px-4 pb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/60">Unidade</span>
              <span>{report.location.nome}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/60">Status</span>
              <GenericStatusBadge label={report.status === "OPEN" ? "Aberto" : "Fechado"} tone={report.status === "OPEN" ? "warning" : "neutral"} />
            </div>
            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <Row label="Abertura" value={new Date(report.openedAt).toLocaleString("pt-BR")} />
              <Row label="Fechamento" value={report.closedAt ? new Date(report.closedAt).toLocaleString("pt-BR") : "—"} />
              <Row label="Valor inicial" value={formatCentsBRL(report.openingAmountCents)} />
              <Row label="Vendas em dinheiro" value={formatCentsBRL(report.cashSalesCents)} />
              <Row label="Outras entradas" value={formatCentsBRL(report.otherIncomeCents)} />
              <Row label="Suprimentos" value={formatCentsBRL(report.supplyCents)} />
              <Row label="Retiradas" value={formatCentsBRL(report.withdrawalCents)} />
              <Row label="Despesas" value={formatCentsBRL(report.expenseCents)} />
              <Row label="Ajustes" value={formatCentsBRL(report.adjustmentsCents)} />
              <Row label="Esperado" value={formatCentsBRL(report.expectedCashCents)} strong />
              <Row label="Contado" value={report.countedCashCents !== null ? formatCentsBRL(report.countedCashCents) : "—"} strong />
              <Row
                label="Diferença"
                value={report.differenceCents !== null ? formatCentsBRL(report.differenceCents) : "—"}
                strong
                danger={!!report.differenceCents && report.differenceCents !== 0}
              />
            </div>
            {report.notes ? <p className="text-sm text-black/60">Observações: {report.notes}</p> : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${strong ? "font-medium" : ""} ${danger ? "text-red-600" : ""}`}>
      <span className="text-black/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
