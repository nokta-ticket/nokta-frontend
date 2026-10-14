"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "@/lib/toast";
import type { BankAccountPayload } from "@/services/venue-legal-financial";

export function emptyBankAccount(): BankAccountPayload {
  return { holderName: "", bank: "", branchNumber: "", branchCheckDigit: "", accountNumber: "", accountCheckDigit: "", accountType: "checking" };
}

export function StepBankAccount({ initialValue, onSubmit, onBack, submitting }: { initialValue: BankAccountPayload; onSubmit: (value: BankAccountPayload) => void; onBack: () => void; submitting: boolean }) {
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
        <div>
          <CardTitle>Conta e repasse</CardTitle>
          <CardDescription>Conta bancária para onde os repasses serão transferidos. Precisa estar no mesmo documento do responsável financeiro. Saques continuam sempre manuais, aprovados pela Nokta.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field label="Nome do titular" htmlFor="bank-holder" required hint="Igual ao nome/razão social cadastrado.">
          <Input id="bank-holder" value={value.holderName} onChange={(e) => set("holderName", e.target.value)} />
        </Field>

        <FieldGroup columns={3}>
          <Field label="Banco (código)" htmlFor="bank-code" required>
            <Input id="bank-code" value={value.bank} onChange={(e) => set("bank", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Ex.: 001" inputMode="numeric" maxLength={3} />
          </Field>
          <Field label="Agência" htmlFor="bank-branch" required>
            <Input id="bank-branch" value={value.branchNumber} onChange={(e) => set("branchNumber", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0000" inputMode="numeric" maxLength={6} />
          </Field>
          <Field label="Dígito da agência" htmlFor="bank-branch-digit" optional>
            <Input id="bank-branch-digit" value={value.branchCheckDigit} onChange={(e) => set("branchCheckDigit", e.target.value.replace(/\D/g, "").slice(0, 1))} inputMode="numeric" maxLength={1} />
          </Field>
        </FieldGroup>

        <FieldGroup columns={3}>
          <Field label="Conta" htmlFor="bank-account" required>
            <Input id="bank-account" value={value.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="00000000" inputMode="numeric" maxLength={13} />
          </Field>
          <Field label="Dígito da conta" htmlFor="bank-account-digit" required>
            <Input id="bank-account-digit" value={value.accountCheckDigit} onChange={(e) => set("accountCheckDigit", e.target.value.replace(/[^0-9xX]/g, "").slice(0, 2))} inputMode="text" maxLength={2} />
          </Field>
          <Field label="Tipo de conta">
            <SegmentedControl value={value.accountType} onChange={(v) => set("accountType", v)} options={[{ value: "checking", label: "Corrente" }, { value: "savings", label: "Poupança" }]} fullWidth />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting} leftIcon="arrow-left">
          Voltar
        </Button>
        <Button onClick={handleSubmit} loading={submitting} rightIcon="arrow-right">
          Continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
