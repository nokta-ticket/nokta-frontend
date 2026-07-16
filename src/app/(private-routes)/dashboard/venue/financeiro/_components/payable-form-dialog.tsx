"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import {
  VENUE_FINANCIAL_PAYMENT_METHOD_LABEL,
  type CreateVenuePayablePayload,
  type VenueFinancialCategory,
  type VenueFinancialPaymentMethod,
} from "@/services/venue-finance";
import { useVenueFinancePayableMutations } from "../_hooks/use-venue-finance-payables";
import { useVenueCashSessions } from "../../operacao/_hooks/use-venue-cash";
import { useVenueStockSuppliers } from "../../estoque/_hooks/use-venue-stock-catalog";
import { MoneyField } from "../../cardapio/_components/money-field";

export function PayableFormDialog({
  orgId,
  locations,
  categories,
  open,
  onOpenChange,
}: {
  orgId: number;
  locations: VenueLocation[];
  categories: VenueFinancialCategory[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { create } = useVenueFinancePayableMutations(orgId);
  const { data: suppliers } = useVenueStockSuppliers(orgId);

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [locationId, setLocationId] = useState<string>("none");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [totalAmountCents, setTotalAmountCents] = useState(0);
  const [incurredAt, setIncurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueAt, setDueAt] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [method, setMethod] = useState<VenueFinancialPaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [cashSessionId, setCashSessionId] = useState<string | undefined>(undefined);
  const [externalReference, setExternalReference] = useState("");

  const { data: cashSessions } = useVenueCashSessions(orgId, locationId !== "none" ? Number(locationId) : null);
  const openSessions = (cashSessions ?? []).filter((s) => s.status === "OPEN");

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setCategoryId(undefined);
    setLocationId("none");
    setSupplierId("none");
    setTotalAmountCents(0);
    setIncurredAt(new Date().toISOString().slice(0, 10));
    setDueAt("");
    setDocumentNumber("");
    setNotes("");
    setIsPaid(false);
    setMethod("CASH");
    setPaidAt(new Date().toISOString().slice(0, 10));
    setCashSessionId(undefined);
    setExternalReference("");
  }, [open]);

  const handleSubmit = () => {
    if (!description.trim() || !categoryId || totalAmountCents <= 0) {
      toast.error("Preencha descrição, categoria e valor.");
      return;
    }
    if (isPaid && method === "CASH" && !cashSessionId) {
      toast.error("Selecione o caixa para o pagamento em dinheiro.");
      return;
    }

    const payload: CreateVenuePayablePayload = {
      description: description.trim(),
      categoryId: Number(categoryId),
      locationId: locationId !== "none" ? Number(locationId) : undefined,
      supplierId: supplierId !== "none" ? Number(supplierId) : undefined,
      totalAmountCents,
      incurredAt: new Date(`${incurredAt}T12:00:00.000Z`).toISOString(),
      dueAt: dueAt ? new Date(`${dueAt}T12:00:00.000Z`).toISOString() : undefined,
      documentNumber: documentNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      initialPayment: isPaid
        ? {
            method,
            amountCents: totalAmountCents,
            paidAt: new Date(`${paidAt}T12:00:00.000Z`).toISOString(),
            cashSessionId: method === "CASH" ? Number(cashSessionId) : undefined,
            externalReference: externalReference.trim() || undefined,
            idempotencyKey: `payable-create:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          }
        : undefined,
    };

    create
      .mutateAsync(payload)
      .then(() => {
        toast.success("Despesa registrada.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível registrar a despesa.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payable-desc">Descrição</Label>
            <Input id="payable-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Aluguel de julho" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade (opcional)</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas / não vinculada</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem fornecedor</SelectItem>
                  {(suppliers ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MoneyField label="Valor" cents={totalAmountCents} onChange={setTotalAmountCents} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payable-incurred">Data de competência</Label>
              <Input id="payable-incurred" type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payable-due">Vencimento (opcional)</Label>
              <Input id="payable-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payable-doc">Documento (opcional)</Label>
            <Input id="payable-doc" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payable-notes">Observação (opcional)</Label>
            <Textarea id="payable-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-black/10 p-3">
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
            <Label>Já foi paga</Label>
          </div>

          {isPaid ? (
            <div className="space-y-3 rounded-lg border border-black/10 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as VenueFinancialPaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(VENUE_FINANCIAL_PAYMENT_METHOD_LABEL) as VenueFinancialPaymentMethod[]).map((m) => (
                        <SelectItem key={m} value={m}>{VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payable-paid-at">Data do pagamento</Label>
                  <Input id="payable-paid-at" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                </div>
              </div>
              {method === "CASH" ? (
                <div className="space-y-2">
                  <Label>Caixa</Label>
                  <Select value={cashSessionId} onValueChange={setCashSessionId}>
                    <SelectTrigger><SelectValue placeholder={openSessions.length ? "Selecione o caixa aberto" : "Nenhum caixa aberto nesta unidade"} /></SelectTrigger>
                    <SelectContent>
                      {openSessions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>Caixa #{s.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="payable-ref">Referência (opcional)</Label>
                  <Input id="payable-ref" value={externalReference} onChange={(e) => setExternalReference(e.target.value)} />
                </div>
              )}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancelar</Button>
          <Button disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
