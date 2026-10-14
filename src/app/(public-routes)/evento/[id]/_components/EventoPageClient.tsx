"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { EventDetails } from "@/interfaces/events";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { isSalesClosed } from "@/lib/event-sales";
import { cityLabel, formatEventDate, formatTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { getPublicTicketsUrl } from "@/lib/surfaces";
import { promoterTrackingApi } from "@/services/promoters";
import { LoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/badge";
import { EventBanner } from "./event-banner";
import { EventContact, EventPolicies } from "./event-info";
import { EventLocation } from "./event-location";
import { EventProgram, parseProgramacao } from "./event-program";
import { DEFAULT_INSTALLMENT_RULES, calcTaxa, maxInstallmentLabel, type InstallmentRules, type Ticket } from "./event-pricing";
import { EventoSkeleton } from "./evento-skeleton";
import { InstallmentsSheet, type InstallmentRow } from "./installments-sheet";
import { ClosedCallout, PurchaseSummary, TicketPanel, type ClosedReason, type CouponState, type PurchaseState } from "./ticket-panel";
import { VipClaimCard } from "./VipClaimCard";

function Chip({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-pill bg-surface-2 px-3 py-1.5 text-caption font-medium text-foreground">
      <Icon name={icon} size={11} className="shrink-0 text-muted-foreground" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * Página do evento (também renderizada em /vip/<slug>, em modo lista VIP).
 * Celular: banner inteiro, título, chips, lotes em linhas e barra fixa de
 * compra. Desktop: conteúdo à esquerda, card de compra sticky à direita.
 */
export default function EventoPageClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  // Link da lista VIP: /vip/<evento> (esta mesma página). `?vip=` é o formato
  // dos primeiros links e continua aceito.
  const isVipRoute = pathname.startsWith("/vip/");
  const vipKey = isVipRoute ? String(id) : searchParams.get("vip");
  const [evento, setEvento] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // Relógio da tela: reavalia o fim das vendas sem precisar recarregar (quem
  // abriu a página antes do prazo vê "Vendas encerradas" quando ele chega).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [allTickets, setTickets] = useState<Ticket[]>([]);
  // Quem chegou pelo link da lista VIP e ainda pode retirar (ou já retirou)
  // não vê os lotes pagos: ao lado de uma entrada gratuita eles só confundem.
  const [vipActive, setVipActive] = useState(() => pathname.startsWith("/vip/") || !!searchParams.get("vip"));
  const tickets = vipActive ? [] : allTickets;
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; desconto: number } | null>(null);
  const [rules, setRules] = useState<InstallmentRules>(DEFAULT_INSTALLMENT_RULES);
  const [parcelasSheet, setParcelasSheet] = useState(false);
  const [parcelasData, setParcelasData] = useState<InstallmentRow[]>([]);
  const [parcelasLoading, setParcelasLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get<EventDetails>(`/eventos/${id}`), api.get(`/eventos/${id}/ingressos`), api.get("/pagamento/info-parcelas").catch(() => ({ data: { maxParcelasSemJuros: 0 } }))])
      .then(([evtRes, ingRes, parcelasRes]) => {
        setEvento(evtRes.data);
        const payload = ingRes.data as { data?: Ticket[] } | Ticket[];
        const raw: Ticket[] = Array.isArray(payload) ? payload : (payload.data ?? []);
        setTickets(raw.map((t) => ({ ...t, valor: Number(t.valor) })));
        setRules({
          maxSemJuros: parcelasRes.data.maxParcelasSemJuros ?? 0,
          maxParcelas: parcelasRes.data.maxParcelas ?? 12,
          cardRateBps: parcelasRes.data.cardRateBps ?? [],
          cardFixedCents: parcelasRes.data.cardFixedCents ?? 0,
        });
      })
      .catch((err: unknown) => toast.error(err instanceof Error && err.message ? err.message : "Erro ao carregar evento."))
      .finally(() => setLoading(false));
  }, [id]);

  // Tracking de link de promoter (?ref=): nunca redireciona, nunca bloqueia
  // o carregamento da página, nunca vira loop (depende só de `id`, não de
  // `searchParams` — a limpeza da URL abaixo não re-dispara isto). O
  // backend é quem seta o cookie HttpOnly de atribuição; aqui só avisamos
  // que o clique aconteceu e seguimos renderizando a página canônica normal.
  useEffect(() => {
    if (!id) return;
    const ref = searchParams.get("ref");
    if (!ref) return;

    promoterTrackingApi
      .resolveLink(ref, String(id), {
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      })
      .catch(() => {});

    const cleanParams = new URLSearchParams(searchParams.toString());
    ["ref", "utm_source", "utm_medium", "utm_campaign"].forEach((key) => cleanParams.delete(key));
    const query = cleanParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function openParcelasSheet(subtotalReais: number) {
    const subtotalCents = Math.round(subtotalReais * 100);
    if (subtotalCents <= 0) return;
    setParcelasSheet(true);
    setParcelasLoading(true);
    try {
      const { data } = await api.get(`/pagamento/tabela-parcelas?subtotalCents=${subtotalCents}`);
      setParcelasData(data.card ?? []);
    } catch {
      setParcelasData([]);
    } finally {
      setParcelasLoading(false);
    }
  }

  function changeQty(ticketId: number, delta: number, max: number) {
    setQuantities((prev) => {
      const cur = prev[ticketId] ?? 0;
      const next = Math.min(max, Math.max(0, cur + delta));
      return { ...prev, [ticketId]: next };
    });
  }

  function precoComDesconto(valor: number) {
    if (!couponApplied) return valor;
    return valor * (1 - couponApplied.desconto / 100);
  }

  const totalSelecionado = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalValor = tickets.reduce((sum, tk) => sum + precoComDesconto(tk.valor) * (quantities[tk.id] ?? 0), 0);
  // Taxa de serviço do workspace dono do evento (10% quando a API não informa).
  const taxaPercent = evento?.taxaServicoPercent ?? 10;
  const totalComTaxa = totalValor + calcTaxa(totalValor, taxaPercent);

  async function handleAplicarCupom() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await api.post("/cupons/validar", { codigo: couponCode.trim(), eventoId: id });
      const data = res.data;
      setCouponApplied({ code: couponCode.trim().toUpperCase(), desconto: Number(data.desconto ?? data.percentual ?? 0) });
      setCouponOpen(false);
      toast.success(`Cupom ${couponCode.trim().toUpperCase()} aplicado!`);
    } catch {
      setCouponError("Cupom inválido ou expirado.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoverCupom() {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  }

  if (loading) return <EventoSkeleton />;

  if (!evento) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <EmptyState
          icon="ticket"
          title="Evento não encontrado"
          description="Esse link pode ter mudado ou o evento saiu do ar."
          action={
            <Button asChild variant="contrast" shape="pill">
              <Link href="/eventos">Ver eventos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const thumbs = (evento.thumbnails ?? []).map((t) => resolveThumbnailUrl(t, "") ?? "").filter(Boolean);
  const images = thumbs.length > 0 ? thumbs : [MEDIA_FALLBACK];
  const timeStr = formatTime(evento.horario);
  const city = cityLabel(evento.endereco);
  const addr = evento.endereco;
  // Sempre o slug persistido no banco (nunca gerado no frontend a partir do
  // nome) — e sempre a URL canônica absoluta, nunca window.location.href:
  // quem chegou pela URL antiga com id (link velho, compartilhamento
  // anterior) não deve propagar o id ao compartilhar de novo.
  const canonicalEventUrl = getPublicTicketsUrl(`/evento/${evento.slug ?? evento.id}`);

  const isEventPast = (() => {
    if (!evento.data) return false;
    const eventDate = new Date(evento.data.split("T")[0] + "T23:59:59");
    return eventDate < new Date();
  })();
  const isCancelled = evento.status === 3;
  const isEncerrado = isEventPast || isCancelled;
  // Vendas encerram 2h antes do início (mesma regra do backend, que recusa a
  // reserva). Sem isto a tela deixava escolher ingresso e ir até o pagamento.
  const vendasEncerradas = !isEncerrado && isSalesClosed(evento, now);
  const closedReason: ClosedReason = isCancelled ? "cancelado" : isEventPast ? "encerrado" : vendasEncerradas ? "vendas" : null;

  function buildCheckoutUrl() {
    const base = `/evento/${evento!.slug ?? evento!.id}/checkout`;
    const selected = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (selected.length === 0) return base;
    const params = new URLSearchParams();
    params.set("items", selected.map(([tid, qty]) => `${tid}:${qty}`).join(","));
    if (couponApplied) params.set("cupom", couponApplied.code);
    return `${base}?${params.toString()}`;
  }

  function continueToCheckout() {
    if (totalSelecionado === 0 || closedReason) return;
    // Gate de login logo ao continuar (antes do checkout).
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    router.push(buildCheckoutUrl());
  }

  // Na tela da lista VIP o botão vira "Convidar amigos" e leva o link da
  // lista, não o da página com os ingressos à venda.
  const shareLabel = vipActive ? "Convidar amigos" : "Compartilhar";
  function handleShare() {
    const url = vipActive ? getPublicTicketsUrl(`/vip/${evento!.slug ?? evento!.id}`) : canonicalEventUrl;
    if (navigator.share) {
      navigator.share({ title: evento!.nome, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copiado!");
    }
  }

  const coupon: CouponState = {
    applied: couponApplied,
    open: couponOpen,
    code: couponCode,
    loading: couponLoading,
    error: couponError,
    onOpen: () => setCouponOpen(true),
    onClose: () => {
      setCouponOpen(false);
      setCouponError("");
    },
    onCodeChange: (code) => {
      setCouponCode(code);
      setCouponError("");
    },
    onApply: handleAplicarCupom,
    onRemove: handleRemoverCupom,
  };

  const purchase: PurchaseState = {
    totalSelecionado,
    totalValor,
    totalComTaxa,
    parcelaLabel: maxInstallmentLabel(totalComTaxa, rules),
    closedReason,
    onOpenInstallments: openParcelasSheet,
    onContinue: continueToCheckout,
  };

  const statusBadge = isCancelled ? (
    <StatusBadge tone="danger">Cancelado</StatusBadge>
  ) : isEventPast ? (
    <StatusBadge tone="neutral">Encerrado</StatusBadge>
  ) : vendasEncerradas ? (
    <StatusBadge tone="warning">Vendas encerradas</StatusBadge>
  ) : null;

  const programItems = parseProgramacao(evento.programacao ?? "");
  const hasPolicies = Boolean(evento.classificacaoEtaria || evento.politicaMeiaEntrada || evento.politicaCancelamento);
  const hasContact = Boolean(evento.whatsapp || evento.email || evento.instagram);

  return (
    <div className="relative pb-10">
      {/* Desktop: o pôster desfocado atrás do topo, como um palco. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[520px] overflow-hidden lg:block" aria-hidden>
        <Image src={images[0]} alt="" fill sizes="100vw" unoptimized className="scale-110 object-cover blur-3xl brightness-[0.35] saturate-150" />
        <div className="grain absolute inset-0" />
        <div className="hero-fade absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-2 lg:px-6 lg:pt-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-10">
          {/* Banner + título */}
          <header className="lg:col-start-1 lg:row-start-1">
            <EventBanner images={images} alt={evento.nome} badge={statusBadge} />
            <div className="mt-5 flex items-start gap-3 px-1">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[2rem] uppercase leading-[0.95] text-foreground lg:text-[2.75rem]">{evento.nome}</h1>
                <p className="mt-2 text-[15px] font-semibold text-brand lg:text-lg">{formatEventDate(evento.data) || "Data a confirmar"}</p>
              </div>
              <Button variant="outline" size="icon" shape="pill" aria-label={shareLabel} onClick={handleShare} className="size-11 shrink-0 bg-surface/60 backdrop-blur-md">
                <Icon name="share" size={15} />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 px-1">
              {evento.local || city ? (
                <Chip icon="map-pin">
                  {evento.local}
                  {evento.local && city ? " · " : ""}
                  {city}
                </Chip>
              ) : null}
              {timeStr ? <Chip icon="clock">Abre às {timeStr}</Chip> : null}
              {evento.classificacaoEtaria ? <Chip icon="id-card">{evento.classificacaoEtaria}</Chip> : null}
            </div>
          </header>

          {/* Compra (ou lista VIP): sticky no desktop */}
          <aside className="mt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <div className="space-y-4 lg:sticky lg:top-[88px]">
              {vipKey ? <VipClaimCard vipKey={vipKey} eventId={Number(evento.id)} returnPath={`/vip/${evento.slug ?? evento.id}`} onActiveChange={setVipActive} /> : null}
              {tickets.length > 0 ? <TicketPanel id="ingressos" tickets={tickets} quantities={quantities} onChangeQty={changeQty} taxaPercent={taxaPercent} rules={rules} precoComDesconto={precoComDesconto} coupon={coupon} purchase={purchase} /> : null}
              {tickets.length === 0 && !vipKey && closedReason ? <ClosedCallout reason={closedReason} /> : null}
              {tickets.length === 0 && !vipKey && !closedReason ? <EmptyState compact icon="ticket" title="Ingressos em breve" description="O produtor ainda não abriu as vendas por aqui." /> : null}
              <Button variant="outline" size="full" shape="pill" leftIcon="share" onClick={handleShare} className="hidden lg:inline-flex">
                {vipActive ? shareLabel : "Compartilhar evento"}
              </Button>
            </div>
          </aside>

          {/* Conteúdo */}
          <div className="mt-10 space-y-10 lg:col-start-1 lg:row-start-2">
            {evento.descricao ? (
              <section>
                <SectionHeader title="Sobre o evento" />
                <p className="mt-3 whitespace-pre-line text-body leading-relaxed text-muted-foreground lg:text-[15px]">{evento.descricao}</p>
              </section>
            ) : null}

            <section>
              <SectionHeader title="Programação" />
              <div className="mt-4">
                <EventProgram items={programItems} />
              </div>
            </section>

            {hasPolicies || evento.info ? (
              <section>
                <SectionHeader title="Informações" />
                <div className="mt-4 space-y-4">
                  <EventPolicies evento={evento} />
                  {evento.info ? <p className="whitespace-pre-line text-body leading-relaxed text-muted-foreground lg:text-[15px]">{evento.info}</p> : null}
                </div>
              </section>
            ) : null}

            {addr ? (
              <section>
                <SectionHeader title="Local" />
                <div className="mt-4">
                  <EventLocation local={evento.local} addr={addr} />
                </div>
              </section>
            ) : null}

            {hasContact ? (
              <section>
                <SectionHeader title="Fale com o organizador" />
                <div className="mt-4">
                  <EventContact evento={evento} />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {/* Barra fixa de compra (celular). O shell reserva o espaço dela depois do footer. */}
      {tickets.length > 0 ? (
        <div data-fixed-bottom-purchase-bar="" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-3 backdrop-blur-md lg:hidden">
          {couponApplied ? (
            <div className="mb-2.5">
              <StatusBadge tone="success">
                {couponApplied.code} · {couponApplied.desconto}% off
              </StatusBadge>
            </div>
          ) : null}
          <PurchaseSummary purchase={purchase} layout="bar" />
        </div>
      ) : null}

      <InstallmentsSheet open={parcelasSheet} onOpenChange={setParcelasSheet} rows={parcelasData} loading={parcelasLoading} />

      {showLoginModal ? (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            router.push(buildCheckoutUrl());
          }}
        />
      ) : null}
    </div>
  );
}
