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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { VENUE_FINANCIAL_PAYMENT_METHOD_LABEL, type VenueFinancialCategory, type VenueFinancialPaymentMethod } from "@/services/venue-finance";
import { useVenueFinanceOtherIncomeMutations } from "../_hooks/use-venue-finance-other-income";
import { useVenueCashSessions } from "../../../operacao/_hooks/use-venue-cash";
import { MoneyField } from "../../../cardapio/_components/money-field";

export function OtherIncomeFormDialog({
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
  const { create } = useVenueFinanceOtherIncomeMutations(orgId);

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [locationId, setLocationId] = useState<string>("none");
  const [amountCents, setAmountCents] = useState(0);
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<VenueFinancialPaymentMethod>("CASH");
  const [cashSessionId, setCashSessionId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");

  const { data: cashSessions } = useVenueCashSessions(orgId, locationId !== "none" ? Number(locationId) : null);
  const openSessions = (cashSessions ?? []).filter((s) => s.status === "OPEN");

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setCategoryId(undefined);
    setLocationId("none");
    setAmountCents(0);
    setReceivedAt(new Date().toISOString().slice(0, 10));
    setMethod("CASH");
    setCashSessionId(undefined);
    setNotes("");
  }, [open]);

  const handleSubmit = () => {
    if (!description.trim() || !categoryId || amountCents <= 0) {
      toast.error("Preencha descrição, categoria e valor.");
      return;
    }
    if (method === "CASH" && !cashSessionId) {
      toast.error("Selecione o caixa para a receita em dinheiro.");
      return;
    }

    create
      .mutateAsync({
        description: description.trim(),
        categoryId: Number(categoryId),
        locationId: locationId !== "none" ? Number(locationId) : undefined,
        amountCents,
        receivedAt: new Date(`${receivedAt}T12:00:00.000Z`).toISOString(),
        method,
        cashSessionId: method === "CASH" ? Number(cashSessionId) : undefined,
        notes: notes.trim() || undefined,
        idempotencyKey: `other-income:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      })
      .then(() => {
        toast.success("Receita registrada.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível registrar a receita.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova receita</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-desc">Descrição</Label>
            <Input id="income-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Aluguel de espaço para evento" />
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
                  <SelectItem value="none">Não vinculada</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyField label="Valor" cents={amountCents} onChange={setAmountCents} />
            <div className="space-y-2">
              <Label htmlFor="income-received">Data</Label>
              <Input id="income-received" type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
            </div>
          </div>
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
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="income-notes">Observação (opcional)</Label>
            <Textarea id="income-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
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
