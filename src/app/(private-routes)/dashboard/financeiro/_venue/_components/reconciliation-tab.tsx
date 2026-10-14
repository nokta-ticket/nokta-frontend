"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_PAYMENT_METHOD_LABEL, VENUE_RECONCILIATION_STATUS_LABEL, type VenuePaymentReconciliation, type VenueReconciliationStatus } from "@/services/venue-finance";
import { useSetVenueFinanceReconciliation, useVenueFinanceReconciliations } from "../_hooks/use-venue-finance-reconciliation";
import { METHOD_ICON, MethodChip, Money, RECONCILIATION_STATUS_TONE, centsToInput, formatDayLong, parseBRLToCents } from "./finance-shared";

function RecStatus({ status }: { status: VenueReconciliationStatus }) {
  return <StatusBadge tone={RECONCILIATION_STATUS_TONE[status]}>{VENUE_RECONCILIATION_STATUS_LABEL[status]}</StatusBadge>;
}

function Informed({ row }: { row: VenuePaymentReconciliation }) {
  if (row.actualNetCents === null) return <span className="text-money-pending">Não informado</span>;
  return <span className="font-semibold text-foreground">{formatBRLCents(row.actualNetCents)}</span>;
}

function Difference({ row }: { row: VenuePaymentReconciliation }) {
  if (row.differenceCents === null) return <span className="text-subtle-foreground">—</span>;
  if (row.differenceCents === 0) return <span className="text-muted-foreground">Bateu</span>;
  return <Money cents={row.differenceCents} signed strong />;
}

