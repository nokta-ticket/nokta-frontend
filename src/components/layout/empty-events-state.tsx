import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Estado vazio real da home pública (0 eventos elegíveis) — nunca mock,
 * skeleton, banner temporário ou carrossel/seção vazia. Layout portado
 * fielmente do HTML de referência enviado pelo usuário (hero + ticker
 * animado + bloco de captação de produtor), com dois ajustes pedidos
 * explicitamente sobre esse HTML: "rolês" usa a fonte cursiva da marca
 * (font-gooddog, mesma do logo "nokta tickets" no header/footer) em vez
 * da Fredoka do rascunho, e o ticket decorativo é um contorno roxo com
 * miolo branco (nunca o preenchimento lilás translúcido do rascunho),
 * mantido na lateral/fundo do hero como no original.
 *
 * Ocupa o espaço entre header e footer (flex-1, ver comentário em
 * EventGrid) e fica centralizado nele — o <main flex flex-1 flex-col> do
 * layout raiz já empurra o footer pro fim da viewport quando o conteúdo é
 * curto, então nada aqui precisa forçar altura de tela cheia.
 */
export default function EmptyEventsState() {
  return (
    <section className="flex flex-1 flex-col">
      <style>{`
        @keyframes empty-state-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[760px]">
        {/* HERO */}
        <div className="relative overflow-hidden px-6 pb-8 pt-14 sm:px-10 sm:pt-[70px]">
          <TicketOutline className="pointer-events-none absolute -right-16 top-24 z-0 h-auto w-[170px] opacity-70 sm:-right-8 sm:top-14 sm:w-[360px] sm:opacity-100" />

          <div className="relative z-10">
            <p className="mb-5 font-poppins text-[13px] font-bold tracking-[0.28em] text-violet-600">
              VEM AÍ
            </p>
            <h1 className="font-poppins text-[clamp(38px,10.5vw,52px)] font-extrabold leading-[1.06] tracking-[-0.02em] text-[#201b3b]">
              Os próximos
              <br />
              <RolesGoodDog />
              <br />
              começam
              <br />
              por aqui.
            </h1>
            <p className="mt-6 text-[16.5px] font-normal leading-[1.65] text-[#6f6f7c]">
              Shows, festas, festivais
              <br />
              e experiências.
              <br />
              Tudo em um só lugar.
            </p>
            <div className="mt-7 h-[3px] w-16 rounded-full bg-violet-600" />
          </div>
        </div>

        {/* TICKER */}
        <div
          className="overflow-hidden whitespace-nowrap bg-[#f3f0fd] py-[18px]"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          }}
        >
          <div
            className="group inline-flex items-center"
            style={{ animation: "empty-state-ticker-scroll 20s linear infinite" }}
          >
            <TickerChunk />
            <TickerChunk ariaHidden />
          </div>
        </div>

        {/* PROMO */}
        <div className="flex gap-5 px-6 pb-14 pt-11 sm:px-10 sm:pb-[60px] sm:pt-11">
          <div className="w-[3px] shrink-0 rounded-full bg-violet-600" />
          <div>
            <h2 className="font-poppins text-[23px] font-bold tracking-[-0.01em] text-[#201b3b]">
              Produz eventos?
            </h2>
            <p className="mt-3 text-[15.5px] leading-[1.6] text-[#6f6f7c]">
              Leve sua bilheteria para a Nokta
              <br />
              e venda mais.
            </p>
            <Link
              href="/para-produtores"
              className="mt-5 inline-flex items-center gap-2 border-b-2 border-violet-600 pb-[3px] font-poppins text-[15px] font-semibold text-violet-600"
            >
              Conheça a Nokta
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TickerChunk({ ariaHidden = false }: { ariaHidden?: boolean }) {
  const items = [
    { label: "SHOWS", tone: "dark" },
    { label: "FESTAS", tone: "purple" },
    { label: "FESTIVAIS", tone: "dark" },
    { label: "EXPERIÊNCIAS", tone: "purple" },
    { label: "SHOWS", tone: "dark" },
    { label: "FESTAS", tone: "purple" },
    { label: "FESTIVAIS", tone: "dark" },
    { label: "EXPERIÊNCIAS", tone: "purple" },
  ] as const;

  return (
    <div className="inline-flex items-center" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center">
          <span
            className={`px-[22px] font-poppins text-[15px] font-bold tracking-[0.06em] ${
              item.tone === "purple" ? "text-violet-600" : "text-[#201b3b]"
            }`}
          >
            {item.label}
          </span>
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-violet-600" />
        </span>
      ))}
    </div>
  );
}

/**
 * A fonte GoodDog (a mesma do logo "nokta tickets") tem TODOS os
 * caracteres acentuados do português com glifo vazio (numberOfContours=0
 * no arquivo TTF — confirmado via fonttools, não é bug de CSS/render) —
 * "rolês" nela renderiza como "rol s". Em vez de trocar a palavra ou
 * trocar de fonte só aqui, compõe o "ê" visualmente: a base "e" vem da
 * própria GoodDog (contorno real, glifo presente), e o acento circunflexo
 * é um span à parte posicionado por cima via CSS relative/absolute — só
 * essa letra precisa do tratamento, "rol"/"s" renderizam normalmente.
 */
function RolesGoodDog() {
  return (
    <span className="font-gooddog font-semibold text-violet-600">
      rol
      <span className="relative inline-block">
        e
        <svg
          aria-hidden="true"
          viewBox="0 0 20 10"
          className="absolute left-1/2 top-[0.1em] h-[0.14em] w-[0.46em] -translate-x-1/2"
        >
          <path d="M2,9 L10,1.5 L18,9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      s
    </span>
  );
}

/**
 * Mesmo desenho de ticket do rascunho HTML, só que com miolo branco e
 * contorno roxo (pedido explícito do usuário) em vez do preenchimento
 * lilás translúcido original — mantido como decoração lateral do hero,
 * nunca centralizado nem redimensionado além do que já estava no rascunho.
 */
function TicketOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 320" fill="none" aria-hidden="true">
      <g transform="rotate(-15 210 160)">
        <path
          d="M40,74 h300 a26,26 0 0 1 26,26 v34 a22,22 0 0 0 0,44 v34 a26,26 0 0 1 -26,26 h-300 a26,26 0 0 1 -26,-26 v-34 a22,22 0 0 0 0,-44 v-34 a26,26 0 0 1 26,-26 z"
          fill="#ffffff"
          stroke="#7c3aed"
          strokeWidth="2.5"
        />
        <line
          x1="203"
          y1="80"
          x2="203"
          y2="234"
          stroke="#7c3aed"
          strokeOpacity="0.35"
          strokeWidth="2.5"
          strokeDasharray="4 9"
          strokeLinecap="round"
        />
        <path
          transform="translate(300 157) scale(2.4)"
          d="M0,-16 4.7,-4.9 16,-4.9 6.6,2 10,13 0,6.2 -10,13 -6.6,2 -16,-4.9 -4.7,-4.9Z"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  );
}
