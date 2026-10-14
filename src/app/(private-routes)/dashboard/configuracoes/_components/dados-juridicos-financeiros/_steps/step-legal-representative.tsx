"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCpf, validateCpf } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { DefinitionItem, DefinitionList } from "../../../../_components/definition-list";
import { maskMoney, moneyToDecimal } from "../types";

export interface LegalRepresentativeFormState {
  document: string;
  motherName: string;
  birthdate: string;
  monthlyIncome: string;
  professionalOccupation: string;
}

export function emptyLegalRepresentative(): LegalRepresentativeFormState {
  return { document: "", motherName: "", birthdate: "", monthlyIncome: "", professionalOccupation: "" };
}

/** Representante legal — sempre o próprio usuário autenticado (dono/criador do workspace, sócio do QSA). */
export function StepLegalRepresentative({
  initialValue,
  representativeName,
  representativeEmail,
  onSubmit,
  onBack,
  submitting,
}: {
  initialValue: LegalRepresentativeFormState;
  representativeName: string;
  representativeEmail: string;
  onSubmit: (value: LegalRepresentativeFormState) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const set = <K extends keyof LegalRepresentativeFormState>(key: K, val: LegalRepresentativeFormState[K]) => setValue((v) => ({ ...v, [key]: val }));
  const documentValid = validateCpf(value.document);

  const canAdvance = documentValid && value.motherName.trim().length >= 2 && !!value.birthdate && Number(moneyToDecimal(value.monthlyIncome)) > 0 && value.professionalOccupation.trim().length >= 2;

  const handleSubmit = () => {
    if (!canAdvance) {
      toast.error("Preencha CPF válido, nome da mãe, data de nascimento, renda e ocupação.");
      return;
    }
    onSubmit({ ...value, monthlyIncome: moneyToDecimal(value.monthlyIncome) });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Representante legal</CardTitle>
          <CardDescription>
            A Pagar.me exige um representante legal vinculado ao quadro societário — sempre você, dono deste workspace.
            {initialValue.document ? null : " Se você já preencheu esta etapa antes, os campos aparecem vazios por segurança — é só preencher de novo."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="surface-inset rounded-xl p-4">
          <DefinitionList>
            <DefinitionItem label="Nome" value={representativeName} />
            <DefinitionItem label="E-mail" value={representativeEmail} />
          </DefinitionList>
        </div>

        <FieldGroup columns={2}>
          <Field label="CPF" htmlFor="rep-document" required hint={value.document && documentValid ? "CPF válido." : undefined} error={value.document && !documentValid ? "CPF inválido." : undefined}>
            <Input id="rep-document" value={formatCpf(value.document)} onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} aria-invalid={value.document && !documentValid ? true : undefined} />
          </Field>
          <Field label="Data de nascimento" htmlFor="rep-birthdate" required>
            <Input id="rep-birthdate" type="date" value={value.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
          </Field>
        </FieldGroup>

        <Field label="Nome da mãe" htmlFor="rep-mother" required>
          <Input id="rep-mother" value={value.motherName} onChange={(e) => set("motherName", e.target.value)} />
        </Field>

        <FieldGroup columns={2}>
          <Field label="Renda mensal" htmlFor="rep-income" required>
            <Input id="rep-income" prefix="R$" value={value.monthlyIncome} onChange={(e) => set("monthlyIncome", maskMoney(e.target.value, 12))} placeholder="15.000,00" inputMode="numeric" />
          </Field>
          <Field label="Ocupação profissional" htmlFor="rep-occupation" required>
            <Input id="rep-occupation" value={value.professionalOccupation} onChange={(e) => set("professionalOccupation", e.target.value)} placeholder="Empresária" />
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
