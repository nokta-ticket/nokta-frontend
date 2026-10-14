"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { fireBrandConfetti } from "@/lib/confetti";
import { cityLabel, formatBRL, formatDateBR, formatEventDateTime, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginModal } from "@/components/auth/login-modal";
import { ResaleRow } from "../_components/resale-row";
import { resaleCover, resaleDiscountPercent, resalePrice, type ResaleItem, type ResaleListResponse } from "../_lib/resale";
import { ResalePaymentSheet } from "./_components/resale-payment-sheet";

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-3 lg:px-6 lg:py-8" aria-busy>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div>
          <Skeleton className="aspect-[818/355] w-full rounded-[20px]" />
          <Skeleton className="mt-5 h-9 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-44 w-full rounded-card" />
        </div>
        <Skeleton className="hidden h-72 w-full rounded-card lg:block" />
      </div>
    </div>
  );
}

function PriceCard({ resale, onBuy, buying }: { resale: ResaleItem; onBuy: () => void; buying: boolean }) {
  const price = resalePrice(resale);
  const discount = resaleDiscountPercent(resale);
  return (
    <Card accent className="p-5">
      <p className="text-caption text-muted-foreground">Preço do ingresso</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-stat-lg font-bold text-foreground tnum">{formatBRL(price)}</p>
        {discount > 0 ? <s className="text-sm text-subtle-foreground tnum">{formatBRL(Number(resale.originalPrice))}</s> : null}
      </div>
      <div className="mt-2.5">{discount > 0 ? <StatusBadge tone="success">{discount}% abaixo do original</StatusBadge> : <StatusBadge tone="neutral">Mesmo preço do original</StatusBadge>}</div>
      <p className="mt-4 text-caption text-muted-foreground">Taxa de serviço e de processamento aparecem antes de você confirmar.</p>
      <Button size="full" leftIcon="ticket" className="mt-4" onClick={onBuy} loading={buying}>
        Comprar ingresso
      </Button>
      <Button asChild variant="outline" size="full" className="mt-2">
        <Link href="/meus-ingressos">Quero vender o meu</Link>
      </Button>
    </Card>
  );
}

/**
 * Detalhe de um anúncio de revenda: a arte do evento inteira (818×355, nunca
 * cortada), o que é o ingresso, o preço em destaque e a compra num diálogo
 * (folha inferior no celular). Outros anúncios do mesmo evento aparecem
 * embaixo pra quem quer comparar.
 */
