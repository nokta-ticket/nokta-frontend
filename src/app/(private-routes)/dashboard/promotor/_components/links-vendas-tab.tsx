"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatEventDate } from "@/lib/format";
import { COMMISSION_STATUS_LABEL, formatCents } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { COMMISSION_TONE, fmtDate, publicEventUrl } from "../../promotores/_components/promoter-meta";
import { useMyPromoterEvents, useMyPromoterSales } from "../_hooks/use-my-promoter";

export function LinksVendasTab() {
  const { data: events, isLoading: loadingEvents } = useMyPromoterEvents(true);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: sales, isLoading: loadingSales } = useMyPromoterSales(true, eventId);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Seus links e códigos ativos</h3>
        {loadingEvents ? (
          <RowsSkeleton rows={2} />
        ) : !events || events.length === 0 ? (
          <EmptyState icon="link" title="Nenhum evento ativo" description="Quando uma organização te vincular a um evento, o link e o código aparecem aqui." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((ev, i) => {
              const selected = eventId === ev.eventId;
              return (
                <article key={ev.id} className={cn("fade-up card-hover flex flex-col gap-3 rounded-card border bg-surface p-4 shadow-card transition-colors", selected ? "border-brand ring-2 ring-brand-ring" : "border-border")} style={{ ["--i" as string]: i } as never}>
                  <button type="button" onClick={() => setEventId(selected ? undefined : ev.eventId)} className="flex items-start justify-between gap-2 text-left">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{ev.event.nome}</span>
                      <span className="block text-caption text-muted-foreground">
                        {formatEventDate(ev.event.data)} · {ev.discountEnabled ? "com desconto" : "sem desconto"} · {ev.commissionEnabled ? "gera comissão" : "sem comissão"}
                      </span>
                    </span>
                    <Icon name={selected ? "check-circle" : "circle-outline"} size={14} className={cn("mt-0.5 shrink-0", selected ? "text-brand" : "text-subtle-foreground")} />
                  </button>
                  {ev.linkEnabled && ev.publicToken ? <CopyField value={publicEventUrl(ev.publicToken, ev.event.slug ?? ev.eventId)} size="sm" label="Copiar link" /> : null}
                  {ev.codeEnabled && ev.code ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-pill bg-brand-soft px-2.5 py-1 font-mono text-caption font-semibold tracking-wide text-brand">{ev.code}</span>
                      <Button variant="subtle" size="sm" leftIcon="copy" onClick={() => void copy(ev.code as string)}>
                        Copiar código
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{eventId ? "Vendas atribuídas a você neste evento" : "Todas as vendas atribuídas a você"}</h3>
        {loadingSales ? (
          <Skeleton className="h-56 rounded-card" />
        ) : !sales || sales.length === 0 ? (
          <EmptyState icon="cart" title="Nenhuma venda ainda" description="Vendas feitas pelo seu link ou código aparecem aqui — nunca com dados pessoais de quem comprou." />
        ) : (
          <DataTableShell
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Data</DataTableHeadCell>
                    <DataTableHeadCell>Evento</DataTableHeadCell>
                    <DataTableHeadCell>Canal</DataTableHeadCell>
                    <DataTableHeadCell align="right">Valor líquido</DataTableHeadCell>
                    <DataTableHeadCell align="right">Sua comissão</DataTableHeadCell>
                    <DataTableHeadCell>Status</DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {sales.map((s, i) => (
                    <DataTableRow key={s.attributionId} index={i}>
                      <DataTableCell className="tnum">{fmtDate(s.attributedAt)}</DataTableCell>
                      <DataTableCell className="font-medium">{s.eventName}</DataTableCell>
                      <DataTableCell>{s.source === "LINK" ? "Link" : "Código"}</DataTableCell>
                      <DataTableCell num>{formatCents(s.netNominalCentsAfterDiscount)}</DataTableCell>
                      <DataTableCell num className="font-semibold text-money-in">
                        {formatCents(s.commissionCents)}
                      </DataTableCell>
                      <DataTableCell>{s.commissionStatus ? <StatusBadge tone={COMMISSION_TONE[s.commissionStatus]}>{COMMISSION_STATUS_LABEL[s.commissionStatus]}</StatusBadge> : <span className="text-subtle-foreground">—</span>}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {sales.map((s, i) => (
                  <MobileCard key={s.attributionId} index={i} title={s.eventName} subtitle={`${s.source === "LINK" ? "Link" : "Código"} · ${fmtDate(s.attributedAt)}`} badge={s.commissionStatus ? <StatusBadge tone={COMMISSION_TONE[s.commissionStatus]}>{COMMISSION_STATUS_LABEL[s.commissionStatus]}</StatusBadge> : undefined} meta={[{ label: "Valor líquido", value: formatCents(s.netNominalCentsAfterDiscount), num: true }, { label: "Sua comissão", value: <span className="font-semibold text-money-in">{formatCents(s.commissionCents)}</span>, num: true }]} />
                ))}
              </MobileCardList>
            }
          />
        )}
      </section>
    </div>
  );
}
