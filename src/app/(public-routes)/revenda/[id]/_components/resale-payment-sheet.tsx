"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { THREEDS_ENABLED, tokenizeCard, loadTdsScript } from "@/lib/pagarme";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DEFAULT_GATEWAY_CONFIG, gatewayFor, grossUp, installmentValue, parseGatewayConfig, round2, type GatewayConfig, type PaymentMethod } from "@/lib/payment-fees";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentMethodPicker } from "@/components/payments/payment-method-picker";
import { PixPanel } from "@/components/payments/pix-panel";
import { CardPaymentFields, EMPTY_CARD_FORM, billingAddressFrom, hasBillingAddress, parseExpiry, useViaCep, type CardFormValues } from "@/components/payments/card-payment-fields";
import { ThreeDsContainers } from "@/components/payments/three-ds-containers";
import { authenticate3ds, buildTdsOrderData } from "@/components/payments/three-ds";

const CARD_FORM_ID = "resale-card-form";

function Row({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 text-sm", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>
      <span>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}

type Props = {
  resaleId: number;
  buyerPrice: number;
  /** Taxa de serviço da Nokta (%), a mesma da venda comum do evento. */
  taxaServicoPercent?: number;
  eventoNome: string;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Pagamento de um ingresso em revenda — mesmo fluxo do checkout do evento
 * (Pix com polling, cartão com 3DS obrigatório + tokenização na Pagar.me,
 * comprador paga a taxa do gateway por gross-up). Folha inferior no celular,
 * diálogo centralizado no desktop. A transferência do ingresso é feita pelo
 * webhook; aqui só acompanhamos o status.
 */
export function ResalePaymentSheet({ resaleId, buyerPrice, taxaServicoPercent = 10, eventoNome, onClose, onSuccess }: Props) {
  const { user, userId } = useAuth();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pixUrl, setPixUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<GatewayConfig>(DEFAULT_GATEWAY_CONFIG);
  const [parcelas, setParcelas] = useState(1);
  const [form, setForm] = useState<CardFormValues>(EMPTY_CARD_FORM);

  useViaCep(form.cep, setForm);

  useEffect(() => {
    api
      .get("/pagamento/info-parcelas")
      .then((res) => setGateway(parseGatewayConfig(res.data)))
      .catch(() => {});
  }, []);

  // Polling do Pix / cartão aguardando webhook (só UX — a transferência é feita pelo webhook)
  useEffect(() => {
    if (!orderCode) return;
    const t = setInterval(async () => {
      try {
        const res = await api.get(`/revenda/pagamento/status/${orderCode}`);
        if (res.data.status === "sold") {
          clearInterval(t);
          onSuccess();
        } else if (res.data.status === "expired") {
          clearInterval(t);
          toast.error("Tempo do Pix expirado. Tente novamente.");
          onClose();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);

  // ── Cálculo com gross-up (comprador paga a taxa) ──
  // Mesma conta da venda comum: ingresso + taxa de serviço, depois o processamento.
  const taxaServico = Math.round(buyerPrice * taxaServicoPercent) / 100;
  const subtotal = round2(buyerPrice + taxaServico);
  const { pct, fixed } = gatewayFor(gateway, method, parcelas);
  const total = grossUp(subtotal, pct, fixed);
  const taxaProcessamento = round2(total - subtotal);
  const parcelaValor = method === "card" ? total / parcelas : total;
  const installments = Array.from({ length: gateway.maxParcelas }, (_, i) => i + 1).map((n) => ({
    n,
    label: `${n}x de ${formatBRL(installmentValue(gateway, subtotal, n))}${n <= gateway.maxSemJuros ? " sem juros" : ""}`,
  }));
  const confirmingCard = Boolean(orderCode) && !pixUrl;

  async function handlePix() {
    setProcessing(true);
    setPayError(null);
    try {
      const res = await api.post(`/revenda/${resaleId}/comprar`, { type: "pix" });
      if (res.data.pixUrl) setPixUrl(res.data.pixUrl);
      if (res.data.orderCode) setOrderCode(res.data.orderCode);
    } catch (err) {
      setPayError(getErrorMessage(err, "Erro ao gerar o Pix."));
    } finally {
      setProcessing(false);
    }
  }

  async function handleCard(e: FormEvent) {
    e.preventDefault();
    if (!hasBillingAddress(form)) {
      toast.error("Preencha o endereço de cobrança (CEP, número, cidade e UF).");
      return;
    }
    setProcessing(true);
    setPayError(null);
    try {
      const { month, year: expYear } = parseExpiry(form.expiryDate);
      const cardNumber = form.cardNumber.replace(/\s+/g, "");
      const billingAddress = billingAddressFrom(form);

      let tdsTransactionId: string | undefined;
      let tdsTransStatus: string | undefined;

      if (THREEDS_ENABLED) {
        await loadTdsScript();
        const { data: tokenRes } = await api.get("/pagamento/tds-token");
        const orderData = buildTdsOrderData({
          card: { number: cardNumber, holder_name: form.cardName, exp_month: month, exp_year: expYear, billing_address: billingAddress },
          amountCents: Math.round(total * 100),
          customer: { name: user?.nome ?? form.cardName, email: user?.email ?? "", document: (user?.cpf ?? "").replace(/\D/g, ""), code: String(userId ?? ""), phone: user?.telefone },
          items: [{ description: "Revenda", code: String(resaleId) }],
        });
        const tds = await authenticate3ds(tokenRes.tdsToken, orderData);
        tdsTransactionId = tds.tdsTransactionId;
        tdsTransStatus = tds.tdsTransStatus;
      }

      const cardToken = await tokenizeCard({ number: cardNumber, holder_name: form.cardName, exp_month: month, exp_year: expYear, cvv: form.cvv });

      const res = await api.post(`/revenda/${resaleId}/comprar`, {
        type: "card",
        cardToken,
        parcelas,
        tdsTransactionId,
        tdsTransStatus,
        tdsVersion: tdsTransactionId ? "2.2.0" : undefined,
        address: { cep: form.cep, state: form.state, city: form.city, number: form.number, neighborhood: form.neighborhood, street: form.street, complemento: form.complemento },
      });
      if (res.data.paid) onSuccess();
      else if (res.data.orderCode) setOrderCode(res.data.orderCode); // aguarda webhook
    } catch (err) {
      setPayError(getErrorMessage(err, "Erro ao processar pagamento. Verifique os dados do cartão."));
    } finally {
      setProcessing(false);
    }
  }

  const busy = processing || confirmingCard;

  return (
    <Dialog open onOpenChange={(open) => (!open && !processing ? onClose() : null)}>
      <DialogContent size="md" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagar ingresso</DialogTitle>
          <DialogDescription className="truncate">{eventoNome}</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-5">
          {pixUrl ? (
            <PixPanel code={pixUrl} amountLabel={formatBRL(total)} />
          ) : (
            <>
              <PaymentMethodPicker
                value={method}
                onChange={(m) => {
                  setMethod(m);
                  setPayError(null);
                }}
                maxParcelas={gateway.maxParcelas}
                disabled={busy}
              />

              {method ? (
                <div className="surface-inset space-y-2 rounded-xl p-4">
                  <Row label="Ingresso" value={formatBRL(buyerPrice)} />
                  {taxaServico > 0 ? <Row label="Taxa de serviço" value={formatBRL(taxaServico)} /> : null}
                  <Row label="Taxa de processamento" value={formatBRL(taxaProcessamento)} />
                  <div className="border-t border-border pt-2">
                    <Row label="Total" value={<span className="text-brand">{formatBRL(total)}</span>} strong />
                    {method === "card" && parcelas > 1 ? <p className="mt-0.5 text-right text-caption text-muted-foreground tnum">{parcelas}x de {formatBRL(parcelaValor)}</p> : null}
                  </div>
                </div>
              ) : null}

              {method === "card" ? (
                <form id={CARD_FORM_ID} onSubmit={handleCard}>
                  <CardPaymentFields idPrefix="resale" form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} parcelas={parcelas} onParcelasChange={setParcelas} installments={installments} disabled={busy} />
                </form>
              ) : null}

              {confirmingCard ? (
                <Callout tone="info" title="Confirmando o pagamento com o banco">
                  Não feche esta tela — o ingresso aparece na sua conta assim que o banco confirmar.
                </Callout>
              ) : null}

              {payError ? (
                <Callout tone="danger" title="O pagamento não foi concluído">
                  {payError}
                </Callout>
              ) : null}
            </>
          )}
          <ThreeDsContainers />
        </DialogBody>

        {!pixUrl && method ? (
          <DialogFooter>
            {method === "pix" ? (
              <Button size="lg" leftIcon="pix" className="w-full sm:w-auto" onClick={handlePix} loading={processing} disabled={busy}>
                Gerar Pix · {formatBRL(total)}
              </Button>
            ) : (
              <Button type="submit" form={CARD_FORM_ID} size="lg" leftIcon="lock" className="w-full sm:w-auto" loading={busy} disabled={busy}>
                Pagar {formatBRL(total)}
              </Button>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
