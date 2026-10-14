"use client";

import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatBRLCents } from "@/lib/format";
import type { VenueTableSession } from "@/services/venue-operation";
import { useVenueTableSessions } from "../_hooks/use-venue-areas-tables";
import { formatClock, formatDay } from "../_lib/time";
import { TabStatusBadge } from "./op-status-badge";

/**
 * Histórico de atendimentos de UMA mesa física — a mesma mesa pode ter sido
 * usada várias vezes no dia; cada atendimento tem seu próprio consumo e
 * pagamento. Tocar abre o detalhe completo daquele atendimento.
 */
export function TableSessionsSheet({ orgId, tableId, tableName, open, onOpenChange, onOpenSession }: { orgId: number; tableId: number; tableName: string; open: boolean; onOpenChange: (v: boolean) => void; onOpenSession: (tabId: number) => void }) {
  const isMobile = useIsMobile();
  const { data: sessions, isLoading, isError, refetch } = useVenueTableSessions(orgId, tableId);
  const groups = groupByDay(sessions ?? []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"}>
        <SheetHeader>
          <SheetTitle>Histórico — {tableName}</SheetTitle>
          <SheetDescription>Todos os atendimentos desta mesa, do mais recente ao mais antigo.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {isLoading ? <RowsSkeleton rows={4} /> : null}
          {isError ? <ErrorState title="Não deu pra carregar o histórico" onRetry={() => refetch()} /> : null}
          {!isLoading && !isError && sessions && sessions.length === 0 ? <EmptyState compact icon="history" title="Nenhum atendimento ainda" description="Quando esta mesa for aberta, o atendimento aparece aqui." /> : null}
          {groups.map(({ label, items }) => (
            <section key={label} className="space-y-2">
              <h4 className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{label}</h4>
              <ul className="space-y-2">
                {items.map((session, i) => (
                  <li key={session.id} className="row-in" style={{ ["--i" as string]: i } as never}>
                    <button type="button" onClick={() => onOpenSession(session.id)} className="press flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 text-left shadow-card transition-colors hover:bg-surface-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground tnum">
                          {formatClock(session.openedAt)}
                          {session.closedAt ? ` – ${formatClock(session.closedAt)}` : ""}
                        </p>
                        <p className="truncate text-caption text-muted-foreground">
                          {session.publicCode}
                          {session.customerName ? ` · ${session.customerName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold text-foreground tnum">{formatBRLCents(session.totalCents)}</span>
                        {session.postCloseCanceledAt ? <StatusBadge tone="danger">Venda cancelada</StatusBadge> : <TabStatusBadge status={session.status} />}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function groupByDay(sessions: VenueTableSession[]): { label: string; items: VenueTableSession[] }[] {
  const todayLabel = formatDay(new Date().toISOString());
  const map = new Map<string, VenueTableSession[]>();
  for (const session of sessions) {
    const dateLabel = formatDay(session.openedAt);
    const label = dateLabel === todayLabel ? "Hoje" : dateLabel;
    const bucket = map.get(label) ?? [];
    bucket.push(session);
    map.set(label, bucket);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}
