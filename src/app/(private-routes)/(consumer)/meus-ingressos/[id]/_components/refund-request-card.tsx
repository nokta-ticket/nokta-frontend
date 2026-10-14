"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { formatBRL, formatDateBR } from "@/lib/format";
import { refundsApi } from "@/services/refunds";

const REGRET_WINDOW_DAYS = 7;

/**
 * Solicitação de cancelamento — regra 6 da etapa de hardening: mostra
 * ingresso elegível, valor a devolver, política aplicada e motivo de
 * inelegibilidade, exigindo confirmação antes do envio. Reembolso é por
 * ITEM completo (nunca valor arbitrário) — aqui só 1 ingresso por vez (a
 * tela de detalhe é por UserTicket individual).
 */
export function RefundRequestCard({ orderId, userTicketId, ticketValue, ticketStatus, purchasedAt }: { orderId: number; userTicketId: number; ticketValue: number; ticketStatus: number; purchasedAt: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const deadline = new Date(purchasedAt);
  deadline.setDate(deadline.getDate() + REGRET_WINDOW_DAYS);
  const withinWindow = new Date() <= deadline;
  const isUsed = ticketStatus === 2;
  const deadlineLabel = formatDateBR(deadline.toISOString());

  if (done) {
    return (
      <Callout tone="success" title="Cancelamento solicitado">
        Você recebe um aviso quando o reembolso for concluído.
      </Callout>
    );
  }

  if (isUsed) {
    return <Callout tone="neutral">Este ingresso já foi utilizado e não pode mais ser cancelado.</Callout>;
  }

  if (!withinWindow) {
    return (
      <Callout tone="neutral">
        O prazo de arrependimento (7 dias corridos após a compra, até {deadlineLabel}) já encerrou. Consulte a{" "}
        <Link href="/politica-de-cancelamento" target="_blank" className="font-medium text-brand underline-offset-4 hover:underline">
          Política de Cancelamento
        </Link>
        .
      </Callout>
    );
  }

  const handleConfirm = async () => {
    try {
      await refundsApi.create(orderId, { userTicketIds: [userTicketId], policy: "BUYER_REGRET_7_DAYS" });
      setDone(true);
      toast.success("Cancelamento solicitado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível solicitar o cancelamento."));
      throw err;
    }
  };

  return (
    <>
      <Callout
        tone="warning"
        title="Cancelar este ingresso"
        action={
          <Button variant="outline" size="sm" shape="pill" onClick={() => setConfirming(true)}>
            Cancelar
          </Button>
        }
      >
        Dentro do prazo de arrependimento (até {deadlineLabel}). Você recebe de volta o valor total pago: <strong className="text-foreground">{formatBRL(ticketValue)}</strong>.
      </Callout>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        danger
        icon="warning"
        title="Confirmar cancelamento?"
        description={`Este ingresso será cancelado e o reembolso de ${formatBRL(ticketValue)} será processado. Esta ação não pode ser desfeita.`}
        confirmLabel="Confirmar cancelamento"
        cancelLabel="Voltar"
        onConfirm={handleConfirm}
      />
    </>
  );
}
