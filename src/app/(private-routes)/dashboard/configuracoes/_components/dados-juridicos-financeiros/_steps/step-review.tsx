"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { LegalFinancialDraft } from "@/services/venue-legal-financial";
import { DefinitionItem, DefinitionList } from "../../../../_components/definition-list";

export function StepReview({ draft, onSubmit, onBack, submitting }: { draft: LegalFinancialDraft; onSubmit: () => void; onBack: () => void; submitting: boolean }) {
  const isCompany = draft.legalType === "COMPANY";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Revisão</CardTitle>
          <CardDescription>Confira os dados antes de criar o recebedor.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <DefinitionList>
          <DefinitionItem label={isCompany ? "Razão social" : "Nome"} value={draft.legalName} />
          <DefinitionItem label={isCompany ? "CNPJ" : "CPF"} value={draft.documentMasked} mono />
          {isCompany ? (
            <>
              <DefinitionItem label="Endereço do representante" value={draft.representative.motherName ? "Preenchido" : null} />
              <DefinitionItem label="Representante legal" value={draft.representative.documentMasked} mono />
            </>
          ) : null}
          <DefinitionItem label="Conta bancária" value={draft.bankAccountMasked} mono />
        </DefinitionList>

        <Callout tone="brand" icon="shield">
          Cadastro criado não significa saldo liberado — a Pagar.me ainda precisa concluir o KYC. Você confirma o envio com uma verificação de segurança.
        </Callout>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting} leftIcon="arrow-left">
          Voltar
        </Button>
        <Button onClick={onSubmit} loading={submitting} leftIcon="check">
          Criar recebedor
        </Button>
      </CardFooter>
    </Card>
  );
}
