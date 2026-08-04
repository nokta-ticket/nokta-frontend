"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Award,
  Check,
  Home,
  Instagram,
  Lock,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";
import {
  VENUE_REVIEW_COMPLAINT_CATEGORIES,
  VENUE_REVIEW_COMPLAINT_LABEL,
  venueReviewPublicApi,
  type VenueReviewComplaintCategory,
  type VenueReviewPageData,
} from "@/services/venue-review-public";

// Paleta exclusiva desta tela (referência de produto: vermelho-vinho +
// dourado) — deliberadamente diferente do violeta/preto do resto da
// plataforma e do MenuView, é um produto visual próprio (avaliação, não
// cardápio). Nunca reaproveitar essas cores em outra tela sem pedido novo.
const MAROON = "#8a1e2c";
const MAROON_2 = "#7a1a26";
const MAROON_SOFT = "#fbeef0";
const MAROON_LINE = "#eecfd3";
const GREEN = "#2f8a3b";
const GREEN_SOFT = "#ebf6ed";

type Category = "priceRating" | "productsRating" | "serviceRating" | "ambienceRating";

const CATEGORY_ROWS: { key: Category; label: string; icon: React.ReactNode; bg: string; fg: string }[] = [
  { key: "priceRating", label: "Preço", icon: <Receipt size={20} />, bg: "#e6f4e9", fg: "#2f9e44" },
  { key: "productsRating", label: "Produtos", icon: <Sparkles size={20} />, bg: "#fcf1d3", fg: "#d99b1c" },
  { key: "serviceRating", label: "Atendimento", icon: <Award size={20} />, bg: "#e5eefb", fg: "#3b7fc4" },
  { key: "ambienceRating", label: "Ambiente", icon: <Home size={20} />, bg: "#efe8f8", fg: "#8b5cbf" },
];

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star
            size={26}
            fill={n <= value ? "#f5a623" : "none"}
            color={n <= value ? "#f5a623" : "#dcdce2"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function AvaliacaoFormView({ initialData, orgSlug }: { initialData: VenueReviewPageData; orgSlug: string }) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [ratings, setRatings] = useState<Record<Category, number>>({
    priceRating: 0,
    productsRating: 0,
    serviceRating: 0,
    ambienceRating: 0,
  });
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
      toast.error("Conte pra gente como foi sua experiência.");
      return;
    }
    if (liked && Object.values(ratings).some((v) => v === 0)) {
      toast.error("Avalie todas as categorias para continuar.");
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
      toast.error("Preencha sua data de nascimento para receber novidades e benefícios.");
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
      toast.error("Não foi possível enviar sua avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-full"
          style={{ background: GREEN_SOFT, color: GREEN }}
        >
          <Check size={30} />
        </div>
        <h1 className="font-poppins text-xl font-bold text-foreground">Obrigado pela sua avaliação!</h1>
        <p className="text-sm text-muted-foreground">Sua opinião ajuda {initialData.organizationName} a melhorar sempre.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-[1120px] grid-cols-1 lg:grid-cols-[1fr_316px]">
      {/* ===== MAIN ===== */}
      <div className="min-w-0">
        {/* Cover — mesmo banner do cardápio (VenuePublicProfile.bannerUrl); sem banner cadastrado, mesmo fallback preto sólido do MenuView (nunca o gradiente marrom/dourado antigo, que só existia aqui). */}
        <div className="relative h-[150px] overflow-hidden bg-[#050505] md:h-[198px]">
          {profile.bannerUrl ? (
            <Image
              src={resolveMediaUrl(profile.bannerUrl) ?? profile.bannerUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>

        {/* Venue */}
        <div className="relative z-10 flex gap-4 px-5 md:gap-6 md:px-8">
          <div
            className={`-mt-16 flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-full border-4 border-white shadow-[0_8px_22px_rgba(0,0,0,.16)] md:-mt-20 md:h-[152px] md:w-[152px] ${profile.logoUrl ? "" : "bg-black"}`}
          >
            {profile.logoUrl ? (
              // Sem fundo forçado — logo com transparência real aparece como enviada.
              <Image
                src={resolveMediaUrl(profile.logoUrl) ?? profile.logoUrl}
                alt={initialData.organizationName}
                width={110}
                height={110}
                className="h-full w-full rounded-full object-cover"
                unoptimized
              />
            ) : (
              <>
                <div className="absolute h-[60px] w-[60px] rounded-full border border-white/40 md:h-[80px] md:w-[80px]" />
                <span className="relative font-poppins text-lg font-light tracking-[0.25em] text-white md:text-xl">
                  {initials(initialData.organizationName)}
                </span>
              </>
            )}
          </div>
          <div className="min-w-0 pt-4">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-2xl">
              {initialData.organizationName}
            </h1>
            <div className="mt-3 flex gap-3.5 text-[#3a3a40]">
              <a href={`/${orgSlug}`} title="Início" aria-label="Início">
                <Home size={20} strokeWidth={1.8} />
              </a>
              {profile.instagramUrl ? (
                <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram">
                  <Instagram size={20} strokeWidth={1.8} />
                </a>
              ) : (
                <Instagram size={20} strokeWidth={1.8} className="opacity-30" />
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-11 pt-6 md:px-8">
          <h2 className="mb-5 text-center text-xl font-bold text-foreground md:text-[22px]">Como foi sua experiência?</h2>

          {/* Toggle */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLiked(true)}
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
              style={
                liked === true
                  ? { borderColor: GREEN, background: GREEN_SOFT, color: GREEN }
                  : { borderColor: "#e0e0e8", color: "#28282e", background: "#fff" }
              }
            >
              <ThumbsUp size={17} strokeWidth={1.9} />
              Gostei
            </button>
            <button
              type="button"
              onClick={() => setLiked(false)}
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
              style={
                liked === false
                  ? { borderColor: MAROON, background: MAROON_SOFT, color: MAROON }
                  : { borderColor: "#e0e0e8", color: "#28282e", background: "#fff" }
              }
            >
              <ThumbsDown size={17} strokeWidth={1.9} />
              Não gostei
            </button>
          </div>

          {liked === true ? (
            <div>
              <div className="mb-5 rounded-2xl border border-[#e9e9ef]">
                {CATEGORY_ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-[#e9e9ef]" : ""}`}
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                      style={{ background: row.bg, color: row.fg }}
                    >
                      {row.icon}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-foreground">{row.label}</span>
                    <StarRow value={ratings[row.key]} onChange={(v) => setRating(row.key, v)} />
                  </div>
                ))}
              </div>
              <p className="mb-2.5 text-[15px] font-semibold text-foreground">Conte pra gente (opcional)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Deixe um comentário sobre sua experiência..."
                className="min-h-[118px] w-full resize-y rounded-xl border border-[#e0e0e8] p-3.5 text-base outline-none"
              />
              <div className="mt-2 text-right text-xs text-black/40">{comment.length}/500</div>
            </div>
          ) : liked === false ? (
            <div>
              <div className="mb-5 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-[15px] font-semibold text-foreground">Qual foi sua principal crítica?</p>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value as VenueReviewComplaintCategory)}
                    className="h-[52px] w-full rounded-xl border border-[#e0e0e8] px-4 text-base text-foreground outline-none"
                  >
                    <option value="">Selecione uma opção</option>
                    {VENUE_REVIEW_COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {VENUE_REVIEW_COMPLAINT_LABEL[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-2.5 text-[15px] font-semibold text-foreground">Conte pra gente o que aconteceu (opcional)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    maxLength={500}
                    placeholder="Descreva brevemente o problema..."
                    className="min-h-[140px] w-full resize-y rounded-xl border border-[#e0e0e8] p-3.5 text-base outline-none"
                  />
                  <div className="mt-2 text-right text-xs text-black/40">{comment.length}/500</div>
                </div>
              </div>

              <p className="mb-2.5 text-[15px] font-semibold text-foreground">Avalie os pontos abaixo (opcional)</p>
              <div className="mb-2">
                {CATEGORY_ROWS.map((row) => (
                  <div key={row.key} className="flex items-center gap-4 py-3.5">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                      style={{ background: row.bg, color: row.fg }}
                    >
                      {row.icon}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-foreground">{row.label}</span>
                    <StarRow value={ratings[row.key]} onChange={(v) => setRating(row.key, v)} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Seus dados */}
          <div className="my-6 h-px bg-[#e9e9ef]" />
          <h3 className="mb-2 text-center text-lg font-bold text-foreground">Seus dados</h3>
          <p className="mb-5 text-center text-sm text-muted-foreground">
            Precisamos dessas informações para entrar em contato sobre sua avaliação.
          </p>

          <div className="mb-3.5 flex items-center gap-3 rounded-xl border border-[#e0e0e8] px-4 py-3">
            <input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Nome completo *"
              className="w-full bg-transparent text-base outline-none"
            />
          </div>
          <div className="mb-3.5 flex items-center gap-3 rounded-xl border border-[#e0e0e8] px-4 py-3">
            <input
              value={reviewerWhatsapp}
              onChange={(e) => setReviewerWhatsapp(e.target.value)}
              placeholder="WhatsApp com DDD *"
              className="w-full bg-transparent text-base outline-none"
            />
          </div>

          <div className="rounded-2xl border border-[#e0e0e8] p-4">
            <button
              type="button"
              onClick={() => setMarketingOptIn((v) => !v)}
              className="flex w-full items-start gap-3 text-left"
            >
              <span
                className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-2"
                style={
                  marketingOptIn
                    ? { background: MAROON, borderColor: MAROON, color: "#fff" }
                    : { borderColor: "#e0e0e8" }
                }
              >
                {marketingOptIn ? <Check size={13} strokeWidth={3} /> : null}
              </span>
              <span className="text-base leading-snug text-foreground">
                Quero receber novidades, promoções e benefícios de {initialData.organizationName}.
                <br />
                <span className="text-sm text-muted-foreground">Enviaremos conteúdos exclusivos por WhatsApp.</span>
              </span>
            </button>

            {/* Data de nascimento fica fechada até o usuário marcar o opt-in de marketing acima — só faz sentido pedir a data pra quem topa receber benefícios/campanhas. */}
            {marketingOptIn ? (
              <>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#e0e0e8] px-4 py-3">
                  <input
                    type="date"
                    value={reviewerBirthDate}
                    onChange={(e) => setReviewerBirthDate(e.target.value)}
                    className="w-full bg-transparent text-base text-foreground outline-none"
                  />
                </div>
                <div className="mt-3 flex gap-2 text-xs leading-relaxed" style={{ color: MAROON }}>
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Usaremos sua data de nascimento apenas para benefícios e campanhas especiais. Você pode cancelar quando quiser.
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 flex h-[62px] w-full items-center justify-center gap-3 rounded-2xl text-base font-semibold text-white shadow-[0_10px_24px_rgba(138,30,44,.22)] transition-colors disabled:opacity-60"
            style={{ background: submitting ? MAROON_2 : MAROON }}
          >
            <Send size={20} />
            {submitting ? "Enviando…" : "Enviar avaliação"}
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={16} />
            Ao enviar, você concorda com nossa{" "}
            <a href="/politica-de-privacidade" className="font-semibold" style={{ color: MAROON }}>
              Política de Privacidade
            </a>
            .
          </div>
        </div>
      </div>

      {/* ===== ASIDE ===== */}
      <div className="border-t border-[#e9e9ef] bg-[#fdfcfc] px-6 py-9 lg:border-l lg:border-t-0 lg:px-8">
        <div className="mx-auto mb-5 grid h-[92px] w-[92px] place-items-center rounded-full" style={{ background: "#fbe3e8", color: MAROON }}>
          <Award size={40} />
        </div>
        <h2 className="mb-4 text-center font-poppins text-xl font-bold leading-snug" style={{ color: MAROON }}>
          Sua opinião faz
          <br />
          toda a diferença!
        </h2>
        <p className="mb-2 text-center text-sm text-muted-foreground">Leva menos de 1 minuto.</p>
        <p className="mb-6 text-center text-sm leading-relaxed text-muted-foreground">
          Suas respostas nos ajudam a melhorar sempre.
        </p>
        <hr className="mb-6 border-dashed border-[#e0e0e8]" />

        <div className="mb-5 flex gap-3.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full" style={{ background: "#fbe9ec", color: MAROON }}>
            <Sparkles size={20} />
          </span>
          <div>
            <div className="mb-1 text-sm font-bold text-foreground">Experiência melhor todo dia</div>
            <div className="text-[13.5px] leading-relaxed text-muted-foreground">Seu feedback nos ajuda a evoluir.</div>
          </div>
        </div>
        <div className="mb-5 flex gap-3.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full" style={{ background: "#fbe9ec", color: MAROON }}>
            <Star size={20} />
          </span>
          <div>
            <div className="mb-1 text-sm font-bold text-foreground">Ambiente mais agradável e acolhedor</div>
            <div className="text-[13.5px] leading-relaxed text-muted-foreground">Cada opinião orienta decisões importantes.</div>
          </div>
        </div>
        <div className="mb-6 flex gap-3.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full" style={{ background: "#fbe9ec", color: MAROON }}>
            <Award size={20} />
          </span>
          <div>
            <div className="mb-1 text-sm font-bold text-foreground">Promoções e benefícios exclusivos</div>
            <div className="text-[13.5px] leading-relaxed text-muted-foreground">Para quem quer ficar sempre por dentro.</div>
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: MAROON_LINE, background: MAROON_SOFT }}>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: MAROON }}>
            <Lock size={17} />
            Seus dados estão seguros
          </div>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            Utilizamos seus dados apenas para contato relacionado à sua avaliação ou, se você autorizar, para envio de novidades e promoções.
          </p>
        </div>
      </div>
    </div>
  );
}
