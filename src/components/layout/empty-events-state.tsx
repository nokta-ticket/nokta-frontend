import { HelpCircle, ArrowRight } from "lucide-react";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import Link from "next/link";
import NotifyMeForm from "./notify-me-form";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

/**
 * Estado vazio real da home pública (0 eventos elegíveis) — nunca mock,
 * skeleton, banner temporário ou carrossel/seção vazia. Layout portado
 * fielmente do 2º HTML de referência enviado pelo usuário (2026-08-17),
 * substituindo a versão anterior (hero + ticker + promo produtor): hero
 * com rabisco manuscrito sob "eventos" + ilustração de ticket flutuante,
 * card "Produz eventos?" com dashboard/analytics ilustrado, e bloco de
 * ajuda com link para a Central de Ajuda. Fontes Bricolage Grotesque
 * (títulos/corpo) e Caveat (destaques manuscritos) carregadas via
 * next/font/google, escopadas a este componente (não fazem parte da
 * identidade tipográfica global do projeto, que usa Poppins/Space Grotesk).
 *
 * "Quero ser avisado quando tiver" (NotifyMeForm) abre um campo de e-mail
 * real, submetido pra POST /event-notify/subscribe (backend, sem auth) —
 * decisão explícita do usuário de não deixar só decorativo. "Conheça a
 * Nokta" é um <a> normal (nunca next/link) pra https://www.nokta.live —
 * cross-domain de propósito: conteúdo de produtor vive no site
 * institucional (nokta.live), nunca no de tickets (noktatickets.com.br/
 * app.nokta.live), pedido explícito do usuário depois de uma 1ª tentativa
 * apontar pra /institucional local, que ficaria no domínio errado.
 * "Acessar ajuda" abre /ajuda (Central de Ajuda real) em nova guia — antes
 * ficava só visual porque a página não existia (mesmo padrão do texto
 * antigo de OnboardingExtras em onboarding-extras.tsx, também desatualizado
 * agora que /ajuda existe).
 *
 * Ocupa o espaço entre header e footer (flex-1, ver comentário em
 * EventGrid) e fica centralizado nele — o <main flex flex-1 flex-col> do
 * layout raiz já empurra o footer pro fim da viewport quando o conteúdo é
 * curto, então nada aqui precisa forçar altura de tela cheia.
 */
