"use client";

import { BlockSkeleton } from "../../_components/states/loading-state";
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

  if (isLoading) return <BlockSkeleton className="h-72" />;

  if (!canManage) {
    return <p className="text-sm text-black/50">Aguardando o responsável pela organização concluir a verificação financeira.</p>;
  }

  return <LegalFinancialWizard orgId={orgId} profile={profile} />;
}
