"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueFinancialCategory } from "@/services/venue-finance";
import type { VenueSupplier } from "@/services/venue-stock";
import { useVenueFinancePayableMutations } from "../_hooks/use-venue-finance-payables";
import { dateInputToIso, parseBRLToCents, todayInSaoPaulo } from "./finance-shared";

type Errors = Partial<Record<"description" | "categoryId" | "amount" | "incurredAt" | "dueAt", string>>;

/** Nova conta a pagar (categoria EXPENSE, fornecedor opcional). */
export function PayableFormDialog({ orgId, locationId, categories, suppliers, open, onOpenChange }: { orgId: number; locationId: number; categories: VenueFinancialCategory[]; suppliers: VenueSupplier[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useVenueFinancePayableMutations(orgId);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredAt, setIncurredAt] = useState(todayInSaoPaulo());
  const [dueAt, setDueAt] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setSupplierId("");
    setAmount("");
    setIncurredAt(todayInSaoPaulo());
    setDueAt("");
    setDocumentNumber("");
    setNotes("");
    setErrors({});
  }, [open, categories]);

  const handleSubmit = async () => {
    const next: Errors = {};
    const cents = parseBRLToCents(amount);
    if (!description.trim()) next.description = "Diga do que é essa conta.";
    if (!categoryId) next.categoryId = "Escolha uma categoria.";
    if (cents === null || cents <= 0) next.amount = "Informe um valor maior que zero.";
    if (!incurredAt) next.incurredAt = "Informe a data de competência.";
    if (dueAt && incurredAt && dueAt < incurredAt) next.dueAt = "O vencimento não pode ser antes da competência.";
    setErrors(next);
    if (Object.keys(next).length > 0 || cents === null) return;

    try {
      await create.mutateAsync({
        locationId,
        categoryId: Number(categoryId),
        supplierId: supplierId ? Number(supplierId) : undefined,
        description: description.trim(),
        totalAmountCents: cents,
        incurredAt: dateInputToIso(incurredAt),
        dueAt: dueAt ? dateInputToIso(dueAt) : undefined,
        documentNumber: documentNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Conta criada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível criar a conta."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!create.isPending ? onOpenChange(v) : null)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nova conta a pagar</DialogTitle>
          <DialogDescription>Fornecedor, aluguel, equipe — tudo que sai do caixa do bar.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="payable-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field label="Descrição" htmlFor="payable-description" required error={errors.description}>
              <Input id="payable-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Chopp e tônicas — NF 48930" aria-invalid={Boolean(errors.description) || undefined} autoFocus />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Categoria" htmlFor="payable-category" required error={errors.categoryId}>
                <NativeSelect id="payable-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={Boolean(errors.categoryId) || undefined}>
                  {categories.length === 0 ? <option value="">Nenhuma categoria de despesa</option> : null}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Fornecedor" htmlFor="payable-supplier" optional>
                <NativeSelect id="payable-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Sem fornecedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            <Field label="Valor" htmlFor="payable-amount" required error={errors.amount}>
              <Input id="payable-amount" prefix="R$" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={Boolean(errors.amount) || undefined} />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Competência" htmlFor="payable-incurred" required error={errors.incurredAt} hint="Quando a despesa aconteceu">
                <Input id="payable-incurred" type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} aria-invalid={Boolean(errors.incurredAt) || undefined} />
              </Field>
              <Field label="Vencimento" htmlFor="payable-due" optional error={errors.dueAt}>
                <Input id="payable-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-invalid={Boolean(errors.dueAt) || undefined} />
              </Field>
            </FieldGroup>
            <Field label="Nº do documento" htmlFor="payable-doc" optional>
              <Input id="payable-doc" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="NF, boleto, pedido…" />
            </Field>
            <Field label="Observações" htmlFor="payable-notes" optional>
              <Textarea id="payable-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Combinados, parcelamento, contato…" className="min-h-20" />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="payable-form" loading={create.isPending} leftIcon="plus">
            Criar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
