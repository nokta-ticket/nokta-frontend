import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  DoorOpen,
  LineChart,
  ShoppingBag,
  Ticket,
  Wallet,
} from "lucide-react";
import { getPlatformUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { ScrollEffects } from "./_components/scroll-effects";
import "./institucional.css";

/**
 * Fase 5.1, Etapa 3/6 — landing institucional (www.nokta.live). Renderizada
 * via rewrite do middleware (surface MARKETING, path "/"). Título e
 * descrição aqui substituem os do layout raiz — canonical fixo no host
 * institucional, sempre indexável (ver src/app/robots.ts e sitemap.ts).
 *
 * Fase 5.3, Etapa 2: o Root Layout (src/app/layout.tsx) não decide mais
 * por host — sempre renderiza o header/footer genérico da bilheteria (pra
 * nunca precisar de `headers()`, o que forçaria toda a árvore a ser
 * dinâmica e impediria cache real aqui). Esta página se sobrepõe a esse
 * header/footer com um wrapper `fixed inset-0` — mesmo padrão que
 * dashboard/admin/produtor já usam pra cobrir o shell público (ver
 * dashboard/layout.tsx).
 *
 * Fase 6 — redesign completo (bold/editorial): tipografia própria (Big
 * Shoulders Display via <link>, next/font não cobre essa família nesta
 * versão do Next; Instrument Sans e Geist Mono via next/font/google),
 * ticker "ao vivo" ilustrativo, constelação animada e blocos de cor sólida
 * por módulo. Estrutura de conteúdo (jornada, módulos, stats, CTA) mantida
 * do redesign anterior — só a linguagem visual mudou.
 */
export const metadata: Metadata = {
  title: "Nokta — a plataforma que conecta toda a operação do seu evento ou casa",
  description:
    "A Nokta reúne eventos, ingressos, convidados, reservas, entrada, mesas, comandas, pedidos, estoque, financeiro e insights numa única plataforma. Ative só o que a sua operação precisa.",
  alternates: { canonical: "https://www.nokta.live" },
  openGraph: {
    title: "Nokta — plataforma única de gestão para eventos e operações",
    description:
      "Eventos, ingressos, reservas, operação, cardápio, estoque, financeiro e insights: tudo numa única plataforma, com os módulos que a sua operação ativa.",
    url: "https://www.nokta.live",
    siteName: "Nokta",
    locale: "pt_BR",
    type: "website",
  },
};

export const revalidate = 60;

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--lp-font-body",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--lp-font-mono",
});

// Dados ilustrativos — a operação em si é fictícia (não são números reais
// de clientes), só pra dar textura de "atividade" ao ticker do topo.
const TICKER_ITEMS = [
  { label: "ARENA SP", detail: "1.240 ingressos", tone: "up" as const },
  { label: "BEACH CLUB", detail: "32 mesas ativas", tone: "dot" as const },
  { label: "CASA DE SHOW", detail: "R$ 127,9k em caixa", tone: "up" as const },
  { label: "BAR CENTRO", detail: "18 comandas abertas", tone: "plain" as const },
  { label: "ROOFTOP", detail: "94% check-in", tone: "up" as const },
  { label: "CLUB NORTE", detail: "2 alertas de estoque", tone: "dot" as const },
];

const JORNADA = [
  { num: "01", icon: Ticket, title: "Aquisição", desc: "Eventos e ingressos" },
  { num: "02", icon: DoorOpen, title: "Entrada", desc: "Check-in e acesso" },
  { num: "03", icon: ClipboardList, title: "Operação", desc: "Mesas e comandas" },
  { num: "04", icon: ShoppingBag, title: "Consumo", desc: "Cardápio e produtos" },
  { num: "05", icon: Boxes, title: "Gestão", desc: "Estoque e equipe" },
  { num: "06", icon: LineChart, title: "Análise", desc: "Insights da operação" },
];

const MODULOS_EXTRA = [
  "Reservas & relacionamento",
  "Cardápio & produtos",
  "Check-in & controle de acesso",
  "Equipe · papéis & permissões",
  "Fila de espera",
  "Repasses",
];