export default function EmptyEventsState() {
  return (
    <section
      className={`${bricolage.variable} ${caveat.variable} flex flex-1 flex-col items-center px-4 py-14 sm:py-16`}
    >
      <div className="mx-auto w-full max-w-[575px]">
        {/* ============ HERO ============ */}
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:text-left">
          <div className="w-full pt-0 sm:w-[302px] sm:shrink-0 sm:pt-[13px]">
            <h1 className="font-[family-name:var(--font-bricolage)] text-[34px] font-extrabold leading-[1.32] tracking-[-0.6px] text-[#1E1B33]">
              Ainda não há
              <br />
              <span className="relative mr-0.5 inline-block whitespace-nowrap px-0.5 font-[family-name:var(--font-caveat)] text-[42px] font-bold leading-none text-[#7C3AED]">
                eventos
                <svg
                  viewBox="0 0 130 16"
                  fill="none"
                  aria-hidden="true"
                  className="absolute -bottom-[14px] -left-1 h-4 w-[calc(100%+12px)] overflow-visible"
                >
                  <path d="M3 9.5C24 4.2 62 2.6 126 6.2" stroke="#7C3AED" strokeWidth="3.4" strokeLinecap="round" />
                  <path d="M8 14C30 9.6 68 8.4 112 11.4" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" opacity=".85" />
                </svg>
              </span>{" "}
              por aqui.
            </h1>

            <p className="mt-[26px] text-[15px] font-medium leading-[26px] text-[#6E7180]">
              Mas coisas incríveis estão
              <br />
              a caminho! Fique de olho e não
              <br />
              perca os próximos{" "}
              <span className="font-[family-name:var(--font-caveat)] text-[22px] font-bold leading-none text-[#7C3AED]">
                rolês
              </span>
              .
            </p>

            <NotifyMeForm />

            <p className="mx-auto mt-[18px] max-w-[215px] text-xs font-medium leading-5 text-[#9A9CAB] sm:mx-0">
              Te avisamos quando novos eventos forem publicados.
            </p>
          </div>

          <div className="mt-2 w-[220px] shrink-0 sm:mt-[-13px] sm:w-[265px]">
            <HeroArt />
          </div>
        </div>

        {/* ============ CARD PRODUTOR ============ */}
        <div className="relative mt-[68px] flex min-h-[183px] flex-col items-center overflow-hidden rounded-2xl border border-[#F1ECFB] bg-[#FAF8FE] p-7 text-center sm:flex-row sm:items-start sm:p-9 sm:text-left">
          <span
            aria-hidden="true"
            className="hidden h-[118px] w-0.5 shrink-0 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#7C3AED]/15 sm:block"
          />

          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#F4EBFE] sm:ml-[17px]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <g transform="rotate(-12 12 13)">
                <path d="M2 11a3 3 0 0 1 0 6v1.5A1.5 1.5 0 0 0 3.5 20h17a1.5 1.5 0 0 0 1.5-1.5V17a3 3 0 0 1 0-6v-1.5A1.5 1.5 0 0 0 20.5 8h-17A1.5 1.5 0 0 0 2 9.5V11Z" />
                <path d="M13 9.5v1M13 13v1.5M13 17v1" />
              </g>
              <path d="M18.5 2c.4 2.3 1.2 3.1 3.5 3.5-2.3.4-3.1 1.2-3.5 3.5-.4-2.3-1.2-3.1-3.5-3.5 2.3-.4 3.1-1.2 3.5-3.5Z" fill="#7C3AED" stroke="none" />
            </svg>
          </div>

          <div className="mt-4 max-w-[250px] pt-0 sm:ml-[17px] sm:mt-0 sm:pt-[3px]">
            <h2 className="font-[family-name:var(--font-bricolage)] text-[17px] font-bold tracking-[-0.3px] text-[#1E1B33]">
              Produz eventos?
            </h2>
            <p className="mt-3 text-[13px] font-medium leading-[22px] text-[#8A8C99]">
              Leve sua bilheteria para a Nokta
              <br />
              e venda mais com praticidade,
              <br />
              segurança e taxas justas.
            </p>
            <a
              href="https://www.nokta.live"
              className="group mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#7C3AED] underline decoration-1 underline-offset-4"
            >
              Conheça a Nokta
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2.2} />
            </a>
          </div>

          <div className="relative mt-5 h-[150px] w-[185px] shrink-0 sm:absolute sm:right-[22px] sm:top-[14px] sm:mt-0">
            <CardArt />
          </div>
        </div>

        {/* ============ AJUDA ============ */}
        <div className="mt-9 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EBFE]">
            <HelpCircle className="h-[22px] w-[22px]" strokeWidth={1.9} color="#7C3AED" />
          </div>

          <h3 className="mt-[18px] font-[family-name:var(--font-bricolage)] text-sm font-bold tracking-[-0.2px] text-[#1E1B33]">
            Procurando algo específico?
          </h3>

          <p className="mt-[10px] text-[12.5px] font-medium leading-5 text-[#9A9CAB]">
            Encontre respostas para as dúvidas mais comuns
            <br />
            na nossa Central de Ajuda.
          </p>

          <Link
            href="/ajuda"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[22px] inline-block rounded-[9px] border-[1.5px] border-[#D9C2F8] bg-white px-[22px] py-[9px] text-[12.5px] font-semibold text-[#7C3AED] transition-colors hover:border-[#7C3AED] hover:bg-[#FBF8FF]"
          >
            Acessar ajuda
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 265 300" fill="none" aria-hidden="true" className="block h-auto w-full">
      <ellipse cx="121" cy="270" rx="112" ry="26" fill="#F1E7FC" />
      <ellipse cx="121" cy="264" rx="112" ry="26" fill="#FBF8FE" stroke="#EADFFA" strokeWidth="1.4" />

      <path
        d="M42 190C72 218 112 228 152 224c33-3 52-18 47-31-4-11-19-8-17 5 2 15 22 25 38 28"
        stroke="#C9AEF6"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />

      <g transform="translate(120 122) rotate(-23)">
        <g transform="translate(-89 -42)">
          <path
            d="M12 0H91a9 9 0 0 0 18 0h57a12 12 0 0 1 12 12v60a12 12 0 0 1-12 12h-57a9 9 0 0 0-18 0H12A12 12 0 0 1 0 72V12A12 12 0 0 1 12 0Z"
            fill="#FFFFFF"
            stroke="#B187F0"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M100 9v66" stroke="#C9AEF6" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 6" />
          <path
            d="M139 23L143.82 35.37L157.07 36.13L146.8 44.53L150.17 57.37L139 50.2L127.83 57.37L131.2 44.53L120.93 36.13L134.18 35.37L139 23Z"
            stroke="#8B5CF6"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>

      <path d="M158 12c5-7 10 6 15 0s10 6 15-1" stroke="#B187F0" strokeWidth="2" strokeLinecap="round" />

      <circle cx="33" cy="73" r="3.2" stroke="#C9AEF6" strokeWidth="1.5" />

      <g fill="#A78BFA">
        <path d="M92 12c1 6 3 8 9 10-6 2-8 4-9 10-1-6-3-8-9-10 6-2 8-4 9-10Z" />
        <path d="M25 36c.7 4.5 2.2 6 6.5 7-4.3 1-5.8 2.5-6.5 7-.7-4.5-2.2-6-6.5-7 4.3-1 5.8-2.5 6.5-7Z" />
        <path d="M232 44c.8 5 2.4 6.6 7.2 7.7-4.8 1.1-6.4 2.7-7.2 7.7-.8-5-2.4-6.6-7.2-7.7 4.8-1.1 6.4-2.7 7.2-7.7Z" />
        <path d="M246 116c.6 3.8 1.9 5.1 5.5 6-3.6.9-4.9 2.2-5.5 6-.6-3.8-1.9-5.1-5.5-6 3.6-.9 4.9-2.2 5.5-6Z" />
        <path d="M12 148c.7 4.4 2.2 5.9 6.3 6.9-4.1 1-5.6 2.5-6.3 6.9-.7-4.4-2.2-5.9-6.3-6.9 4.1-1 5.6-2.5 6.3-6.9Z" />
      </g>
    </svg>
  );
}