function ReconcileDialog({ orgId, locationId, row, open, onOpenChange }: { orgId: number; locationId: number; row: VenuePaymentReconciliation | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const set = useSetVenueFinanceReconciliation(orgId, locationId);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    setAmount(centsToInput(row.actualNetCents ?? row.expectedNetCents));
    setNotes(row.notes ?? "");
    setError(null);
  }, [open, row]);

  const cents = parseBRLToCents(amount);
  const diff = row && cents !== null ? cents - row.expectedNetCents : null;

  const handleSubmit = async () => {
    if (!row) return;
    if (cents === null) return setError("Informe um valor válido.");
    setError(null);
    try {
      await set.mutateAsync({ date: row.date, method: row.method, actualNetCents: cents, notes: notes.trim() || undefined });
      toast.success(diff === 0 ? "Conciliado — bateu." : "Valor informado salvo.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar a conciliação."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!set.isPending ? onOpenChange(v) : null)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Informar valor recebido</DialogTitle>
          <DialogDescription>{row ? `${formatDayLong(row.date)} · ${VENUE_PAYMENT_METHOD_LABEL[row.method]}` : ""}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {row ? (
            <DetailGrid columns={3} className="grid-cols-3 sm:grid-cols-3 lg:grid-cols-3">
              <DetailItem label="Bruto" value={formatBRLCents(row.expectedGrossCents)} />
              <DetailItem label="Taxa est." value={formatBRLCents(row.expectedFeeCents)} />
              <DetailItem label="Líquido esperado" value={formatBRLCents(row.expectedNetCents)} />
            </DetailGrid>
          ) : null}
          <form
            id="reconcile-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field
              label="Líquido que caiu na conta"
              htmlFor="reconcile-amount"
              required
              error={error}
              hint={
                diff === null ? "Confira no extrato da adquirente." : diff === 0 ? "Bate com o esperado." : (
                  <>
                    Diferença de <Money cents={diff} signed strong /> contra o esperado.
                  </>
                )
              }
            >
              <Input id="reconcile-amount" prefix="R$" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={Boolean(error) || undefined} autoFocus />
            </Field>
            <Field label="Observação" htmlFor="reconcile-notes" optional>
              <Textarea id="reconcile-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: chargeback de uma venda" className="min-h-20" />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={set.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="reconcile-form" loading={set.isPending} leftIcon="check">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Conciliação dia × método: líquido esperado contra o que a adquirente pagou. */
export function ReconciliationTab({ orgId, locationId, days, periodLabel }: { orgId: number; locationId: number; days: string[]; periodLabel: string }) {
  const [status, setStatus] = useState<VenueReconciliationStatus | "">("");
  const [editing, setEditing] = useState<VenuePaymentReconciliation | null>(null);
  const query = useVenueFinanceReconciliations(orgId, locationId, { startDate: days[0], endDate: days[days.length - 1], status: status || undefined });
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const summary = useMemo(() => {
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const divergent = rows.filter((r) => r.status === "DIVERGENT");
    return { pending, divergent: divergent.length, diff: divergent.reduce((s, r) => s + (r.differenceCents ?? 0), 0), expected: rows.reduce((s, r) => s + r.expectedNetCents, 0) };
  }, [rows]);

  const groups = useMemo(() => {
    const map = new Map<string, VenuePaymentReconciliation[]>();
    for (const r of rows) map.set(r.date, [...(map.get(r.date) ?? []), r]);
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  const editButton = (r: VenuePaymentReconciliation, labels = false) => (
    <Button variant="subtle" size={labels ? "sm" : "icon-sm"} aria-label="Informar valor recebido" title="Informar valor recebido" onClick={() => setEditing(r)} leftIcon={labels ? "edit" : undefined}>
      {labels ? (r.actualNetCents === null ? "Informar" : "Corrigir") : <Icon name="edit" size={14} />}
    </Button>
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar className="flex-nowrap justify-between">
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as VenueReconciliationStatus | "")} className="min-w-0 flex-1 sm:w-48 sm:flex-none">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="DIVERGENT">Divergentes</option>
          <option value="MATCHED">Conciliados</option>
        </NativeSelect>
        <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()} className="shrink-0">
          <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
        </Button>
      </DataTableToolbar>

      {!query.isLoading && !query.isError && rows.length > 0 ? (
        <DetailGrid columns={4} className="grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Líquido esperado" value={formatBRLCents(summary.expected)} />
          <DetailItem label="Pendentes">
            <span className={cn(summary.pending > 0 && "text-money-pending")}>{summary.pending}</span>
          </DetailItem>
          <DetailItem label="Divergentes">
            <span className={cn(summary.divergent > 0 && "text-danger")}>{summary.divergent}</span>
          </DetailItem>
          <DetailItem label="Diferença acumulada">
            <Money cents={summary.diff} signed tone={summary.diff === 0 ? "muted" : "auto"} />
          </DetailItem>
        </DetailGrid>
      ) : null}

      {query.isError ? (
        <ErrorState description="Não foi possível carregar a conciliação." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState icon="scale" title={status ? "Nada com esse status" : `Nada pra conciliar em ${periodLabel.toLowerCase()}`} description={status ? "Troque o filtro pra ver os outros dias." : "Cada dia com vendas gera uma linha por método pra você conferir contra a adquirente."} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Método</DataTableHeadCell>
                  <DataTableHeadCell align="right">Bruto</DataTableHeadCell>
                  <DataTableHeadCell align="right">Taxa est.</DataTableHeadCell>
                  <DataTableHeadCell align="right">Líquido esperado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Informado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Diferença</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={56}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {groups.map(([date, list]) => (
                  <GroupRows key={date} date={date} list={list} editButton={editButton} />
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <div className="space-y-5">
              {groups.map(([date, list]) => (
                <section key={date} className="space-y-2.5">
                  <h3 className="flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                    <Icon name="calendar" size={12} className="text-muted-foreground" />
                    {formatDayLong(date)}
                  </h3>
                  <MobileCardList>
                    {list.map((r, i) => (
                      <MobileCard
                        key={`${r.date}-${r.method}`}
                        index={i}
                        title={<MethodChip method={r.method} />}
                        subtitle={`Bruto ${formatBRLCents(r.expectedGrossCents)} · taxa ${formatBRLCents(r.expectedFeeCents)}`}
                        badge={<RecStatus status={r.status} />}
                        meta={[
                          { label: "Esperado", value: formatBRLCents(r.expectedNetCents), num: true },
                          { label: "Informado", value: <Informed row={r} />, num: true },
                          { label: "Diferença", value: <Difference row={r} />, num: true },
                        ]}
                        actions={editButton(r, true)}
                      />
                    ))}
                  </MobileCardList>
                </section>
              ))}
            </div>
          }
        />
      )}

      <ReconcileDialog orgId={orgId} locationId={locationId} row={editing} open={editing !== null} onOpenChange={(v) => !v && setEditing(null)} />
    </div>
  );
}

function GroupRows({ date, list, editButton }: { date: string; list: VenuePaymentReconciliation[]; editButton: (r: VenuePaymentReconciliation) => React.ReactNode }) {
  const dayNet = list.reduce((s, r) => s + r.expectedNetCents, 0);
  return (
    <>
      <tr>
        <td colSpan={8} className="border-b border-border/70 bg-surface-2/60 px-4 py-2 text-caption font-semibold text-foreground">
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Icon name="calendar" size={11} className="text-muted-foreground" />
              {formatDayLong(date)}
            </span>
            <span className="tnum font-medium text-muted-foreground">
              {list.length} {list.length === 1 ? "método" : "métodos"} · líquido esperado {formatBRLCents(dayNet)}
            </span>
          </span>
        </td>
      </tr>
      {list.map((r, i) => (
        <DataTableRow key={`${r.date}-${r.method}`} index={i}>
          <DataTableCell>
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Icon name={METHOD_ICON[r.method]} size={13} className="text-muted-foreground" fw />
              {VENUE_PAYMENT_METHOD_LABEL[r.method] ?? r.method}
            </span>
          </DataTableCell>
          <DataTableCell num className="text-muted-foreground">
            {formatBRLCents(r.expectedGrossCents)}
          </DataTableCell>
          <DataTableCell num className="text-muted-foreground">
            {formatBRLCents(r.expectedFeeCents)}
          </DataTableCell>
          <DataTableCell num>{formatBRLCents(r.expectedNetCents)}</DataTableCell>
          <DataTableCell num>
            <Informed row={r} />
          </DataTableCell>
          <DataTableCell num>
            <Difference row={r} />
          </DataTableCell>
          <DataTableCell>
            <RecStatus status={r.status} />
          </DataTableCell>
          <DataTableCell align="right" stopPropagation>
            {editButton(r)}
          </DataTableCell>
        </DataTableRow>
      ))}
    </>
  );
}
