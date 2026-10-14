"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import type { EventDetails } from "@/interfaces/events";
import { isSalesClosed } from "@/lib/event-sales";
import { formatBRL } from "@/lib/format";
import { THREEDS_ENABLED, tokenizeCard, loadTdsScript } from "@/lib/pagarme";
import { promoterTrackingApi } from "@/services/promoters";
import { DEFAULT_GATEWAY_CONFIG, TAXA_PROTECAO, TAXA_SERVICO_DEFAULT, gatewayFor, grossUp, installmentValue, parseGatewayConfig, round2, type GatewayConfig, type PaymentMethod } from "@/lib/payment-fees";
import { LoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { PaymentMethodPicker } from "@/components/payments/payment-method-picker";
import { PixPanel } from "@/components/payments/pix-panel";
import { CardPaymentFields, EMPTY_CARD_FORM, billingAddressFrom, hasBillingAddress, parseExpiry, useViaCep, type CardFormValues } from "@/components/payments/card-payment-fields";
import { ThreeDsContainers } from "@/components/payments/three-ds-containers";
import { authenticate3ds, buildTdsOrderData } from "@/components/payments/three-ds";
import { useDeadlineCountdown } from "@/components/payments/use-deadline-countdown";
import { CpfGate } from "./cpf-gate";
import { EventHeaderCard } from "./event-header-card";
import { OrderSummary, type OrderLine } from "./order-summary";
import { PromoFields, type CupomStatus } from "./promo-fields";
import { ProtectionOption } from "./protection-option";
import { ReservationTimer } from "./reservation-timer";
import { SuccessScreen } from "./success-screen";
import { TermsField } from "./terms-field";
import { CheckoutSkeleton } from "./checkout-skeleton";
import { isGratis, type PromoterPreview, type Ticket } from "./checkout-types";

const CARD_FORM_ID = "checkout-card-form";

type Cta = { label: string; onClick?: () => void; disabled?: boolean; loading?: boolean; formId?: string; icon?: IconName };

/**
 * Checkout do evento. A lógica de pagamento é delicada e está preservada do
 * fluxo original: reserva (/pagamento/reservar + contagem com `expiresAt` do
 * backend), Pix (QR + copia-e-cola + polling de status a cada 3s), cartão com
 * 3DS obrigatório → tokenização direto na Pagar.me → /pagamento/checkout,
 * taxas com gross-up do gateway, cupom, código do promoter e pedido grátis.
 */
export function CheckoutClient() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userId, isAuthenticated, isAuthResolved } = useAuth();

  const [evento, setEvento] = useState<EventDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomDesconto, setCupomDesconto] = useState(0);
  const [cupomStatus, setCupomStatus] = useState<CupomStatus>("idle");

  // Código do promoter — canal de atribuição DIGITADO explicitamente,
  // separado do cupom (cupom é desconto puro; isto também atribui a venda a
  // um promoter). Nunca herda o mecanismo do cupom: input próprio, nunca
  // chega via ?cupom=. A reserva real só é criada depois que este campo
  // "assenta" (debounce/confirmação), pra nunca perder a chance de anexar o
  // código a uma reserva que já foi criada sem ele.
  const [promoterCode, setPromoterCode] = useState("");
  const [promoterCodeConfirmed, setPromoterCodeConfirmed] = useState(false);
  const [promoterCodeChecking, setPromoterCodeChecking] = useState(false);
  const [promoterCodePreview, setPromoterCodePreview] = useState<PromoterPreview | null>(null);

  const [protecaoSelected, setProtecaoSelected] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pixUrl, setPixUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(false);
  const [cpfFromGate, setCpfFromGate] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [parcelas, setParcelas] = useState(1);
  const [gateway, setGateway] = useState<GatewayConfig>(DEFAULT_GATEWAY_CONFIG);
  const [form, setForm] = useState<CardFormValues>(EMPTY_CARD_FORM);

  const { secondsLeft, display: timerDisplay, expired: timerExpired } = useDeadlineCountdown(expiresAt);
  useViaCep(form.cep, setForm);

  // ── URL: itens escolhidos na página do evento (+ cupom opcional) ──────────
  useEffect(() => {
    const itemsParam = searchParams.get("items");
    const cupomParam = searchParams.get("cupom");
    if (itemsParam) {
      const parsed: Record<string, number> = {};
      itemsParam.split(",").forEach((part) => {
        const [tid, qty] = part.split(":");
        if (tid && qty) parsed[tid] = Number(qty);
      });
      setQuantidades(parsed);
    }
    if (cupomParam) setCupomCodigo(cupomParam.toUpperCase());
  }, [searchParams]);

  // ── Cálculos (declarados antes dos efeitos que os usam) ──────────────────
  const selectedItems = Object.entries(quantidades)
    .filter(([, q]) => q > 0)
    .map(([ticketId, quantity]) => ({ ticketId: Number(ticketId), quantity }));

  const isFree =
    Object.values(quantidades).some((q) => q > 0) &&
    selectedItems.every(({ ticketId }) => {
      const t = tickets.find((tk) => tk.id === ticketId);
      return !t || Number(t.valor) === 0;
    });

  useEffect(() => {
    if (!cupomCodigo || !id) {
      setCupomDesconto(0);
      setCupomStatus("idle");
      return;
    }
    setCupomStatus("checking");
    api
      .post("/cupons/validar", { codigo: cupomCodigo, eventoId: Number(id) })
      .then((res) => {
        setCupomDesconto(Number(res.data.desconto ?? 0));
        setCupomStatus("valid");
      })
      .catch(() => {
        setCupomDesconto(0);
        setCupomStatus("invalid");
      });
  }, [cupomCodigo, id]);

  // Prévia do código do promoter (debounce) — só informativa; quem decide
  // de fato se o código vale (e por quanto) é sempre o backend, no momento
  // real da reserva. `promoterCodeConfirmed` é o que libera a criação da
  // reserva — nunca deixamos a reserva "sair na frente" do que o usuário
  // ainda está digitando.
  useEffect(() => {
    setPromoterCodeConfirmed(false);
    const code = promoterCode.trim();
    if (!code) {
      setPromoterCodePreview(null);
      setPromoterCodeChecking(false);
      const t = setTimeout(() => setPromoterCodeConfirmed(true), 400);
      return () => clearTimeout(t);
    }
    setPromoterCodeChecking(true);
    const t = setTimeout(async () => {
      try {
        const items = selectedItems.map(({ ticketId, quantity }) => ({ ticketId, quantity }));
        const preview = await promoterTrackingApi.validateCode(String(id), code, items);
        setPromoterCodePreview(preview);
      } catch {
        setPromoterCodePreview({ valid: false, discountApplicableCents: 0, message: "Não foi possível validar o código agora." });
      } finally {
        setPromoterCodeChecking(false);
        setPromoterCodeConfirmed(true);
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoterCode, id]);

  const loadEvent = useCallback(() => {
    if (!id) return;
    setLoadError(null);
    Promise.all([api.get<EventDetails>(`/eventos/${id}`), api.get(`/eventos/${id}/ingressos`)])
      .then(([evtRes, ingRes]) => {
        setEvento(evtRes.data);
        const raw: Array<Omit<Ticket, "valor"> & { valor: number | string }> = ingRes.data.data ?? ingRes.data ?? [];
        setTickets(raw.map((t) => ({ ...t, valor: Number(t.valor) })));
      })
      .catch((err) => setLoadError(getErrorMessage(err, "Não deu pra carregar o evento.")));
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Configuração de parcelamento (taxas e limite vêm do gateway)
  useEffect(() => {
    api
      .get("/pagamento/info-parcelas")
      .then((res) => setGateway(parseGatewayConfig(res.data)))
      .catch(() => {});
  }, []);

  // Criar reserva quando os dados estiverem prontos — só depois que o campo
  // de código do promoter "assentou" (ver efeito acima), pra sempre poder
  // enviar o código explícito quando o usuário digitou um.
  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || !id || selectedItems.length === 0 || reservationCode || isFree || !promoterCodeConfirmed) return;
    api
      .post("/pagamento/reservar", {
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        promoterCode: promoterCode.trim() || undefined,
      })
      .then((res) => {
        setReservationCode(res.data.reservationCode);
        setExpiresAt(new Date(res.data.expiresAt));
      })
      .catch((err) => toast.error(getErrorMessage(err, "Erro ao reservar ingressos.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthResolved, isAuthenticated, id, selectedItems.length, isFree, promoterCodeConfirmed]);

  // Quando o timer zera, consulta o backend antes de redirecionar
  useEffect(() => {
    if (success || !timerExpired || !expiresAt || !reservationCode) return;
    const code = orderCode ?? reservationCode;
    api
      .get(`/pagamento/status/${code}`)
      .then((res) => {
        const { status, expiresAt: newExpiry } = res.data;
        if (status === "paid") {
          setSuccess(true);
          return;
        }
        if (status === "pending" || status === "reserved") {
          // Backend ainda não expirou (cron atrasado) — atualizar countdown com novo expiresAt
          if (newExpiry) {
            setExpiresAt(new Date(newExpiry));
            return;
          }
        }
        // Expirado ou cancelado
        toast.error(pixUrl ? "Tempo do Pix expirado." : "Tempo de reserva expirado.");
        router.push(`/evento/${id}`);
      })
      .catch(() => {
        toast.error("Reserva expirada.");
        router.push(`/evento/${id}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerExpired, success]);

  // Polling: verifica se o Pix (ou o cartão aguardando webhook) foi pago a cada 3s
  useEffect(() => {
    if (!orderCode || success) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pagamento/status/${orderCode}`);
        if (res.data.status === "paid") {
          clearInterval(interval);
          setSuccess(true);
        } else if (res.data.status === "failed") {
          clearInterval(interval);
          toast.error("Tempo de pagamento expirado. Tente novamente.");
          router.push(`/evento/${id}`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode, success]);

  // Pré-preenche o endereço de cobrança salvo na conta
  useEffect(() => {
    const e = user?.endereco;
    if (!e) return;
    setForm((f) => ({
      ...f,
      cep: f.cep || (e.cep ?? ""),
      street: f.street || (e.logradouro ?? ""),
      number: f.number || (e.numero ?? ""),
      neighborhood: f.neighborhood || (e.bairro ?? ""),
      city: f.city || (e.cidade ?? ""),
      state: f.state || (e.uf ?? ""),
      complemento: f.complemento || (e.complemento ?? ""),
    }));
  }, [user?.endereco]);

  useEffect(() => {
    if (user !== null && !user.cpf && !cpfFromGate) setNeedsCpf(true);
  }, [user, cpfFromGate]);

  // ── Cálculos (continuação) ───────────────────────────────────────────────
  const precoComDesconto = (valor: number) => (cupomDesconto > 0 ? valor * (1 - cupomDesconto / 100) : valor);

  const subtotalBruto = round2(
    selectedItems.reduce((s, { ticketId, quantity }) => {
      const t = tickets.find((tk) => tk.id === ticketId);
      return s + Number(t?.valor ?? 0) * quantity;
    }, 0),
  );
  const subtotal = round2(
    selectedItems.reduce((s, { ticketId, quantity }) => {
      const t = tickets.find((tk) => tk.id === ticketId);
      return s + precoComDesconto(Number(t?.valor ?? 0)) * quantity;
    }, 0),
  );
  const valorDesconto = round2(subtotalBruto - subtotal);

  const taxaServicoRate = evento?.taxaServicoPercent !== undefined ? evento.taxaServicoPercent / 100 : TAXA_SERVICO_DEFAULT;
  const taxaServico = round2(subtotal * taxaServicoRate);
  const taxaProtecao = round2(subtotal * TAXA_PROTECAO);
  const subtotalBase = round2(subtotal + taxaServico + (protecaoSelected && !isFree ? taxaProtecao : 0));

  // Gross-up: só aplica taxa de processamento após escolher a forma de pagamento
  const { pct: gatewayPct, fixed: gatewayFixed } = gatewayFor(gateway, paymentMethod, parcelas);
  const total = isFree ? 0 : grossUp(subtotalBase, gatewayPct, gatewayFixed);
  const taxaProcessamento = isFree ? 0 : round2(total - subtotalBase);

  const installments = Array.from({ length: gateway.maxParcelas }, (_, i) => i + 1).map((n) => ({
    n,
    label: `${n}x de ${formatBRL(installmentValue(gateway, subtotalBase, n))}${n <= gateway.maxSemJuros ? " sem juros" : ""}`,
  }));
  const installmentsHint = gateway.maxParcelas > 1 ? `ou até ${gateway.maxParcelas}x de ${formatBRL(installmentValue(gateway, subtotalBase, gateway.maxParcelas))}` : null;

  const lines: OrderLine[] = selectedItems
    .map(({ ticketId, quantity }) => {
      const t = tickets.find((tk) => tk.id === ticketId);
      if (!t) return null;
      const unitFinal = precoComDesconto(t.valor);
      return { id: t.id, nome: t.nome, lote: t.lote, quantity, lineTotal: round2(unitFinal * quantity), lineOriginal: round2(t.valor * quantity), gratis: isGratis(unitFinal) };
    })
    .filter((l): l is OrderLine => l !== null);

  // ── Ações ────────────────────────────────────────────────────────────────
  function handleSelectPayment(method: PaymentMethod | null) {
    if (!isAuthResolved) return;
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setPaymentMethod(method);
    setPixUrl(null);
    setPayError(null);
  }

  async function handleFreeCheckout() {
    setProcessing(true);
    setPayError(null);
    try {
      await api.post("/pagamento/checkout", {
        type: "pix",
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
      });
      setSuccess(true);
    } catch (err) {
      setPayError(getErrorMessage(err, "Erro ao confirmar ingressos."));
    } finally {
      setProcessing(false);
    }
  }

  async function handlePixCheckout() {
    if (pixUrl || !reservationCode) return;
    setProcessing(true);
    setPayError(null);
    try {
      const res = await api.post("/pagamento/checkout", {
        type: "pix",
        reservationCode,
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
        protecao: protecaoSelected,
      });
      if (res.data.pixUrl) setPixUrl(res.data.pixUrl);
      if (res.data.orderCode) setOrderCode(res.data.orderCode);
      if (res.data.expiresAt) setExpiresAt(new Date(res.data.expiresAt));
    } catch (err) {
      setPayError(getErrorMessage(err, "Erro ao gerar o Pix."));
    } finally {
      setProcessing(false);
    }
  }

  async function handleCardCheckout(e: FormEvent) {
    e.preventDefault();
    if (!reservationCode) {
      toast.error("Reserva não encontrada. Recarregue a página.");
      return;
    }
    if (!hasBillingAddress(form)) {
      toast.error("Preencha o endereço de cobrança do cartão (CEP, número, cidade e UF).");
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

      // ── 1) Autenticação 3DS (obrigatória) ─────────────────────────────
      if (THREEDS_ENABLED) {
        await loadTdsScript();
        const { data: tokenRes } = await api.get("/pagamento/tds-token");
        const orderData = buildTdsOrderData({
          card: { number: cardNumber, holder_name: form.cardName, exp_month: month, exp_year: expYear, billing_address: billingAddress },
          amountCents: Math.round(total * 100),
          customer: {
            name: user?.nome ?? form.cardName,
            email: user?.email ?? "",
            document: (user?.cpf ?? cpfFromGate ?? "").replace(/\D/g, ""),
            code: String(userId ?? ""),
            phone: user?.telefone,
          },
          items: selectedItems.map(({ ticketId }) => ({ description: "Ingresso", code: String(ticketId) })),
        });
        const tds = await authenticate3ds(tokenRes.tdsToken, orderData);
        tdsTransactionId = tds.tdsTransactionId;
        tdsTransStatus = tds.tdsTransStatus;
      }

      // ── 2) Tokeniza o cartão (número não passa pelo nosso servidor) ──
      const cardToken = await tokenizeCard({ number: cardNumber, holder_name: form.cardName, exp_month: month, exp_year: expYear, cvv: form.cvv });

      // ── 3) Checkout com token (+ 3DS) ────────────────────────────────
      const res = await api.post("/pagamento/checkout", {
        type: "card",
        reservationCode,
        items: selectedItems,
        codigoCupom: cupomCodigo || undefined,
        termsVersion: "v1",
        termsAcceptedAt: new Date().toISOString(),
        parcelas,
        protecao: protecaoSelected,
        cardToken,
        address: { cep: form.cep, state: form.state, city: form.city, number: form.number, neighborhood: form.neighborhood, street: form.street, complemento: form.complemento },
        tdsTransactionId,
        tdsTransStatus,
        tdsVersion: tdsTransactionId ? "2.2.0" : undefined,
      });
      // Ingresso só é liberado quando a Pagar.me confirmar (webhook).
      // Acompanhamos o status até "paid".
      if (res.data.orderCode) {
        setOrderCode(res.data.orderCode);
        if (res.data.expiresAt) setExpiresAt(new Date(res.data.expiresAt));
        setConfirming(true);
      } else if (res.data.paid) {
        setSuccess(true);
      }
    } catch (err) {
      setPayError(getErrorMessage(err, "Erro ao processar pagamento. Verifique os dados do cartão."));
    } finally {
      setProcessing(false);
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState title="Não deu pra carregar o evento" description={loadError} onRetry={loadEvent} />
      </div>
    );
  }
  if (!evento) return <CheckoutSkeleton />;

  if (needsCpf) {
    return (
      <CpfGate
        onComplete={(cpf) => {
          setCpfFromGate(cpf);
          setNeedsCpf(false);
        }}
      />
    );
  }

  if (success) {
    const items = lines.map((l) => ({ ticket: tickets.find((t) => t.id === l.id)!, qty: l.quantity }));
    return <SuccessScreen evento={evento} items={items} total={total} isFree={isFree} />;
  }

  // Vendas encerram 2h antes do início e o backend recusa reserva nova a
  // partir daí. Quem JÁ tem reserva/pagamento em andamento (iniciado antes
  // do prazo) continua até o fim do próprio prazo, como no backend.
  if (isSalesClosed(evento) && !reservationCode && !orderCode && !pixUrl) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="clock"
          title="Vendas encerradas"
          description={`As vendas de ${evento.nome} terminaram 2 horas antes do início do evento.`}
          action={
            <Button asChild variant="outline">
              <Link href={`/evento/${evento.slug ?? evento.id}`}>Voltar para o evento</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // ── CTA (mesmo botão na barra fixa do celular e na coluna do desktop) ───
  const cta: Cta = (() => {
    if (!isAuthResolved) return { label: "Carregando…", disabled: true, loading: true };
    if (!isAuthenticated) return { label: "Entrar pra continuar", onClick: () => setShowLoginModal(true), icon: "login" };
    if (selectedItems.length === 0) return { label: "Nenhum ingresso", disabled: true };
    if (isFree) return { label: "Confirmar ingressos", onClick: handleFreeCheckout, disabled: processing || !termsAccepted, loading: processing, icon: "ticket" };
    if (timerExpired) return { label: "Tempo esgotado", disabled: true };
    if (paymentMethod === "pix") {
      if (pixUrl) return { label: "Aguardando pagamento", disabled: true, loading: true };
      return { label: `Gerar Pix · ${formatBRL(total)}`, onClick: handlePixCheckout, disabled: processing || !termsAccepted || !reservationCode, loading: processing, icon: "pix" };
    }
    if (paymentMethod === "card") {
      return { label: confirming ? "Confirmando…" : `Pagar ${formatBRL(total)}`, formId: CARD_FORM_ID, disabled: processing || confirming || !termsAccepted || !reservationCode, loading: processing || confirming, icon: "lock" };
    }
    return { label: "Escolha como pagar", disabled: true };
  })();

  const ctaButton = (
    <Button type={cta.formId ? "submit" : "button"} form={cta.formId} size="full" leftIcon={cta.icon} onClick={cta.onClick} disabled={cta.disabled} loading={cta.loading}>
      {cta.label}
    </Button>
  );

  const showReserving = isAuthenticated && !isFree && selectedItems.length > 0 && !reservationCode && !timerExpired;
  const expiringSoon = !timerExpired && secondsLeft !== null && secondsLeft <= 120 && !!reservationCode;
  const eventHref = `/evento/${evento.slug ?? evento.id}`;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 lg:px-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          {/* ── Coluna principal ─────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-title font-semibold tracking-tight text-foreground">Finalizar pedido</h1>
              {!isFree && expiresAt ? <ReservationTimer display={timerDisplay} secondsLeft={secondsLeft} expired={timerExpired} /> : null}
            </div>

            <EventHeaderCard evento={evento} />

            {selectedItems.length === 0 ? (
              <Callout
                tone="warning"
                title="Nenhum ingresso selecionado"
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href={eventHref}>Escolher</Link>
                  </Button>
                }
              >
                Volte à página do evento e escolha quantos ingressos você quer.
              </Callout>
            ) : null}

            {isAuthResolved && !isAuthenticated ? (
              <Callout
                tone="info"
                icon="user-circle"
                title="Entre pra reservar seus ingressos"
                action={
                  <Button size="sm" onClick={() => setShowLoginModal(true)}>
                    Entrar
                  </Button>
                }
              >
                A reserva segura o preço e os ingressos por alguns minutos enquanto você paga.
              </Callout>
            ) : null}

            {showReserving ? (
              <Callout tone="neutral" icon="loader">
                <span className="inline-flex items-center gap-2">
                  <Icon name="loader" size={12} className="animate-spin" />
                  Reservando seus ingressos…
                </span>
              </Callout>
            ) : null}

            {timerExpired ? (
              <Callout
                tone="danger"
                title="Tempo esgotado"
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href={eventHref}>Voltar ao evento</Link>
                  </Button>
                }
              >
                Sua reserva expirou e os ingressos voltaram pra venda. Escolha de novo pra continuar.
              </Callout>
            ) : expiringSoon ? (
              <Callout tone="warning" icon="clock" title={`Sua reserva expira em ${timerDisplay}`}>
                Finalize o pagamento pra não perder os ingressos.
              </Callout>
            ) : null}

            <OrderSummary className="lg:hidden" lines={lines} subtotal={subtotal} valorDesconto={valorDesconto} cupomCodigo={cupomCodigo} taxaServico={taxaServico} taxaProtecao={protecaoSelected && !isFree ? taxaProtecao : null} taxaProcessamento={taxaProcessamento} total={total} isFree={isFree} installmentsHint={paymentMethod === "card" && parcelas > 1 ? `${parcelas}x de ${formatBRL(total / parcelas)}` : installmentsHint} />

            {!isFree ? <PromoFields cupomCodigo={cupomCodigo} cupomDesconto={cupomDesconto} cupomStatus={cupomStatus} onApplyCupom={setCupomCodigo} promoterCode={promoterCode} onPromoterCodeChange={setPromoterCode} promoterChecking={promoterCodeChecking} promoterPreview={promoterCodePreview} promoterLocked={Boolean(reservationCode)} /> : null}

            {!isFree && taxaProtecao > 0 ? <ProtectionOption selected={protecaoSelected} onChange={setProtecaoSelected} price={taxaProtecao} /> : null}

            {!isFree && selectedItems.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Como você quer pagar?</h2>
                <PaymentMethodPicker value={paymentMethod} onChange={handleSelectPayment} maxParcelas={gateway.maxParcelas} disabled={Boolean(pixUrl) || confirming || timerExpired} />

                {paymentMethod === "pix" && pixUrl ? <PixPanel code={pixUrl} amountLabel={formatBRL(total)} meta={expiresAt ? `expira em ${timerDisplay}` : undefined} /> : null}

                {paymentMethod === "card" ? (
                  <Card className="p-4 sm:p-5">
                    <form id={CARD_FORM_ID} onSubmit={handleCardCheckout}>
                      <CardPaymentFields form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} parcelas={parcelas} onParcelasChange={setParcelas} installments={installments} disabled={processing || confirming} />
                    </form>
                    {confirming ? (
                      <Callout tone="info" className="mt-4" title="Confirmando o pagamento com o banco">
                        Não feche esta tela — leva só alguns segundos.
                      </Callout>
                    ) : null}
                    <p className="mt-4 flex items-center gap-1.5 text-caption text-subtle-foreground">
                      <Icon name="lock" size={11} />
                      Os dados do cartão vão direto pra Pagar.me — não passam pela Nokta.
                    </p>
                  </Card>
                ) : null}
              </section>
            ) : null}

            {payError ? (
              <Callout
                tone="danger"
                title="O pagamento não foi concluído"
                action={
                  <Button size="sm" variant="outline" onClick={() => setPayError(null)}>
                    Tentar de novo
                  </Button>
                }
              >
                {payError}
              </Callout>
            ) : null}

            {selectedItems.length > 0 ? <TermsField checked={termsAccepted} onChange={setTermsAccepted} /> : null}
          </div>

          {/* ── Coluna direita (desktop) ──────────────────────────────── */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <OrderSummary lines={lines} subtotal={subtotal} valorDesconto={valorDesconto} cupomCodigo={cupomCodigo} taxaServico={taxaServico} taxaProtecao={protecaoSelected && !isFree ? taxaProtecao : null} taxaProcessamento={taxaProcessamento} total={total} isFree={isFree} installmentsHint={paymentMethod === "card" && parcelas > 1 ? `${parcelas}x de ${formatBRL(total / parcelas)}` : installmentsHint} footer={ctaButton} />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-caption text-subtle-foreground">
              <Icon name="shield" size={11} />
              Pagamento seguro · Pix ou cartão com 3DS
            </p>
          </aside>
        </div>
      </div>

      {/* ── Barra fixa (celular): total + ação ─────────────────────────── */}
      <div data-fixed-bottom-purchase-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">Total</p>
            <p className={`text-lg font-bold leading-tight tnum ${isFree ? "text-success" : "text-foreground"}`}>{isFree ? "Grátis" : formatBRL(total)}</p>
            {paymentMethod === "card" && parcelas > 1 ? <p className="text-caption text-muted-foreground tnum">{parcelas}x de {formatBRL(total / parcelas)}</p> : null}
          </div>
          <div className="w-[58%] max-w-[250px]">{ctaButton}</div>
        </div>
      </div>

      {showLoginModal ? <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} /> : null}

      <ThreeDsContainers />
    </>
  );
}
