"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { useLegalFinancialProfile } from "../configuracoes/_hooks/use-legal-financial-settings";

const MESSAGE: Record<string, string> = {
  NOT_STARTED: "Complete os dados jurídicos e financeiros da organização para vender ingressos pagos e pedir saques.",
  LEGACY_REVIEW_REQUIRED: "Regularize os dados jurídicos e financeiros para continuar vendendo ingressos pagos e pedir saques. Eventos, vendas e saldos continuam preservados.",
  FINANCIAL_REVIEW_REQUIRED: "Uma correção nos seus dados jurídicos/financeiros está em revisão. Eventos pagos e saques ficam pausados até a conclusão.",
  REJECTED: "A verificação dos seus dados jurídicos/financeiros foi rejeitada. Revise e reenvie para continuar vendendo ingressos pagos.",
};

/**
 * Aviso de pendência jurídico/financeira — regra 1.4 do hardening: nunca
 * deixar o bloqueio de venda/saque como um 403/400 genérico sem orientação.
 * Aparece em LEGACY_REVIEW_REQUIRED, FINANCIAL_REVIEW_REQUIRED, NOT_STARTED
 * ou REJECTED — nunca bloqueia a navegação, só orienta.
 */
export function LegalFinancialPendingBanner({ orgId }: { orgId: number | null }) {
  const { data: profile } = useLegalFinancialProfile(orgId);

  if (!profile) return null;

  const status = profile.verificationStatus;
  const needsAttention = status === "LEGACY_REVIEW_REQUIRED" || status === "FINANCIAL_REVIEW_REQUIRED" || status === "NOT_STARTED" || status === "REJECTED";
  if (!needsAttention) return null;

  const cta = (
    <Button asChild size="sm" variant="outline">
      <Link href="/dashboard/configuracoes?tab=juridico-financeiro">Completar dados</Link>
    </Button>
  );

  // No celular o botão vai pra baixo do texto (o slot `action` fica ao lado e
  // espremia a mensagem numa coluna estreita).
  return (
    <Callout tone="warning" title="Pendência financeira" action={<span className="hidden sm:inline-flex">{cta}</span>}>
      {MESSAGE[status] ?? MESSAGE.NOT_STARTED}
      <span className="mt-3 flex sm:hidden">{cta}</span>
    </Callout>
  );
}
