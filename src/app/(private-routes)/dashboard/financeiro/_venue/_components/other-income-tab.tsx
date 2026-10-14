"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_FINANCIAL_PAYMENT_METHOD_LABEL, type VenueFinancialCategory, type VenueFinancialPaymentMethod, type VenueOtherIncome } from "@/services/venue-finance";
import { useVenueFinanceCategories } from "../_hooks/use-venue-finance-categories";
import { useVenueFinanceOtherIncome, useVenueFinanceOtherIncomeMutations } from "../_hooks/use-venue-finance-other-income";
import { FIN_PAYMENT_METHODS, FinMethodChip, Money, dateInputToIso, formatFullDateSP, idempotencyKey, parseBRLToCents, todayInSaoPaulo } from "./finance-shared";

const LIMIT = 20;

type Errors = Partial<Record<"description" | "categoryId" | "amount" | "receivedAt", string>>;

function OtherIncomeDialog({ orgId, locationId, categories, open, onOpenChange }: { orgId: number; locationId: number; categories: VenueFinancialCategory[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useVenueFinanceOtherIncomeMutations(orgId);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayInSaoPaulo());
  const [method, setMethod] = useState<VenueFinancialPaymentMethod>("PIX");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setAmount("");
    setReceivedAt(todayInSaoPaulo());
    setMethod("PIX");
    setNotes("");
    setErrors({});
  }, [open, categories]);

  const handleSubmit = async () => {
    const next: Errors = {};
    const cents = parseBRLToCents(amount);
    if (!description.trim()) next.description = "Diga de onde veio essa receita.";
    if (!categoryId) next.categoryId = "Escolha uma categoria.";
    if (cents === null || cents <= 0) next.amount = "Informe um valor maior que zero.";
    if (!receivedAt) next.receivedAt = "Informe quando recebeu.";
    setErrors(next);
    if (Object.keys(next).length > 0 || cents === null) return;
    try {
      await create.mutateAsync({
        locationId,
        categoryId: Number(categoryId),
        description: description.trim(),
        amountCents: cents,
        receivedAt: receivedAt === todayInSaoPaulo() ? new Date().toISOString() : dateInputToIso(receivedAt),
        method,
        idempotencyKey: idempotencyKey(),
        notes: notes.trim() || undefined,
      });
      toast.success("Receita registrada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível registrar a receita."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!create.isPending ? onOpenChange(v) : null)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nova receita</DialogTitle>
          <DialogDescription>Couvert, aluguel do espaço, patrocínio — o que entra fora das comandas.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="other-income-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field label="Descrição" htmlFor="income-description" required error={errors.description}>
              <Input id="income-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Couvert — show de sábado" aria-invalid={Boolean(errors.description) || undefined} autoFocus />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Categoria" htmlFor="income-category" required error={errors.categoryId}>
                <NativeSelect id="income-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={Boolean(errors.categoryId) || undefined}>
                  {categories.length === 0 ? <option value="">Nenhuma categoria de receita</option> : null}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Método" htmlFor="income-method" required>
                <NativeSelect id="income-method" value={method} onChange={(e) => setMethod(e.target.value as VenueFinancialPaymentMethod)}>
                  {FIN_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[m]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            <FieldGroup columns={2}>
              <Field label="Valor" htmlFor="income-amount" required error={errors.amount}>
                <Input id="income-amount" prefix="R$" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={Boolean(errors.amount) || undefined} />
              </Field>
              <Field label="Recebido em" htmlFor="income-date" required error={errors.receivedAt}>
                <Input id="income-date" type="date" value={receivedAt} max={todayInSaoPaulo()} onChange={(e) => setReceivedAt(e.target.value)} aria-invalid={Boolean(errors.receivedAt) || undefined} />
              </Field>
            </FieldGroup>
            <Field label="Observações" htmlFor="income-notes" optional>
              <Textarea id="income-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20" />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="other-income-form" loading={create.isPending} leftIcon="plus">
            Registrar receita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Outras receitas do período (fora das comandas). */
export function OtherIncomeTab({ orgId, locationId, days, periodLabel }: { orgId: number; locationId: number; days: string[]; periodLabel: string }) {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [canceling, setCanceling] = useState<VenueOtherIncome | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const query = useVenueFinanceOtherIncome(orgId, { locationId, startDate: days[0], endDate: days[days.length - 1], page, limit: LIMIT });
  const categories = useVenueFinanceCategories(orgId, "OTHER_INCOME");
  const { cancel } = useVenueFinanceOtherIncomeMutations(orgId);

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / LIMIT));
  const activeTotal = rows.filter((r) => !r.canceledAt).reduce((s, r) => s + r.amountCents, 0);

  const handleCancel = async () => {
    if (!canceling) return;
    if (!reason.trim()) {
      setReasonError("Explique o motivo do cancelamento.");
      throw new Error("reason");
    }
    try {
      await cancel.mutateAsync({ incomeId: canceling.id, reason: reason.trim() });
      toast.success("Receita cancelada.");
      setReason("");
      setReasonError(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar a receita."));
      throw err;
    }
  };

  const cancelButton = (r: VenueOtherIncome, labels = false) => (
    <Button variant="subtle" size={labels ? "sm" : "icon-sm"} aria-label="Cancelar receita" title={r.canceledAt ? "Receita já cancelada" : "Cancelar receita"} disabled={Boolean(r.canceledAt)} className={cn("hover:bg-danger-bg hover:text-danger", r.canceledAt && "opacity-40")} onClick={() => setCanceling(r)} leftIcon={labels ? "ban" : undefined}>
      {labels ? "Cancelar" : <Icon name="ban" size={14} />}
    </Button>
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar className="justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length > 0 ? (
            <>
              <span className="tnum font-semibold text-foreground">{formatBRLCents(activeTotal)}</span> em {periodLabel.toLowerCase()}
            </>
          ) : (
            periodLabel
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()}>
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
          <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
            Nova receita
          </Button>
        </div>
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState description="Não foi possível carregar as receitas." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="hand-dollar"
          title={`Nenhuma receita extra em ${periodLabel.toLowerCase()}`}
          description="Couvert, aluguel do espaço e patrocínios entram aqui e somam no resultado."
          action={
            <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
              Nova receita
            </Button>
          }
        />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Recebido em</DataTableHeadCell>
                  <DataTableHeadCell>Receita</DataTableHeadCell>
                  <DataTableHeadCell>Método</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Valor</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={56}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((r, i) => (
                  <DataTableRow key={r.id} index={i}>
                    <DataTableCell className="tnum whitespace-nowrap text-muted-foreground">{formatFullDateSP(r.receivedAt)}</DataTableCell>
                    <DataTableCell>
                      <span className={cn("block font-medium text-foreground", r.canceledAt && "text-muted-foreground line-through")}>{r.description}</span>
                      <span className="block text-caption text-muted-foreground">
                        {r.category.nome}
                        {r.canceledAt && r.cancelReason ? ` · ${r.cancelReason}` : ""}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <FinMethodChip method={r.method} />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={r.canceledAt ? "neutral" : "success"}>{r.canceledAt ? "Cancelada" : "Recebida"}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {r.canceledAt ? <span className="font-normal text-muted-foreground line-through">{formatBRLCents(r.amountCents)}</span> : <Money cents={r.amountCents} tone="in" signed />}
                    </DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      {cancelButton(r)}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((r, i) => (
                <MobileCard
                  key={r.id}
                  index={i}
                  title={r.description}
                  subtitle={`${r.category.nome} · ${formatFullDateSP(r.receivedAt)}`}
                  badge={<StatusBadge tone={r.canceledAt ? "neutral" : "success"}>{r.canceledAt ? "Cancelada" : "Recebida"}</StatusBadge>}
                  meta={[
                    { label: "Valor", value: r.canceledAt ? <span className="text-muted-foreground line-through">{formatBRLCents(r.amountCents)}</span> : <Money cents={r.amountCents} tone="in" signed strong />, num: true },
                    { label: "Método", value: <FinMethodChip method={r.method} /> },
                  ]}
                  actions={r.canceledAt ? undefined : cancelButton(r, true)}
                />
              ))}
            </MobileCardList>
          }
          footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={LIMIT} noun="receitas" onPageChange={setPage} />}
        />
      )}

      <OtherIncomeDialog orgId={orgId} locationId={locationId} categories={categories.data ?? []} open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => {
          if (!v) {
            setCanceling(null);
            setReason("");
            setReasonError(null);
          }
        }}
        danger
        icon="ban"
        title="Cancelar essa receita?"
        description={canceling ? `${canceling.description} · ${formatBRLCents(canceling.amountCents)}. Ela sai do resultado do período.` : undefined}
        confirmLabel="Cancelar receita"
        cancelLabel="Voltar"
        onConfirm={handleCancel}
      >
        <Field label="Motivo" htmlFor="income-cancel-reason" required error={reasonError}>
          <Textarea id="income-cancel-reason" value={reason} onChange={(e) => (setReason(e.target.value), setReasonError(null))} placeholder="Ex.: lançado em duplicidade" className="min-h-20" aria-invalid={Boolean(reasonError) || undefined} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