function Brand({ className = "text-[30px]" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-[11px] font-[family-name:var(--lp-font-display)] font-bold lowercase tracking-[0.01em] text-[#140a24] ${className}`}
    >
      <span
        className="lp-brand-b block h-[26px] w-[26px] rounded-full"
        style={{
          background: "conic-gradient(from 210deg,#7c3aed,#e5308f,#8b5cf6,#7c3aed)",
          boxShadow: "0 0 16px rgba(139,92,246,.5)",
        }}
      />
      nokta
    </Link>
  );
}

export default function InstitucionalPage() {
  const entrarUrl = getPlatformUrl("/login");
  const cadastroUrl = getPlatformUrl("/register?ctx=produtor");
  const ticketsUrl = getPublicTicketsUrl("/");

  return (
    <div
      id="institucional-lp"
      className={`lp-root fixed inset-0 z-50 flex w-full max-w-full flex-col overflow-x-hidden overflow-y-auto bg-white text-[#140a24] ${instrumentSans.variable} ${geistMono.variable}`}
      style={
        {
          "--lp-font-display": "'Big Shoulders Display', system-ui, sans-serif",
          fontFamily: "var(--lp-font-body), system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      {/* Fonte sem suporte em next/font/google nesta versão do Next — carregada via link, escopo só desta página (não afeta o resto do app). */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700&display=swap"
      />
      <ScrollEffects />

        {/* ── TICKER ────────────────────────────────────────── */}
        <div className="lp-ticker flex h-[46px] items-center overflow-hidden bg-[#0b0616] text-[13px] tracking-[0.04em] text-[#cdb9ff] font-[family-name:var(--lp-font-mono)]">
          <div className="flex h-full flex-none items-center gap-[9px] bg-[#c9f24e] px-5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#0b0616]">
            <span className="lp-live-dot h-[7px] w-[7px] rounded-full bg-[#0b0616]" />
            ao vivo
          </div>
          <div className="relative h-full min-w-0 flex-1 overflow-hidden">
            <div className="lp-ticker-track flex h-full w-max items-center">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center">
                  {TICKER_ITEMS.map((item, i) => (
                    <div key={`${copy}-${item.label}-${i}`} className="flex items-center">
                      <div className="inline-flex items-center gap-[9px] whitespace-nowrap px-[22px]">
                        <b className="text-white">{item.label}</b>
                        {item.tone === "up" && <span className="text-[#c9f24e]">↑</span>}
                        {item.tone === "dot" && <span className="text-[#e5308f]">●</span>}
                        <span>{item.detail}</span>
                      </div>
                      <span className="px-0.5 opacity-25">/</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── NAV ───────────────────────────────────────────── */}
        <div className="sticky top-0 z-[60] border-b border-[#ece6f8] bg-white/[.82] backdrop-blur-md">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-[18px] sm:px-8 sm:py-[22px]">
            <Brand className="text-[22px] sm:text-[30px]" />
            <nav className="hidden gap-[38px] text-[13px] tracking-[0.06em] text-[#4a4066] font-[family-name:var(--lp-font-mono)] lg:flex">
              <a href="#jornada" className="hover:text-[#7c3aed] transition-colors">JORNADA</a>
              <a href="#modulos" className="hover:text-[#7c3aed] transition-colors">MÓDULOS</a>
              <a href="#cta" className="hover:text-[#7c3aed] transition-colors">PLATAFORMA</a>
            </nav>
            <div className="flex items-center gap-2.5 sm:gap-5">
              <a href={entrarUrl} className="hidden text-[13px] font-[family-name:var(--lp-font-mono)] hover:text-[#7c3aed] transition-colors sm:inline">
                Entrar
              </a>
              <a
                href={cadastroUrl}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#c9f24e] px-4 py-[10px] text-[11px] font-bold uppercase tracking-[0.06em] text-[#0b0616] font-[family-name:var(--lp-font-mono)] shadow-[0_12px_30px_-12px_rgba(201,242,78,.9)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-12px_rgba(201,242,78,1)] sm:gap-2 sm:px-6 sm:py-[14px] sm:text-[13px] sm:tracking-[0.09em]"
              >
                Começar agora
              </a>
            </div>
          </div>
        </div>

        <main className="flex-1">
          {/* ── HERO ──────────────────────────────────────────── */}
          <header className="relative overflow-hidden px-5 pb-14 pt-16 sm:px-8 lg:pb-14 lg:pt-16">
            <div
              className="lp-hero-glow pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  "radial-gradient(44% 55% at 82% 30%,rgba(229,48,143,.12),transparent 60%),radial-gradient(50% 62% at 12% 8%,rgba(124,58,237,.14),transparent 62%),radial-gradient(60% 80% at 55% 108%,rgba(40,194,224,.08),transparent 60%)",
              }}
            />
            <div className="relative z-[2] mx-auto grid max-w-[1320px] items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="lp-anim lp-d1 mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#ece6f8] bg-white px-4 py-2">
                  <span className="lp-pulse-dot h-[7px] w-[7px] rounded-full bg-[#c9f24e] shadow-[0_0_8px_#c9f24e]" />
                  <span className="text-[11.5px] uppercase tracking-[0.15em] text-[#4a4066] font-[family-name:var(--lp-font-mono)]">
                    Plataforma completa de eventos e operação
                  </span>
                </div>

                <h1 className="lp-anim lp-d2 mb-6 font-[family-name:var(--lp-font-display)] text-[52px] font-bold uppercase leading-[.86] sm:text-[72px] lg:text-[92px]">
                  Toda a
                  <br />
                  operação
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(96deg,#7c3aed,#e5308f)" }}
                  >
                    num só
                  </span>{" "}
                  lugar.
                </h1>

                <p className="lp-anim lp-d3 mb-[30px] max-w-[440px] text-[18px] leading-[1.55] text-[#4a4066]">
                  Da venda de ingressos ao relatório final. Conecte pessoas, processos e dados — e
                  foque no que importa: fazer o seu evento acontecer.
                </p>

                <div className="lp-anim lp-d4 mb-[38px] flex flex-wrap items-center gap-3.5">
                  <a
                    href={cadastroUrl}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#c9f24e] px-[30px] py-[17px] text-[14px] font-bold uppercase tracking-[0.09em] text-[#0b0616] font-[family-name:var(--lp-font-mono)] shadow-[0_12px_30px_-12px_rgba(201,242,78,.9)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-12px_rgba(201,242,78,1)]"
                  >
                    Começar agora
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </a>
                  <a
                    href={ticketsUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ece6f8] px-[30px] py-[17px] text-[14px] font-bold uppercase tracking-[0.09em] text-[#140a24] font-[family-name:var(--lp-font-mono)] transition-all hover:-translate-y-0.5 hover:border-[#7c3aed]"
                  >
                    Conhecer a bilheteria
                  </a>
                </div>

                <div className="lp-anim lp-d5 flex flex-wrap gap-[34px]">
                  <div className="max-w-[150px]">
                    <b className="mb-[3px] block text-[12px] tracking-[0.06em] font-[family-name:var(--lp-font-mono)]">SEGURO</b>
                    <span className="text-[12.5px] text-[#8b81a6]">Dados protegidos e criptografados</span>
                  </div>
                  <div className="max-w-[150px]">
                    <b className="mb-[3px] block text-[12px] tracking-[0.06em] font-[family-name:var(--lp-font-mono)]">TEMPO REAL</b>
                    <span className="text-[12.5px] text-[#8b81a6]">Informações atualizadas na hora</span>
                  </div>
                  <div className="max-w-[150px]">
                    <b className="mb-[3px] block text-[12px] tracking-[0.06em] font-[family-name:var(--lp-font-mono)]">SUPORTE</b>
                    <span className="text-[12.5px] text-[#8b81a6]">Time especializado com você</span>
                  </div>
                </div>
              </div>

              {/* CONSTELAÇÃO */}
              <div className="lp-const relative mx-auto hidden h-[560px] w-full max-w-[560px] sm:block">
                <svg
                  className="lp-const-lines absolute inset-0 z-[1] h-full w-full"
                  viewBox="0 0 620 560"
                  fill="none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g stroke="rgba(124,58,237,.3)" strokeWidth="1.5">
                    <path d="M120 110 L310 280" />
                    <path d="M95 300 L310 280" />
                    <path d="M150 470 L310 280" />
                    <path d="M500 120 L310 280" />
                    <path d="M525 320 L310 280" />
                    <path d="M470 480 L310 280" />
                  </g>
                  <g fill="#e5308f">
                    <circle cx="120" cy="110" r="3.5" />
                    <circle cx="95" cy="300" r="3.5" />
                    <circle cx="150" cy="470" r="3.5" />
                    <circle cx="500" cy="120" r="3.5" />
                    <circle cx="525" cy="320" r="3.5" />
                    <circle cx="470" cy="480" r="3.5" />
                  </g>
                </svg>

                <div
                  className="lp-halo absolute left-[calc(50%-110px)] top-[calc(50%-110px)] z-[1] h-[220px] w-[220px] rounded-full"
                  style={{ background: "radial-gradient(circle,rgba(139,92,246,.28),transparent 68%)" }}
                />
                <div className="lp-ring absolute left-[calc(50%-96px)] top-[calc(50%-96px)] z-[1] h-[192px] w-[192px] rounded-full border border-dashed border-[rgba(124,58,237,.3)]" />
                <div className="absolute left-[calc(50%-66px)] top-[calc(50%-66px)] z-[3] flex h-[132px] w-[132px] items-center justify-center rounded-[34px] border border-[#ece6f8] bg-white shadow-[0_30px_60px_-20px_rgba(124,58,237,.55)]">
                  <div
                    className="lp-core-disc h-[52px] w-[52px] rounded-full"
                    style={{ background: "conic-gradient(from 210deg,#7c3aed,#e5308f,#8b5cf6,#7c3aed)" }}
                  />
                </div>

                <div className="lp-node-ico absolute left-[88px] top-[78px] z-[2] flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ece6f8] bg-white shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]">
                  <Ticket size={26} className="text-[#7c3aed]" strokeWidth={1.8} />
                </div>
                <div
                  className="absolute left-[63px] top-[268px] z-[2] h-[60px] w-[60px] overflow-hidden rounded-2xl border border-[#ece6f8] shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]"
                  style={{ background: "linear-gradient(135deg,#e5308f,#7c3aed)" }}
                />
                <div className="lp-node-ico absolute left-[118px] top-[438px] z-[2] flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ece6f8] bg-white shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]">
                  <ClipboardList size={26} className="text-[#7c3aed]" strokeWidth={1.8} />
                </div>
                <div className="lp-node-ico absolute left-[468px] top-[88px] z-[2] flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ece6f8] bg-white shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]">
                  <LineChart size={26} className="text-[#7c3aed]" strokeWidth={1.8} />
                </div>
                <div
                  className="absolute left-[495px] top-[290px] z-[2] h-[60px] w-[60px] overflow-hidden rounded-2xl border border-[#ece6f8] shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]"
                  style={{ background: "linear-gradient(135deg,#28c2e0,#7c3aed)" }}
                />
                <div className="lp-node-ico absolute left-[438px] top-[448px] z-[2] flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ece6f8] bg-white shadow-[0_14px_30px_-14px_rgba(20,10,36,.3)]">
                  <Wallet size={26} className="text-[#7c3aed]" strokeWidth={1.8} />
                </div>

                <div className="lp-float-a absolute left-[calc(50%-82px)] top-[2px] z-[4] w-[186px] rounded-[14px] border border-[#ece6f8] bg-white p-[13px_15px] shadow-[0_22px_45px_-18px_rgba(20,10,36,.3)]">
                  <div className="mb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">
                    Ingressos · lote 2
                  </div>
                  <div className="font-[family-name:var(--lp-font-display)] text-[30px] font-bold leading-none">R$ 48.250</div>
                  <div className="mt-1 text-[11px] text-[#15a34a] font-[family-name:var(--lp-font-mono)]">↑ 1.240 emitidos hoje</div>
                </div>

                <div className="lp-float-b absolute right-[-30px] top-[228px] z-[4] w-[196px] rounded-[14px] border border-[#ece6f8] bg-white p-[13px_15px] shadow-[0_22px_45px_-18px_rgba(20,10,36,.3)]">
                  <div className="mb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">
                    Comandas · salão
                  </div>
                  <div className="flex items-center gap-2 py-[5px] text-[12.5px]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
                    Mesa 14 · 3 itens
                    <b className="ml-auto font-[family-name:var(--lp-font-mono)]">R$ 186</b>
                  </div>
                  <div className="flex items-center gap-2 py-[5px] text-[12.5px]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
                    Mesa 07 · 1 item
                    <b className="ml-auto font-[family-name:var(--lp-font-mono)]">R$ 54</b>
                  </div>
                  <div className="flex items-center gap-2 py-[5px] text-[12.5px]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#f59e0b]" />
                    Mesa 22 · abrir
                    <b className="ml-auto font-[family-name:var(--lp-font-mono)]">—</b>
                  </div>
                </div>

                <div className="lp-float-c absolute left-[calc(50%-80px)] top-[478px] z-[4] w-[190px] rounded-[14px] border border-[#ece6f8] bg-white p-[13px_15px] shadow-[0_22px_45px_-18px_rgba(20,10,36,.3)]">
                  <div className="mb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">
                    Financeiro · caixa
                  </div>
                  <div className="lp-spark mt-1.5 flex h-[38px] items-end gap-1">
                    {[40, 62, 48, 82, 66, 100, 76].map((h, i) => (
                      <i
                        key={i}
                        className="w-2 rounded-sm"
                        style={{ height: `${h}%`, background: "linear-gradient(180deg,#e5308f,#7c3aed)" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ── STATS ─────────────────────────────────────────── */}
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="lp-reveal grid grid-cols-2 border-y border-[#ece6f8] lg:grid-cols-4">
              {[
                { value: 2500, decimals: 0, prefix: "+", emph: "prefix" as const, label: "Eventos realizados" },
                { value: 1.2, decimals: 1, prefix: "+", suffix: "M", emph: "prefix" as const, label: "Ingressos emitidos" },
                { value: 450, decimals: 0, prefix: "+", emph: "prefix" as const, label: "Operações ativas" },
                { value: 98.7, decimals: 1, suffix: "%", emph: "suffix" as const, label: "Uptime da plataforma" },
              ].map((s, i, arr) => (
                <div key={s.label} className={`px-[30px] py-[34px] ${i < arr.length - 1 ? "border-r border-[#ece6f8]" : ""}`}>
                  <div
                    className="lp-stat-num font-[family-name:var(--lp-font-display)] text-[44px] font-bold leading-[.9] sm:text-[64px] [&_em]:not-italic [&_em]:text-[#e5308f]"
                    data-value={s.value}
                    data-decimals={s.decimals}
                    data-prefix={s.prefix || ""}
                    data-suffix={s.suffix || ""}
                    data-emph={s.emph}
                  />
                  <div className="mt-2 text-[12px] uppercase tracking-[0.08em] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── JORNADA ───────────────────────────────────────── */}
          <section className="px-5 py-[88px] sm:px-8" id="jornada">
            <div className="mx-auto max-w-[1320px]">
              <div className="lp-reveal mb-12 max-w-[720px]">
                <span className="mb-3.5 block text-[12px] uppercase tracking-[0.28em] text-[#7c3aed] font-[family-name:var(--lp-font-mono)]">
                  Do começo ao fim
                </span>
                <h2 className="font-[family-name:var(--lp-font-display)] text-[40px] font-bold uppercase leading-[.9] sm:text-[56px] lg:text-[64px]">
                  Uma jornada,
                  <br />
                  seis etapas
                </h2>
                <p className="mt-3.5 max-w-[520px] text-[17px] text-[#8b81a6]">
                  Do primeiro ingresso ao relatório final. Ative só o que a sua operação precisa.
                </p>
              </div>

              <div className="lp-reveal lp-rd1 grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#ece6f8] bg-[#f7f4ff] sm:grid-cols-3 lg:grid-cols-6">
                {JORNADA.map((etapa, i) => (
                  <div
                    key={etapa.num}
                    className={`group relative bg-white p-[26px_22px_30px] transition-colors hover:bg-[#f7f4ff] ${
                      i < JORNADA.length - 1 ? "border-r border-[#ece6f8]" : ""
                    } ${i % 2 === 0 ? "" : ""}`}
                  >
                    <div className="text-[12px] tracking-[0.1em] text-[#7c3aed] font-[family-name:var(--lp-font-mono)]">
                      {etapa.num}
                    </div>
                    <div className="my-[18px] flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(124,58,237,.1)] transition-transform group-hover:-translate-y-1 group-hover:scale-[1.06]">
                      <etapa.icon size={22} className="text-[#7c3aed]" strokeWidth={1.9} />
                    </div>
                    <h4 className="font-[family-name:var(--lp-font-display)] text-[27px] font-bold uppercase leading-[.95]">
                      {etapa.title}
                    </h4>
                    <p className="mt-[7px] text-[12px] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">{etapa.desc}</p>
                    {i < JORNADA.length - 1 && (
                      <div className="lp-link-arrow absolute right-[-9px] top-[38px] z-[3] hidden bg-white p-0.5 text-[18px] text-[#e5308f] lg:block">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── MÓDULOS ───────────────────────────────────────── */}
          <section className="px-5 pb-[88px] sm:px-8" id="modulos">
            <div className="mx-auto max-w-[1320px]">
              <div className="lp-reveal mb-12 max-w-[720px]">
                <span className="mb-3.5 block text-[12px] uppercase tracking-[0.28em] text-[#7c3aed] font-[family-name:var(--lp-font-mono)]">
                  Tudo que você precisa
                </span>
                <h2 className="font-[family-name:var(--lp-font-display)] text-[40px] font-bold uppercase leading-[.9] sm:text-[56px] lg:text-[64px]">
                  Módulos que
                  <br />
                  trabalham juntos
                </h2>
                <p className="mt-3.5 max-w-[520px] text-[17px] text-[#8b81a6]">
                  Cada um resolve uma parte da operação. Juntos, resolvem o negócio inteiro.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lp-blk lp-reveal lp-rd1 flex min-h-[320px] flex-col overflow-hidden rounded-[22px] bg-[#e5308f] p-[26px_24px_28px] text-white transition-transform hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(229,48,143,.6)]">
                  <div className="text-[11px] uppercase tracking-[0.14em] opacity-80 font-[family-name:var(--lp-font-mono)]">
                    01 · Aquisição
                  </div>
                  <h3 className="my-3 font-[family-name:var(--lp-font-display)] text-[36px] font-bold uppercase leading-[.9]">
                    Eventos &amp; ingressos
                  </h3>
                  <p className="text-[14px] leading-[1.5] opacity-90">
                    Crie eventos, configure lotes e receba com um checkout rápido e seguro.
                  </p>
                  <svg className="lp-blk-art mt-auto self-end opacity-55" width="110" height="82" viewBox="0 0 120 90" fill="none" stroke="#fff" strokeWidth="1.4">
                    <rect x="8" y="20" width="70" height="46" rx="6" />
                    <path d="M8 40h70M43 20v46" strokeDasharray="3 3" />
                    <circle cx="95" cy="55" r="18" />
                  </svg>
                  <div className="lp-blk-go mt-4 text-[12px] uppercase tracking-[0.08em] font-[family-name:var(--lp-font-mono)]">
                    Saiba mais →
                  </div>
                </div>

                <div className="lp-blk lp-reveal lp-rd2 flex min-h-[320px] flex-col overflow-hidden rounded-[22px] bg-[#7c3aed] p-[26px_24px_28px] text-white transition-transform hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(124,58,237,.6)]">
                  <div className="text-[11px] uppercase tracking-[0.14em] opacity-80 font-[family-name:var(--lp-font-mono)]">
                    03 · Operação
                  </div>
                  <h3 className="my-3 font-[family-name:var(--lp-font-display)] text-[36px] font-bold uppercase leading-[.9]">
                    Comandas em tempo real
                  </h3>
                  <p className="text-[14px] leading-[1.5] opacity-90">
                    Mesas, comandas e pedidos que se atualizam entre salão e cozinha.
                  </p>
                  <svg className="lp-blk-art mt-auto self-end opacity-55" width="110" height="82" viewBox="0 0 120 90" fill="none" stroke="#fff" strokeWidth="1.4">
                    <rect x="10" y="14" width="100" height="62" rx="6" />
                    <path d="M10 34h100M35 14v62M35 55h75" />
                  </svg>
                  <div className="lp-blk-go mt-4 text-[12px] uppercase tracking-[0.08em] font-[family-name:var(--lp-font-mono)]">
                    Saiba mais →
                  </div>
                </div>

                <div className="lp-blk lp-reveal lp-rd3 flex min-h-[320px] flex-col overflow-hidden rounded-[22px] bg-[#c9f24e] p-[26px_24px_28px] text-[#0b0616] transition-transform hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(201,242,78,.7)]">
                  <div className="text-[11px] uppercase tracking-[0.14em] opacity-80 font-[family-name:var(--lp-font-mono)]">
                    05 · Gestão
                  </div>
                  <h3 className="my-3 font-[family-name:var(--lp-font-display)] text-[36px] font-bold uppercase leading-[.9]">
                    Estoque &amp; financeiro
                  </h3>
                  <p className="text-[14px] leading-[1.5] opacity-90">
                    Baixa automática a cada venda e o caixa consolidado num painel só.
                  </p>
                  <svg className="lp-blk-art mt-auto self-end opacity-70" width="110" height="82" viewBox="0 0 120 90" fill="none" stroke="#0b0616" strokeWidth="1.4">
                    <path d="M12 70V44M34 70V26M56 70V52M78 70V16M100 70V38" />
                    <path d="M8 70h100" />
                  </svg>
                  <div className="lp-blk-go mt-4 text-[12px] uppercase tracking-[0.08em] font-[family-name:var(--lp-font-mono)]">
                    Saiba mais →
                  </div>
                </div>

                <div className="lp-blk lp-reveal lp-rd4 flex min-h-[320px] flex-col overflow-hidden rounded-[22px] bg-[#28c2e0] p-[26px_24px_28px] text-[#0b0616] transition-transform hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgba(40,194,224,.6)]">
                  <div className="text-[11px] uppercase tracking-[0.14em] opacity-80 font-[family-name:var(--lp-font-mono)]">
                    06 · Análise
                  </div>
                  <h3 className="my-3 font-[family-name:var(--lp-font-display)] text-[36px] font-bold uppercase leading-[.9]">
                    Insights de tudo
                  </h3>
                  <p className="text-[14px] leading-[1.5] opacity-90">
                    Vendas, operação e desempenho reunidos para decidir mais rápido.
                  </p>
                  <svg className="lp-blk-art mt-auto self-end opacity-70" width="110" height="82" viewBox="0 0 120 90" fill="none" stroke="#0b0616" strokeWidth="1.4">
                    <path d="M10 66L40 40l22 16 38-42" />
                    <circle cx="40" cy="40" r="4" />
                    <circle cx="62" cy="56" r="4" />
                  </svg>
                  <div className="lp-blk-go mt-4 text-[12px] uppercase tracking-[0.08em] font-[family-name:var(--lp-font-mono)]">
                    Saiba mais →
                  </div>
                </div>
              </div>

              <div className="lp-reveal lp-rd2 mt-4 flex flex-wrap gap-3">
                {MODULOS_EXTRA.map((m) => (
                  <div
                    key={m}
                    className="inline-flex items-center gap-2.5 rounded-full border border-[#ece6f8] bg-white px-5 py-3 text-[13px] text-[#4a4066] font-[family-name:var(--lp-font-mono)] transition-all hover:-translate-y-0.5 hover:border-[#7c3aed]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="px-5 sm:px-8" id="cta">
            <section
              className="lp-cta-shimmer lp-reveal mx-auto max-w-[1320px] overflow-hidden rounded-[28px] px-6 py-20 text-center sm:px-10"
              style={{ background: "linear-gradient(120deg,#4712a8,#7c3aed 40%,#e5308f 75%,#7c3aed)" }}
            >
              <h2 className="relative font-[family-name:var(--lp-font-display)] text-[44px] font-bold uppercase leading-[.86] text-white sm:text-[64px] lg:text-[80px]">
                Pronto pra
                <br />a próxima etapa?
              </h2>
              <p className="relative mx-auto mt-5 max-w-[520px] text-[18px] text-[#f0e6ff]">
                Comece agora e leve a gestão do seu evento pro próximo nível. Ative só os módulos
                que você precisa.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3.5">
                <a
                  href={cadastroUrl}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#c9f24e] px-[30px] py-[17px] text-[14px] font-bold uppercase tracking-[0.09em] text-[#0b0616] font-[family-name:var(--lp-font-mono)] shadow-[0_12px_30px_-12px_rgba(201,242,78,.9)] transition-all hover:-translate-y-0.5"
                >
                  Começar agora
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a
                  href="mailto:contato@noktatickets.com.br"
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 px-[30px] py-[17px] text-[14px] font-bold uppercase tracking-[0.09em] text-white font-[family-name:var(--lp-font-mono)] transition-all hover:-translate-y-0.5"
                >
                  Falar com especialista
                </a>
              </div>
            </section>
          </div>
        </main>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <footer className="mt-20 border-t border-[#ece6f8] px-5 py-[60px] sm:px-8">
          <div className="mx-auto flex max-w-[1320px] flex-wrap justify-between gap-10">
            <div className="max-w-[320px]">
              <Brand />
              <p className="mt-3.5 text-[12.5px] leading-[1.7] text-[#8b81a6] font-[family-name:var(--lp-font-mono)]">
                Eventos, ingressos, reservas, operação, cardápio, estoque, financeiro e insights:
                tudo numa única plataforma, com os módulos que a sua operação ativa.
              </p>
            </div>
            <div className="flex flex-wrap gap-14 text-[13px] font-[family-name:var(--lp-font-mono)]">
              <div>
                <b className="mb-3.5 block text-[11px] uppercase tracking-[0.14em] text-[#7c3aed]">Plataforma</b>
                <a href="#modulos" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Módulos</a>
                <a href="#jornada" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Jornada</a>
                <a href={ticketsUrl} className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Bilheteria</a>
              </div>
              <div>
                <b className="mb-3.5 block text-[11px] uppercase tracking-[0.14em] text-[#7c3aed]">Empresa</b>
                <a href={entrarUrl} className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Entrar</a>
                <a href="mailto:contato@noktatickets.com.br" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Contato</a>
              </div>
              <div>
                <b className="mb-3.5 block text-[11px] uppercase tracking-[0.14em] text-[#7c3aed]">Legal</b>
                <Link href="/termos" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Termos de Uso</Link>
                <Link href="/privacidade" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Privacidade</Link>
                <Link href="/politica-de-cancelamento" className="block py-1 text-[#4a4066] transition-all hover:translate-x-1 hover:text-[#140a24]">Reembolso</Link>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-[1320px] text-xs text-[#a4a7ae]">
            Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39
          </div>
        </footer>

      <svg className="lp-grain" xmlns="http://www.w3.org/2000/svg">
        <filter id="lp-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lp-noise)" />
      </svg>
    </div>
  );
}
