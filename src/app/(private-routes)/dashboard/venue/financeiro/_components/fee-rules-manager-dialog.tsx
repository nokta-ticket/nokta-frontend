"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { VENUE_PAYMENT_METHOD_LABEL, type VenuePaymentMethod } from "@/services/venue-finance";
import { useVenueFinanceFeeRuleMutations, useVenueFinanceFeeRules } from "../_hooks/use-venue-finance-fee-rules";

const APPLICABLE_METHODS: VenuePaymentMethod[] = ["PIX", "DEBIT_CARD", "CREDIT_CARD", "VOUCHER", "OTHER"];

export function FeeRulesManagerDialog({ orgId, locations, open, onOpenChange }: { orgId: number; locations: VenueLocation[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [locationFilter, setLocationFilter] = useState<string>("global");
  const { data: rules } = useVenueFinanceFeeRules(orgId, locationFilter !== "global" ? Number(locationFilter) : undefined);
  const { create, deactivate } = useVenueFinanceFeeRuleMutations(orgId);

  const [method, setMethod] = useState<VenuePaymentMethod>("PIX");
  const [percentage, setPercentage] = useState("0");
  const [fixedFee, setFixedFee] = useState("0");
  const [settlementDays, setSettlementDays] = useState("1");

  const handleCreate = () => {
    const percentageBps = Math.round(Number(percentage.replace(",", ".")) * 100);
    const fixedFeeCents = Math.round(Number(fixedFee.replace(",", ".")) * 100);
    create
      .mutateAsync({
        locationId: locationFilter !== "global" ? Number(locationFilter) : undefined,
        method,
        percentageBps,
        fixedFeeCents,
        settlementDays: Number(settlementDays) || 0,
      })
      .then(() => toast.success("Regra de taxa criada."))
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a regra.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Regras de taxa por forma de pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Escopo</Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Regra global da organização</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-black/50">A regra da unidade sempre prevalece sobre a global.</p>
          </div>

          <div className="space-y-3 rounded-lg border border-black/10 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as VenuePaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPLICABLE_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{VENUE_PAYMENT_METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo de liquidação (dias)</Label>
                <Input type="number" min={0} value={settlementDays} onChange={(e) => setSettlementDays(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Percentual (%)</Label>
                <Input inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="Ex.: 2,99" />
              </div>
              <div className="space-y-2">
                <Label>Taxa fixa (R$)</Label>
                <Input inputMode="decimal" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} placeholder="Ex.: 0,10" />
              </div>
            </div>
            <Button size="sm" disabled={create.isPending} onClick={handleCreate}>
              <Plus size={14} /> Adicionar regra
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-black/50">Regras ativas</Label>
            <div className="divide-y divide-black/5 rounded-lg border border-black/10">
              {(rules ?? []).filter((r) => r.active).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{VENUE_PAYMENT_METHOD_LABEL[r.method]} · {(r.percentageBps / 100).toFixed(2)}% + R$ {(r.fixedFeeCents / 100).toFixed(2)} · D+{r.settlementDays}</span>
                  <Button size="sm" variant="ghost" onClick={() => deactivate.mutate(r.id)}>Desativar</Button>
                </div>
              ))}
              {(rules ?? []).filter((r) => r.active).length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-black/50">Nenhuma regra ativa neste escopo — dinheiro nunca precisa de regra (taxa zero, liquidação imediata).</p>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
