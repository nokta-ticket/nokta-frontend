"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { HeaderAction, VenuePublicFooter, VenuePublicHeader } from "@/components/venue-menu/venue-public-header";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { VENUE_REVIEW_COMPLAINT_CATEGORIES, VENUE_REVIEW_COMPLAINT_LABEL, venueReviewPublicApi, type VenueReviewComplaintCategory, type VenueReviewPageData } from "@/services/venue-review-public";

type Category = "priceRating" | "productsRating" | "serviceRating" | "ambienceRating";

const CATEGORY_ROWS: { key: Category; label: string; icon: IconName }[] = [
  { key: "priceRating", label: "Preço", icon: "receipt" },
  { key: "productsRating", label: "Produtos", icon: "cocktail" },
  { key: "serviceRating", label: "Atendimento", icon: "users" },
  { key: "ambienceRating", label: "Ambiente", icon: "music" },
];

function StarRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} aria-label={`${n} ${n > 1 ? "estrelas" : "estrela"}`} className="press flex size-10 items-center justify-center rounded-full transition-colors hover:bg-surface-2">
          <Icon name={n <= value ? "star" : "star-outline"} size={20} className={n <= value ? "text-warning" : "text-border-strong"} />
        </button>
      ))}
    </div>
  );
}

function RatingRows({ ratings, onChange }: { ratings: Record<Category, number>; onChange: (key: Category, value: number) => void }) {
  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-surface shadow-card">
      {CATEGORY_ROWS.map((row) => (
        <li key={row.key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex items-center gap-2.5 text-[15px] font-medium text-foreground">
            <Icon name={row.icon} size={14} className="text-muted-foreground" />
            {row.label}
          </span>
          <StarRow value={ratings[row.key]} onChange={(v) => onChange(row.key, v)} label={row.label} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Formulário público de avaliação (nokta.live/avaliacao/{slug}) — sem login.
 * "Gostei" pede nota por categoria; "Não gostei" pede a principal crítica.
 * Nome e WhatsApp são obrigatórios pra casa poder responder; data de
 * nascimento só quando o cliente topa receber novidades.
 */
export function AvaliacaoFormView({ initialData, orgSlug }: { initialData: VenueReviewPageData; orgSlug: string }) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [ratings, setRatings] = useState<Record<Category, number>>({ priceRating: 0, productsRating: 0, serviceRating: 0, ambienceRating: 0 });
  const [complaintCategory, setComplaintCategory] = useState<VenueReviewComplaintCategory | "">("");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerWhatsapp, setReviewerWhatsapp] = useState("");
  const [reviewerBirthDate, setReviewerBirthDate] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { profile } = initialData;
  const setRating = (key: Category, value: number) => setRatings((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (liked === null) {
      toast.error("Conta pra gente como foi sua experiência.");
      return;
    }
    if (liked && Object.values(ratings).some((v) => v === 0)) {
      toast.error("Avalie todas as categorias pra continuar.");
      return;
    }
    if (!liked && !complaintCategory) {
      toast.error("Selecione qual foi sua principal crítica.");
      return;
    }
    if (!reviewerName.trim() || !reviewerWhatsapp.trim()) {
      toast.error("Preencha nome e WhatsApp.");
      return;
    }
    if (marketingOptIn && !reviewerBirthDate) {
      toast.error("Preencha sua data de nascimento pra receber novidades e benefícios.");
      return;
    }

    setSubmitting(true);
    try {
      await venueReviewPublicApi.submit(orgSlug, {
        liked,
        priceRating: ratings.priceRating || undefined,
        productsRating: ratings.productsRating || undefined,
        serviceRating: ratings.serviceRating || undefined,
        ambienceRating: ratings.ambienceRating || undefined,
        complaintCategory: !liked ? (complaintCategory as VenueReviewComplaintCategory) : undefined,
        comment: comment.trim() || undefined,
        reviewerName: reviewerName.trim(),
        reviewerWhatsapp: reviewerWhatsapp.trim(),
        reviewerBirthDate: reviewerBirthDate || undefined,
        marketingOptIn,
      });
      setSubmitted(true);
    } catch {
      toast.error("Não foi possível enviar sua avaliação. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
        <div className="scale-in flex w-full max-w-md flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success-bg text-success">
            <Icon name="check" size={26} />
          </span>
          <h1 className="text-title font-semibold tracking-tight text-foreground">Valeu pela avaliação!</h1>
          <p className="text-body text-muted-foreground">Sua opinião ajuda {initialData.organizationName} a melhorar sempre.</p>
          <Button asChild variant="contrast" shape="pill" className="mt-2">
            <a href={`/${orgSlug}`}>Voltar pro início</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <VenuePublicHeader
          name={initialData.organizationName}
          logoUrl={profile.logoUrl}
          bannerUrl={profile.bannerUrl}
          actions={
            <>
              <HeaderAction href={`/${orgSlug}`} label="Início do estabelecimento" icon="home" />
              <HeaderAction href={`/cardapio/${orgSlug}`} label="Cardápio" icon="utensils" />
              {profile.instagramUrl ? <HeaderAction href={profile.instagramUrl} label="Instagram" icon="instagram" external /> : null}
            </>
          }
        />

        <div className="grid gap-8 px-4 pt-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form
            className="min-w-0 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <section className="space-y-4">
              <h2 className="text-title font-semibold tracking-tight">Como foi sua experiência?</h2>
              <div role="radiogroup" aria-label="Como foi" className="grid grid-cols-2 gap-3">
                <button type="button" role="radio" aria-checked={liked === true} onClick={() => setLiked(true)} className={cn("press flex h-14 items-center justify-center gap-2 rounded-card border text-[15px] font-semibold transition-colors", liked === true ? "border-transparent bg-success-bg text-success ring-2 ring-success" : "border-border bg-surface text-foreground hover:bg-surface-2")}>
                  <Icon name="heart" size={16} />
                  Gostei
                </button>
                <button type="button" role="radio" aria-checked={liked === false} onClick={() => setLiked(false)} className={cn("press flex h-14 items-center justify-center gap-2 rounded-card border text-[15px] font-semibold transition-colors", liked === false ? "border-transparent bg-danger-bg text-danger ring-2 ring-danger" : "border-border bg-surface text-foreground hover:bg-surface-2")}>
                  <Icon name="x-circle" size={16} />
                  Não gostei
                </button>
              </div>
            </section>

            {liked === true ? (
              <section className="fade-up space-y-4">
                <RatingRows ratings={ratings} onChange={setRating} />
                <Field label="Conta pra gente" optional htmlFor="review-comment" hint={`${comment.length}/500`}>
                  <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} maxLength={500} placeholder="O que mais curtiu?" />
                </Field>
              </section>
            ) : liked === false ? (
              <section className="fade-up space-y-4">
                <Field label="Qual foi sua principal crítica?" htmlFor="review-complaint" required>
                  <NativeSelect id="review-complaint" value={complaintCategory} onChange={(e) => setComplaintCategory(e.target.value as VenueReviewComplaintCategory)}>
                    <option value="">Selecione uma opção</option>
                    {VENUE_REVIEW_COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {VENUE_REVIEW_COMPLAINT_LABEL[cat]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Conta pra gente o que aconteceu" optional htmlFor="review-comment-neg" hint={`${comment.length}/500`}>
                  <Textarea id="review-comment-neg" value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} maxLength={500} placeholder="Descreva rapidinho o problema" />
                </Field>
                <Field label="Avalie os pontos abaixo" optional>
                  <RatingRows ratings={ratings} onChange={setRating} />
                </Field>
              </section>
            ) : null}

            <section className="space-y-4">
              <div>
                <h2 className="text-title font-semibold tracking-tight">Seus dados</h2>
                <p className="mt-1 text-body text-muted-foreground">Pra casa poder te responder sobre a avaliação.</p>
              </div>
              <Field label="Nome completo" htmlFor="review-name" required>
                <Input id="review-name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="WhatsApp com DDD" htmlFor="review-whatsapp" required>
                <Input id="review-whatsapp" inputMode="tel" autoComplete="tel" leftIcon="whatsapp" value={reviewerWhatsapp} onChange={(e) => setReviewerWhatsapp(e.target.value)} placeholder="(11) 99999-8888" />
              </Field>

              <Card className="gap-0">
                <CardContent className="space-y-4 p-4">
                  <label htmlFor="review-optin" className="flex cursor-pointer items-start gap-3">
                    <Checkbox id="review-optin" checked={marketingOptIn} onCheckedChange={(v) => setMarketingOptIn(v === true)} className="mt-0.5" />
                    <span className="text-sm leading-snug text-foreground">
                      Quero receber novidades, promoções e benefícios de {initialData.organizationName}.
                      <span className="block text-caption text-muted-foreground">Conteúdos exclusivos por WhatsApp.</span>
                    </span>
                  </label>
                  {marketingOptIn ? (
                    <div className="fade-up space-y-3">
                      <Field label="Data de nascimento" htmlFor="review-birth" required>
                        <Input id="review-birth" type="date" value={reviewerBirthDate} onChange={(e) => setReviewerBirthDate(e.target.value)} />
                      </Field>
                      <p className="flex items-start gap-2 text-caption text-muted-foreground">
                        <Icon name="lock" size={11} className="mt-0.5 shrink-0" />
                        Usamos sua data de nascimento só pra benefícios e campanhas especiais. Dá pra cancelar quando quiser.
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>

            <div className="space-y-3">
              <Button type="submit" size="full" shape="pill" loading={submitting} leftIcon="send">
                Enviar avaliação
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-caption text-muted-foreground">
                <Icon name="shield" size={11} />
                Ao enviar, você concorda com a{" "}
                <a href="/privacidade" className="font-semibold text-brand underline-offset-4 hover:underline">
                  Política de Privacidade
                </a>
                .
              </p>
            </div>
          </form>

          <aside className="space-y-4 lg:pt-1">
            <Card accent>
              <CardContent className="space-y-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon name="star" size={20} />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">Sua opinião faz diferença</p>
                  <p className="mt-1 text-caption text-muted-foreground">Leva menos de 1 minuto e orienta decisões de verdade.</p>
                </div>
                <ul className="space-y-3 border-t border-border pt-4 text-sm">
                  <li className="flex gap-2.5">
                    <Icon name="magic" size={13} className="mt-0.5 shrink-0 text-brand" />
                    <span className="text-muted-foreground">Experiência melhor a cada visita.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Icon name="music" size={13} className="mt-0.5 shrink-0 text-brand" />
                    <span className="text-muted-foreground">Ambiente mais agradável e acolhedor.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Icon name="gift" size={13} className="mt-0.5 shrink-0 text-brand" />
                    <span className="text-muted-foreground">Promoções e benefícios exclusivos.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Callout tone="neutral" icon="lock" title="Seus dados estão seguros">
              Usamos seus dados só pra contato sobre a avaliação ou, se você autorizar, pra enviar novidades.
            </Callout>
          </aside>
        </div>

        <VenuePublicFooter instagramUrl={profile.instagramUrl} />
      </div>
    </div>
  );
}
