"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { centsToBRL } from "@/services/venue-menu";
import type { VenueTableSession } from "@/services/venue-operation";
import { useVenueTableSessions } from "../_hooks/use-venue-areas-tables";
import { TabStatusBadge } from "./op-status-badge";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Histórico de atendimentos de UMA mesa física — a mesma mesa pode ter sido
 * usada várias vezes ao longo do dia (ou em dias diferentes), cada
 * atendimento com seu próprio consumo/pagamento. Clicar num item abre o
 * detalhe completo (TabDetailSheet) daquele atendimento específico — nunca
 * mistura os totais entre atendimentos diferentes.
 */
export function TableSessionsSheet({
  orgId,
  tableId,
  tableName,
  open,
  onOpenChange,
  onOpenSession,
}: {
  orgId: number;
  tableId: number;
  tableName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenSession: (tabId: number) => void;
}) {
  const { data: sessions, isLoading, isError, refetch } = useVenueTableSessions(orgId, tableId);

  // Agrupado por dia — "Hoje" primeiro, depois datas anteriores, mais fácil
  // de responder "o que aconteceu com a Mesa 24 hoje" sem ter que ler datas.
  const groups = groupByDay(sessions ?? []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Histórico — Mesa {tableName}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {isLoading ? <BlockSkeleton className="h-64" /> : null}
          {isError ? <ErrorState description="Não foi possível carregar o histórico." onRetry={() => refetch()} /> : null}
          {!isLoading && !isError && sessions && sessions.length === 0 ? (
            <p className="text-sm text-black/40">Nenhum atendimento registrado nesta mesa ainda.</p>
          ) : null}

          {groups.map(({ label, items }) => (
            <section key={label} className="space-y-2">
              <h4 className="text-sm font-semibold text-black/60">{label}</h4>
              <ul className="space-y-1.5">
                {items.map((session) => (
                  <li key={session.id}>
                    <button
                      onClick={() => onOpenSession(session.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white p-3 text-left hover:bg-black/[0.02]"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatTime(session.openedAt)}</p>
                        {session.customerName ? (
                          <p className="text-xs text-black/50">{session.customerName}</p>
                        ) : null}
                        {session.postCloseCanceledAt ? (
                          <p className="text-xs text-red-600">Venda cancelada</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{centsToBRL(session.totalCents)}</span>
                        <TabStatusBadge status={session.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function groupByDay(sessions: VenueTableSession[]): { label: string; items: VenueTableSession[] }[] {
  const todayLabel = formatDate(new Date().toISOString());
  const map = new Map<string, VenueTableSession[]>();
  for (const session of sessions) {
    const dateLabel = formatDate(session.openedAt);
    const label = dateLabel === todayLabel ? "Hoje" : dateLabel;
    const bucket = map.get(label) ?? [];
    bucket.push(session);
    map.set(label, bucket);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}
