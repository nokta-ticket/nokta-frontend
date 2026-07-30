"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCpf, validateCpf } from "@/lib/br-data";
import { toast } from "@/lib/toast";

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

  const canAdvance =
    documentValid &&
    value.motherName.trim().length >= 2 &&
    !!value.birthdate &&
    Number(value.monthlyIncome.replace(",", ".")) > 0 &&
    value.professionalOccupation.trim().length >= 2;

  const handleSubmit = () => {
    if (!canAdvance) {
      toast.error("Preencha CPF válido, nome da mãe, data de nascimento, renda e ocupação.");
      return;
    }
    onSubmit(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Representante legal</CardTitle>
        <CardDescription>
          A Pagar.me exige um representante legal vinculado ao quadro societário — sempre você, dono deste workspace.
          {initialValue.document ? null : " Se você já preencheu esta etapa antes, os campos abaixo aparecem vazios por segurança — é só preencher de novo."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-xl bg-black/[0.03] p-3.5 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-black/50">Nome</Label>
            <p className="text-sm font-medium">{representativeName}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">E-mail</Label>
            <p className="text-sm font-medium">{representativeEmail}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input
              value={formatCpf(value.document)}
              onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
            />
            {value.document ? (
              <p className={documentValid ? "text-xs text-green-600" : "text-xs text-red-500"}>{documentValid ? "CPF válido." : "CPF inválido."}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Data de nascimento</Label>
            <Input type="date" value={value.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Nome da mãe</Label>
          <Input value={value.motherName} onChange={(e) => set("motherName", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Renda mensal (R$)</Label>
            <Input value={value.monthlyIncome} onChange={(e) => set("monthlyIncome", e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="15000.00" inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label>Ocupação profissional</Label>
            <Input value={value.professionalOccupation} onChange={(e) => set("professionalOccupation", e.target.value)} placeholder="Empresária" />
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
