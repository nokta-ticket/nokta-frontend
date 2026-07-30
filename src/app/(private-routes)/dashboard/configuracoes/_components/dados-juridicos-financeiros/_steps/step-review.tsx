"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LegalFinancialDraft } from "@/services/venue-legal-financial";

export function StepReview({
  draft,
  onSubmit,
  onBack,
  submitting,
}: {
  draft: LegalFinancialDraft;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const isCompany = draft.legalType === "COMPANY";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisão</CardTitle>
        <CardDescription>
          Confira os dados antes de criar o recebedor. Cadastro criado não significa saldo liberado — a Pagar.me ainda precisa concluir o KYC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-black/50">{isCompany ? "Razão social" : "Nome"}</Label>
            <p className="text-sm font-medium">{draft.legalName || "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">{isCompany ? "CNPJ" : "CPF"}</Label>
            <p className="text-sm font-medium">{draft.documentMasked ?? "—"}</p>
          </div>
          {isCompany ? (
            <>
              <div>
                <Label className="text-xs text-black/50">Endereço do representante</Label>
                <p className="text-sm font-medium">{draft.representative.motherName ? "Preenchido" : "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-black/50">Representante legal</Label>
                <p className="text-sm font-medium">{draft.representative.documentMasked ?? "—"}</p>
              </div>
            </>
          ) : null}
          <div>
            <Label className="text-xs text-black/50">Conta bancária</Label>
            <p className="text-sm font-medium">{draft.bankAccountMasked ?? "—"}</p>
          </div>
        </div>

        <CardFooter className="flex justify-between p-0">
          <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
            Voltar
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Criando recebedor…" : "Criar recebedor"}
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
