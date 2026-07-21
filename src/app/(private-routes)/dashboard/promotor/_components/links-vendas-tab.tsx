"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { COMMISSION_STATUS_LABEL, formatCents } from "@/services/promoters";
import { useMyPromoterEvents, useMyPromoterSales } from "../_hooks/use-my-promoter";
import { toast } from "@/lib/toast";

function publicEventUrl(publicToken: string, eventId: number) {
  return `https://www.noktatickets.com.br/eventos/${eventId}?ref=${publicToken}`;
}

export function LinksVendasTab() {
  const { data: events, isLoading: loadingEvents } = useMyPromoterEvents(true);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: sales, isLoading: loadingSales } = useMyPromoterSales(true, eventId);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Seus links e códigos ativos</h3>
        {loadingEvents ? (
          <TableSkeleton rows={3} />
        ) : !events || events.length === 0 ? (
          <EmptyState title="Nenhum evento ativo" description="Quando uma organização te vincular a um evento, o link/código aparece aqui." />
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3 ${eventId === ev.eventId ? "ring-2 ring-violet-500" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setEventId(ev.eventId === eventId ? undefined : ev.eventId)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{ev.event.nome}</p>
                  <p className="truncate text-xs text-black/50">
                    {ev.discountEnabled ? "Com desconto para quem compra" : "Sem desconto"} · {ev.commissionEnabled ? "gera comissão" : "sem comissão"}
                  </p>
                </div>
                {ev.linkEnabled && ev.publicToken ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); copy(publicEventUrl(ev.publicToken as string, ev.eventId)); }}
                  >
                    <Copy size={14} /> Copiar link
                  </Button>
                ) : null}
                {ev.codeEnabled && ev.code ? (
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copy(ev.code as string); }}>
                    <Copy size={14} /> Código: {ev.code}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {eventId ? "Vendas atribuídas a você neste evento" : "Todas as vendas atribuídas a você"}
        </h3>
        {loadingSales ? (
          <TableSkeleton />
        ) : !sales || sales.length === 0 ? (
          <EmptyState title="Nenhuma venda ainda" description="Vendas feitas pelo seu link ou código aparecem aqui — nunca com dados pessoais de quem comprou." />
        ) : (
          <div className="rounded-xl border border-black/10 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Valor líquido</TableHead>
                  <TableHead>Sua comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.attributionId}>
                    <TableCell>{s.eventName}</TableCell>
                    <TableCell>{s.source === "LINK" ? "Link" : "Código"}</TableCell>
                    <TableCell>{formatCents(s.netNominalCentsAfterDiscount)}</TableCell>
                    <TableCell>{formatCents(s.commissionCents)}</TableCell>
                    <TableCell>{s.commissionStatus ? COMMISSION_STATUS_LABEL[s.commissionStatus] : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
