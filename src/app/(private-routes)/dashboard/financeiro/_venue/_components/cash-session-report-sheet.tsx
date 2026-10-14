"use client";

import { StatusBadge } from "@/components/ui/badge";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { ErrorState } from "@/components/ui/empty-state";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { formatBRLCents } from "@/lib/format";
import { useVenueFinanceCashSessionReport } from "../_hooks/use-venue-finance-cash-reports";
import { CashDifference, Money, SummaryRow, formatDateTimeSP } from "./finance-shared";

/**
 * Relatório de um fechamento de caixa: linha do tempo abertura → fechamento
 * → conferência, movimento da gaveta e o contado contra o esperado.
 */
export function CashSessionReportSheet({ orgId, sessionId, open, onOpenChange }: { orgId: number; sessionId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: report, isLoading, isError, refetch } = useVenueFinanceCashSessionReport(orgId, sessionId);
  const isOpen = report?.status === "OPEN";

  const steps: StepperStep[] = report
    ? [
        { label: "Abertura", description: `Valor inicial ${formatBRLCents(report.openingAmountCents)}`, timestamp: formatDateTimeSP(report.openedAt), status: "done" },
        isOpen
          ? { label: "Caixa aberto", description: "Em operação agora", status: "current" }
          : { label: "Fechamento", description: `Esperado ${formatBRLCents(report.expectedCashCents)}`, timestamp: report.closedAt ? formatDateTimeSP(report.closedAt) : undefined, status: "done" },
        report.countedCashCents === null
          ? { label: "Conferência", description: "Acontece no fechamento", status: "upcoming" }
          : { label: "Conferência", description: <CashDifference cents={report.differenceCents} />, status: report.differenceCents ? "failed" : "done" },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2.5">
            <SheetTitle>{report ? report.cashRegister.nome : "Fechamento de caixa"}</SheetTitle>
            {report ? (
              <StatusBadge tone={isOpen ? "warning" : "neutral"} pulse={isOpen}>
                {isOpen ? "Aberto" : "Fechado"}
              </StatusBadge>
            ) : null}
          </div>
          <SheetDescription>{report ? report.location.nome : "Carregando o relatório…"}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {isError ? (
            <ErrorState description="Não foi possível carregar o fechamento." onRetry={() => refetch()} />
          ) : isLoading || !report ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <Stepper steps={steps} />

              <SheetSection title="Movimento da gaveta">
                <SummaryRow label="Valor inicial">{formatBRLCents(report.openingAmountCents)}</SummaryRow>
                <SummaryRow label="Vendas em dinheiro">
                  <Money cents={report.cashSalesCents} tone="in" signed />
                </SummaryRow>
                <SummaryRow label="Outras entradas">
                  <Money cents={report.otherIncomeCents} tone={report.otherIncomeCents ? "in" : "muted"} signed />
                </SummaryRow>
                <SummaryRow label="Suprimentos">
                  <Money cents={report.supplyCents} tone={report.supplyCents ? "in" : "muted"} signed />
                </SummaryRow>
                <SummaryRow label="Retiradas">
                  <Money cents={-report.withdrawalCents} tone={report.withdrawalCents ? "out" : "muted"} />
                </SummaryRow>
                <SummaryRow label="Despesas pagas no caixa">
                  <Money cents={-report.expenseCents} tone={report.expenseCents ? "out" : "muted"} />
                </SummaryRow>
                <SummaryRow label="Ajustes">
                  <Money cents={report.adjustmentsCents} tone={report.adjustmentsCents ? "auto" : "muted"} signed />
                </SummaryRow>
                <SummaryRow label="Esperado na gaveta" strong>
                  {formatBRLCents(report.expectedCashCents)}
                </SummaryRow>
              </SheetSection>

              <DetailGrid columns={3} className="grid-cols-3 sm:grid-cols-3 lg:grid-cols-3">
                <DetailItem label="Esperado" value={formatBRLCents(report.expectedCashCents)} />
                <DetailItem label="Contado" value={report.countedCashCents === null ? null : formatBRLCents(report.countedCashCents)} />
                <DetailItem label="Diferença">
                  <CashDifference cents={report.differenceCents} open={isOpen} />
                </DetailItem>
              </DetailGrid>

              {report.notes ? (
                <SheetSection title="Observações">
                  <p className="text-sm text-foreground">{report.notes}</p>
                </SheetSection>
              ) : null}
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