function CardArt() {
  return (
    <svg viewBox="0 0 185 150" fill="none" aria-hidden="true" className="block h-full w-full">
      <defs>
        <linearGradient id="empty-state-bar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="empty-state-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#7C3AED" floodOpacity=".13" />
        </filter>
      </defs>

      <g filter="url(#empty-state-soft)">
        <rect x="10" y="14" width="122" height="96" rx="11" fill="#fff" stroke="#EFE7FB" strokeWidth="1.2" />
        <path d="M10 25a11 11 0 0 1 11-11h100a11 11 0 0 1 11 11v9H10v-9Z" fill="url(#empty-state-bar)" />
        <circle cx="22" cy="24" r="2.6" fill="#fff" opacity=".9" />
        <circle cx="31" cy="24" r="2.6" fill="#fff" opacity=".65" />
      </g>
      <rect x="24" y="72" width="12" height="26" rx="3.5" fill="#D6C6FA" />
      <rect x="43" y="55" width="12" height="43" rx="3.5" fill="#8B5CF6" />
      <rect x="62" y="65" width="12" height="33" rx="3.5" fill="#B79CF7" />

      <g filter="url(#empty-state-soft)">
        <rect x="80" y="58" width="96" height="64" rx="11" fill="#fff" stroke="#EFE7FB" strokeWidth="1.2" />
      </g>
      <rect x="92" y="68" width="24" height="24" rx="8" fill="url(#empty-state-bar)" />
      <path d="M104 73.5l2 4.2 4.6.4-3.5 3 1.1 4.5-4.2-2.5-4.2 2.5 1.1-4.5-3.5-3 4.6-.4 2-4.2Z" fill="#fff" />
      <rect x="124" y="70" width="42" height="5" rx="2.5" fill="#EDE7F9" />
      <rect x="124" y="81" width="34" height="5" rx="2.5" fill="#F2EDFB" />
      <rect x="92" y="100" width="74" height="5" rx="2.5" fill="#F2EDFB" />
      <rect x="92" y="110" width="52" height="5" rx="2.5" fill="#F5F1FC" />
    </svg>
  );
}
