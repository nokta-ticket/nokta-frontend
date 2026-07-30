"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { BankAccountPayload } from "@/services/venue-legal-financial";

export function emptyBankAccount(): BankAccountPayload {
  return { holderName: "", bank: "", branchNumber: "", branchCheckDigit: "", accountNumber: "", accountCheckDigit: "", accountType: "checking" };
}

export function StepBankAccount({
  initialValue,
  onSubmit,
  onBack,
  submitting,
}: {
  initialValue: BankAccountPayload;
  onSubmit: (value: BankAccountPayload) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const set = <K extends keyof BankAccountPayload>(key: K, val: BankAccountPayload[K]) => setValue((v) => ({ ...v, [key]: val }));

  const canAdvance = value.holderName.trim().length >= 2 && !!value.bank && !!value.branchNumber && !!value.accountNumber && !!value.accountCheckDigit;

  const handleSubmit = () => {
    if (!canAdvance) {
      toast.error("Preencha todos os campos obrigatórios da conta bancária.");
      return;
    }
    onSubmit(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conta e repasse</CardTitle>
        <CardDescription>
          Conta bancária para onde os repasses serão transferidos. Precisa estar no mesmo documento do responsável financeiro. Split ≠ transferência
          automática: saques continuam sempre manuais, aprovados pela Nokta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome do titular</Label>
          <Input value={value.holderName} onChange={(e) => set("holderName", e.target.value)} placeholder="Igual ao nome/razão social cadastrado" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Banco (código)</Label>
            <Input value={value.bank} onChange={(e) => set("bank", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Ex.: 001" inputMode="numeric" maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Agência</Label>
            <Input value={value.branchNumber} onChange={(e) => set("branchNumber", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0000" inputMode="numeric" maxLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Dígito da agência (opcional)</Label>
            <Input value={value.branchCheckDigit} onChange={(e) => set("branchCheckDigit", e.target.value.replace(/\D/g, "").slice(0, 1))} inputMode="numeric" maxLength={1} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Input value={value.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="00000000" inputMode="numeric" maxLength={13} />
          </div>
          <div className="space-y-1.5">
            <Label>Dígito da conta</Label>
            <Input value={value.accountCheckDigit} onChange={(e) => set("accountCheckDigit", e.target.value.replace(/[^0-9xX]/g, "").slice(0, 2))} inputMode="text" maxLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de conta</Label>
            <Select value={value.accountType} onValueChange={(v) => set("accountType", v as "checking" | "savings")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Salvando…" : "Continuar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
