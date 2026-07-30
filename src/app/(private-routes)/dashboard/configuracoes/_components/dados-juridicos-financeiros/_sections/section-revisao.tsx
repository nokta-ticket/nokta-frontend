"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BankAccountFormState, CompanyFormState, RepresentativeFormState } from "../types";

function maskCnpj(digits: string): string {
  if (digits.length !== 14) return "—";
  return `**.***.***/****-${digits.slice(-4)}`;
}

function maskCpf(digits: string): string {
  if (digits.length !== 11) return "—";
  return `***.***.***-${digits.slice(-4)}`;
}

function maskAccount(digits: string): string {
  if (digits.length < 4) return "—";
  return `***${digits.slice(-4)}`;
}

export function SectionRevisao({
  company,
  representative,
  bankAccount,
  submitting,
  onSubmit,
  canSubmit,
}: {
  company: CompanyFormState;
  representative: RepresentativeFormState;
  bankAccount: BankAccountFormState;
  submitting: boolean;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Revisão</CardTitle>
        <CardDescription>Confira os dados antes de criar o recebedor. Cadastro criado não significa saldo liberado — a Pagar.me ainda precisa concluir o KYC.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-black/50">Razão social</Label>
            <p className="text-sm font-medium">{company.legalName || "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">CNPJ</Label>
            <p className="text-sm font-medium">{maskCnpj(company.document)}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">Endereço da empresa</Label>
            <p className="text-sm font-medium">
              {company.address.city ? `${company.address.city}/${company.address.state}` : "—"}
            </p>
          </div>
          <div>
            <Label className="text-xs text-black/50">Representante legal</Label>
            <p className="text-sm font-medium">{maskCpf(representative.document)}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">Conta bancária</Label>
            <p className="text-sm font-medium">
              {bankAccount.bank ? `Banco ${bankAccount.bank} — ${maskAccount(bankAccount.accountNumber)}` : "—"}
            </p>
          </div>
          <div>
            <Label className="text-xs text-black/50">Titular</Label>
            <p className="text-sm font-medium">{bankAccount.holderName || "—"}</p>
          </div>
        </div>

        <Button onClick={onSubmit} disabled={!canSubmit || submitting} className="w-full sm:w-auto">
          {submitting ? "Criando recebedor…" : "Criar recebedor"}
        </Button>
        {!canSubmit && !submitting ? (
          <p className="text-xs text-black/50">Preencha todos os campos obrigatórios das seções acima para continuar.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
