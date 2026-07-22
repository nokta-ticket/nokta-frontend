"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { formatCurrency } from "@/lib/formatCurrency";
import { refundsApi } from "@/services/refunds";

const REGRET_WINDOW_DAYS = 7;

/**
 * Solicitação de cancelamento — regra 6 da etapa de hardening: mostra
 * ingresso elegível, breakdown do valor a devolver, política aplicada e
 * motivo de inelegibilidade, exigindo confirmação antes do envio. Reembolso
 * é por ITEM completo (nunca valor arbitrário) — aqui só 1 ingresso por vez
 * (a tela de detalhe é por UserTicket individual).
 */
export function RefundRequestCard({
  orderId,
  userTicketId,
  ticketValue,
  ticketStatus,
  purchasedAt,
}: {
  orderId: number;
  userTicketId: number;
  ticketValue: number;
  ticketStatus: number; // 1=not validated, 2=validated
  purchasedAt: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const deadline = new Date(purchasedAt);
  deadline.setDate(deadline.getDate() + REGRET_WINDOW_DAYS);
  const withinWindow = new Date() <= deadline;
  const isUsed = ticketStatus === 2;

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Cancelamento solicitado com sucesso. Você será notificado quando o reembolso for concluído.
      </div>
    );
  }

  if (isUsed) {
    return (
      <div className="rounded-lg border border-black/10 bg-gray-50 p-4 text-sm text-gray-600">
        Este ingresso já foi utilizado e não pode mais ser cancelado.
      </div>
    );
  }

  if (!withinWindow) {
    return (
      <div className="rounded-lg border border-black/10 bg-gray-50 p-4 text-sm text-gray-600">
        O prazo de arrependimento (7 dias corridos após a compra, até{" "}
        {deadline.toLocaleDateString("pt-BR")}) já encerrou. Consulte nossa{" "}
        <a href="/politica-de-cancelamento" target="_blank" className="text-violet-600 underline">
          Política de Cancelamento
        </a>
        .
      </div>
    );
  }

  const handleConfirm = () => {
    setSubmitting(true);
    refundsApi
      .create(orderId, { userTicketIds: [userTicketId], policy: "BUYER_REGRET_7_DAYS" })
      .then(() => {
        setDone(true);
        toast.success("Cancelamento solicitado.");
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível solicitar o cancelamento.")))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">Cancelar este ingresso</p>
          <p className="mt-1 text-gray-600">
            Dentro do prazo de arrependimento (até {deadline.toLocaleDateString("pt-BR")}). Você receberá de volta o
            valor total pago por este ingresso: <strong>{formatCurrency(ticketValue)}</strong>.
          </p>

          {!confirming ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setConfirming(true)}>
              Solicitar cancelamento
            </Button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500">
                Ao confirmar, este ingresso será cancelado e o reembolso de {formatCurrency(ticketValue)} será
                processado. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Enviando…" : "Confirmar cancelamento"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={submitting}>
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
