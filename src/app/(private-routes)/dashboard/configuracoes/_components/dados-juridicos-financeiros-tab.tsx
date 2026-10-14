"use client";

import { Callout } from "@/components/ui/callout";
import { Skeleton } from "@/components/ui/skeleton";
import { useLegalFinancialProfile } from "../_hooks/use-legal-financial-settings";
import { LegalFinancialWizard } from "./dados-juridicos-financeiros/legal-financial-wizard";

/**
 * Wizard PF/PJ com rascunho persistido no backend por etapa. Um único
 * fluxo serve os dois tipos — a primeira etapa (Responsável) decide se as
 * etapas seguintes pedem dados de empresa+representante (PJ) ou só da
 * pessoa (PF, mesmo nível de detalhe: endereço, telefone, renda, ocupação
 * completos, sem formulário "simplificado"). Ver
 * dados-juridicos-financeiros/legal-financial-wizard.tsx.
 */
export function DadosJuridicosFinanceirosTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: profile, isLoading } = useLegalFinancialProfile(orgId);

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;

  if (!canManage) {
    return (
      <Callout tone="neutral" icon="lock" title="Verificação a cargo do responsável">
        Aguardando o responsável pela organização concluir a verificação financeira.
      </Callout>
    );
  }

  return <LegalFinancialWizard orgId={orgId} profile={profile} />;
}
