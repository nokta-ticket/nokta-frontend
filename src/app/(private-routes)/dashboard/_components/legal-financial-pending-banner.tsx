"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLegalFinancialProfile } from "../configuracoes/_hooks/use-legal-financial-settings";

/**
 * Banner de pendência jurídico/financeira — regra 1.4 do hardening: nunca
 * deixar o bloqueio de venda/saque como um 403/400 genérico sem
 * orientação. Aparece quando o perfil está em LEGACY_REVIEW_REQUIRED,
 * FINANCIAL_REVIEW_REQUIRED ou ainda não foi iniciado — nunca bloqueia a
 * navegação, só orienta.
 */
export function LegalFinancialPendingBanner({ orgId }: { orgId: number | null }) {
  const { data: profile } = useLegalFinancialProfile(orgId);

  if (!profile) return null;

  const status = profile.verificationStatus;
  const needsAttention =
    status === "LEGACY_REVIEW_REQUIRED" || status === "FINANCIAL_REVIEW_REQUIRED" || status === "NOT_STARTED" || status === "REJECTED";

  if (!needsAttention) return null;

  const MESSAGE: Record<string, string> = {
    NOT_STARTED: "Complete os dados jurídicos e financeiros da organização para poder vender ingressos pagos e solicitar saques.",
    LEGACY_REVIEW_REQUIRED: "Sua organização precisa regularizar os dados jurídicos e financeiros para continuar vendendo ingressos pagos e solicitar saques. Seus eventos, vendas e saldos atuais continuam preservados.",
    FINANCIAL_REVIEW_REQUIRED: "Uma correção nos seus dados jurídicos/financeiros está em revisão. Publicação de eventos pagos e saques ficam temporariamente pausados até a conclusão.",
    REJECTED: "A verificação dos seus dados jurídicos/financeiros foi rejeitada. Revise e reenvie para continuar vendendo ingressos pagos.",
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900">Pendência financeira</p>
          <p className="text-amber-800">{MESSAGE[status] ?? MESSAGE.NOT_STARTED}</p>
        </div>
      </div>
      <Link
        href="/dashboard/configuracoes?tab=juridico-financeiro"
        className="ml-6 flex h-10 shrink-0 items-center self-start whitespace-nowrap rounded-md border border-amber-300 bg-white px-3 text-[13px] font-medium text-amber-900 hover:bg-amber-100 sm:ml-0 sm:h-auto sm:py-1.5 sm:text-xs"
      >
        Completar dados
      </Link>
    </div>
  );
}