export default function ComprarRevendaPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isAuthResolved } = useAuth();

  const [resale, setResale] = useState<ResaleItem | null>(null);
  const [others, setOthers] = useState<ResaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ResaleItem>(`/revenda/${id}`);
      setResale(res.data);
      if (res.data.evento?.id) {
        const list = await api.get<ResaleListResponse>("/revenda", { params: { eventId: res.data.evento.id, page: 1, limit: 100 } }).catch(() => ({ data: { data: [] as ResaleItem[] } }));
        setOthers((list.data.data ?? []).filter((r) => String(r.evento?.id) === String(res.data.evento?.id) && r.id !== res.data.id));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Ingresso não encontrado ou não está mais disponível."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (done) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      fireBrandConfetti();
    }
  }, [done]);

  function handleBuy() {
    if (!isAuthResolved) return;
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    // Abre o fluxo de pagamento (Pix/cartão). O sucesso só aparece após pagamento confirmado.
    setPaying(true);
  }

  if (loading) return <DetailSkeleton />;

  if (error || !resale) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState title="Ingresso indisponível" description={error ?? "Este anúncio não existe mais."} onRetry={load} />
        <div className="mt-4 text-center">
          <Button asChild variant="link">
            <Link href="/revenda">Ver outros ingressos em revenda</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-16 pt-12 text-center lg:pt-20">
        <div className="slide-up">
          <div className="pulse-ring mx-auto flex size-16 items-center justify-center rounded-full bg-success-bg text-success [--pulse-color:var(--success)]">
            <Icon name="check" size={26} />
          </div>
          <h1 className="mt-5 font-display text-[2.25rem] uppercase leading-none text-foreground">Compra confirmada!</h1>
          <p className="mt-3 text-body text-muted-foreground">
            Seu ingresso pra <span className="font-semibold text-foreground">{resale.evento?.nome}</span> já está na sua conta, com um QR Code novo.
          </p>
        </div>
        <div className="slide-up mt-8 space-y-2 [--i:1]">
          <Button asChild size="full">
            <Link href="/meus-ingressos">
              <Icon name="ticket" size={16} />
              Ver meus ingressos
            </Link>
          </Button>
          <Button asChild variant="ghost" size="full">
            <Link href="/revenda">Ver mais ingressos em revenda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ev = resale.evento;
  const price = resalePrice(resale);
  const discount = resaleDiscountPercent(resale);
  const place = [ev?.local, cityLabel(ev?.endereco)].filter(Boolean).join(" — ");
  const expiresTime = formatTime(resale.expiresAt?.includes("T") ? resale.expiresAt : null);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-3 lg:px-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <div className="relative aspect-[818/355] overflow-hidden rounded-[20px] bg-surface-2 shadow-card ring-1 ring-white/5">
              <Image src={resaleCover(resale)} alt="" fill priority sizes="(max-width:1024px) 100vw, 720px" unoptimized className="object-cover" />
              <span className="absolute left-3 top-3 rounded-pill bg-brand px-3 py-1.5 text-micro font-bold uppercase tracking-wider text-brand-foreground">Revenda</span>
            </div>

            <div className="mt-4 slide-up">
              <h1 className="font-display text-[1.9rem] uppercase leading-[0.95] text-foreground lg:text-[2.5rem]">{ev?.nome ?? "Evento"}</h1>
              <p className="mt-2 text-[15px] font-semibold text-brand">{formatEventDateTime(ev?.data, ev?.horario)}</p>
              {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sobre este ingresso</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <dl className="divide-y divide-border">
                  {[
                    { label: "Setor", value: resale.ingresso?.nome ?? "Não informado" },
                    { label: "Lote", value: resale.ingresso ? `${resale.ingresso.lote}º lote` : "Não informado" },
                    { label: "Preço original", value: formatBRL(Number(resale.originalPrice)) },
                    { label: "Anúncio válido até", value: resale.expiresAt ? `${formatDateBR(resale.expiresAt)}${expiresTime ? ` · ${expiresTime}` : ""}` : "Até 2h antes do evento" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-foreground tnum">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Callout tone="info" icon="shield" title="Como funciona" className="mt-4">
              Você paga, o QR Code antigo é cancelado e um novo aparece em Meus ingressos na hora. Sem contato com o vendedor e com pagamento protegido.
            </Callout>

            {ev?.descricao ? <p className="mt-6 whitespace-pre-line text-body text-muted-foreground">{ev.descricao}</p> : null}

            {ev?.slug ? (
              <Button asChild variant="link" className="mt-4">
                <Link href={`/evento/${ev.slug}`}>
                  Ver página do evento
                  <Icon name="arrow-right" size={12} />
                </Link>
              </Button>
            ) : null}

            {others.length > 0 ? (
              <section className="mt-10">
                <SectionHeader title="Outros ingressos deste evento" />
                <div className="mt-4 space-y-2.5">
                  {others.map((r, i) => (
                    <ResaleRow key={r.id} resale={r} className="row-in" style={{ ["--i" as string]: i } as React.CSSProperties} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <PriceCard resale={resale} onBuy={handleBuy} buying={!isAuthResolved} />
          </aside>
        </div>
      </div>

      {/* Barra fixa (celular): preço + comprar */}
      <div data-fixed-bottom-purchase-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">Ingresso</p>
            <p className="flex items-baseline gap-2 text-lg font-bold leading-tight text-foreground tnum">
              {formatBRL(price)}
              {discount > 0 ? <s className="text-caption font-normal text-subtle-foreground">{formatBRL(Number(resale.originalPrice))}</s> : null}
            </p>
          </div>
          <Button size="full" leftIcon="ticket" className="w-[52%] max-w-[220px]" onClick={handleBuy} loading={!isAuthResolved}>
            Comprar
          </Button>
        </div>
      </div>

      {showLogin ? (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setPaying(true);
          }}
        />
      ) : null}

      {paying ? (
        <ResalePaymentSheet
          resaleId={resale.id}
          buyerPrice={price}
          taxaServicoPercent={resale.taxaServicoPercent}
          eventoNome={ev?.nome ?? "Evento"}
          onClose={() => setPaying(false)}
          onSuccess={() => {
            setPaying(false);
            setDone(true);
          }}
        />
      ) : null}
    </>
  );
}
