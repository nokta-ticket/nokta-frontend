import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  Ticket,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Zap,
  Headset,
} from "lucide-react";
import { getPlatformUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { NoktaBrandMark as BrandMark } from "@/components/layout/nokta-brand-mark";

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
 * dashboard/layout.tsx). É cobertura só visual (o header/footer de
 * bilheteria continua no DOM, coberto) — mesma limitação de acessibilidade
 * que o padrão já tem em dashboard/admin/produtor hoje, não uma regressão
 * introduzida aqui.
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

// Fase 5.3, Etapa 4 — cache real, não só o header declarado: conteúdo
// 100% estático (sem dados de usuário, sem chamada à API pra renderizar),
// então o Next pode gerar uma vez e servir do cache de CDN da Vercel,
// revalidando no máximo a cada 60s (ISR) — sem depender de nenhuma API
// dinâmica em nenhum ancestral (ver Root Layout, Etapa 2). Funciona
// através do rewrite do Middleware (alvo fixo, suportado pela Vercel).
export const revalidate = 60;

const GRADIENT = "linear-gradient(100deg,#00DDFF 0%,#7B61FF 48%,#FF00D4 100%)";

const TRUST = [
  { icon: ShieldCheck, title: "Seguro e confiável", desc: "Dados protegidos e criptografados" },
  { icon: Zap, title: "Tudo em tempo real", desc: "Informações atualizadas na hora" },
  { icon: Headset, title: "Suporte próximo", desc: "Time especializado com você" },
];

const JORNADA = [
  { icon: Ticket, label: "Aquisição", desc: "Eventos e venda de ingressos" },
  { icon: ClipboardList, label: "Entrada", desc: "Check-in e controle de acesso" },
  { icon: UtensilsCrossed, label: "Operação", desc: "Mesas, comandas e pedidos" },
  { icon: Boxes, label: "Consumo", desc: "Cardápio e produtos" },
  { icon: Wallet, label: "Gestão", desc: "Estoque, equipe e financeiro" },
  { icon: BarChart3, label: "Análise", desc: "Insights de toda a operação" },
];

const CAPACIDADES = [
  { icon: Ticket, title: "Eventos e ingressos", desc: "Criação de eventos, lotes, checkout e venda de ingressos." },
  { icon: CalendarCheck, title: "Reservas e relacionamento", desc: "Reservas de mesa, fila de espera e relacionamento com o público." },
  { icon: ClipboardList, title: "Operação e comandas", desc: "Mesas, comandas e pedidos em tempo real no salão." },
  { icon: UtensilsCrossed, title: "Cardápio e produtos", desc: "Cardápio, categorias e produtos vendidos na operação." },
  { icon: Boxes, title: "Estoque", desc: "Controle de estoque integrado ao que é vendido e consumido." },
  { icon: Wallet, title: "Financeiro", desc: "Fechamento de caixa, repasses e visão financeira consolidada." },
  { icon: BarChart3, title: "Insights", desc: "Indicadores de vendas, operação e desempenho num só lugar." },
  { icon: UsersRound, title: "Equipe", desc: "Convites, papéis e permissões para quem opera o dia a dia." },
];

const STATS = [
  { icon: UsersRound, value: "+2.500", label: "Eventos realizados" },
  { icon: Ticket, value: "+1,2M", label: "Ingressos emitidos" },
  { icon: UtensilsCrossed, value: "+450", label: "Operações ativas" },
  { icon: BarChart3, value: "98,7%", label: "Uptime da plataforma" },
];

const DEPOIMENTOS = [
  {
    initials: "RN",
    quote:
      "A Nokta mudou completamente a forma como operamos nossos eventos. Tudo integrado, suporte incrível e relatórios que realmente ajudam nas decisões.",
    name: "Rafael Nascimento",
    role: "Produtor de eventos",
  },
  {
    initials: "JM",
    quote:
      "Com a Nokta, ganhamos agilidade no atendimento e total controle do caixa e das comandas. A equipe se adaptou rápido e os resultados apareceram desde o primeiro evento.",
    name: "Juliana Martins",
    role: "Beach Club & Restaurante",
  },
  {
    initials: "LA",
    quote:
      "Plataforma completa, intuitiva e que acompanha o ritmo do nosso negócio. Recomendo para qualquer produtor ou gestor de operação.",
    name: "Lucas Almeida",
    role: "Casa de Shows",
  },
];

export default function InstitucionalPage() {
  const entrarUrl = getPlatformUrl("/login");
  // /register (não /login) — quem clica em "Começar agora" ainda não tem
  // conta; ctx=produtor garante onboarding empresarial após o cadastro (ver
  // register/_components/forms-register.tsx).
  const cadastroUrl = getPlatformUrl("/register?ctx=produtor");
  const ticketsUrl = getPublicTicketsUrl("/");

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="w-full sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-20">
          <BrandMark className="flex-1" />
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={entrarUrl}
              className="inline-flex items-center rounded-lg border border-gray-200 px-3 sm:px-4 py-2 text-sm font-semibold text-[#181d27] hover:bg-gray-50 transition"
            >
              Entrar
            </a>
            <a
              href={cadastroUrl}
              className="inline-flex items-center rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(123,97,255,0.45)] transition hover:opacity-90"
              style={{ background: GRADIENT }}
            >
              Começar agora
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -z-10 left-[38%] top-[60px] h-[280px] w-[260px] rounded-full opacity-60 blur-[70px]"
            style={{ background: "rgba(0,180,216,0.35)" }}
          />
          <div
            className="pointer-events-none absolute -z-10 -right-24 top-10 h-[380px] w-[320px] rounded-full opacity-50 blur-[80px]"
            style={{ background: "rgba(255,0,212,0.3)" }}
          />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 lg:pt-24 lg:pb-20 grid lg:grid-cols-[0.9fr_1.1fr] items-center gap-10 lg:gap-12">
            <div>
              <span
                className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] font-bold mb-5"
                style={{ background: "linear-gradient(90deg,#eaf9ff,#f4e9ff)", color: "#6d59ef" }}
              >
                Plataforma completa de eventos e operação
              </span>

              <h1 className="font-sans text-[42px] sm:text-[52px] lg:text-[60px] font-extrabold leading-[1.06] tracking-[-2px] text-[#181d27]">
                Toda a operação
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: GRADIENT }}
                >
                  do seu evento
                </span>
                <br />
                em um só lugar.
              </h1>

              <p className="mt-6 text-[17px] leading-relaxed text-[#667085] max-w-[520px]">
                Da venda de ingressos ao relatório final. Conectamos pessoas, processos e dados
                para você focar no que realmente importa: fazer o seu evento acontecer.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={cadastroUrl}
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-6px_rgba(123,97,255,0.4)] transition hover:-translate-y-0.5"
                  style={{ background: GRADIENT }}
                >
                  Começar agora
                </a>
                <a
                  href={ticketsUrl}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-6 py-3.5 text-sm font-bold text-[#181d27] hover:bg-gray-50 hover:border-violet-200 transition hover:-translate-y-0.5"
                >
                  Conhecer a bilheteria
                </a>
              </div>

              <div className="mt-11 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[560px]">
                {TRUST.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg,#e8fbff,#f7e5ff)", color: "#6a5cf3" }}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong className="block text-[12px] font-bold text-[#181d27] leading-tight">{title}</strong>
                      <span className="block mt-1 text-[11px] text-[#7c8494] leading-snug">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Image
                src="/hero-laptop.png"
                alt="Dashboard da Nokta em um notebook"
                width={900}
                height={620}
                priority
                className="w-full h-auto drop-shadow-[0_30px_40px_rgba(30,31,47,0.14)]"
              />
            </div>
          </div>
        </section>

        {/* ── JORNADA COMPLETA ───────────────────────────────── */}
        <section className="bg-gradient-to-b from-[#fbfcff] to-[#f9faff] py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.08em] mb-2.5" style={{ color: "#7b70ff" }}>
              Do começo ao fim
            </p>
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#181d27]">
              Uma jornada completa, do primeiro ingresso ao relatório final
            </h2>

            <div className="relative mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12">
              <div className="hidden lg:block absolute left-[8.5%] right-[8.5%] top-[52px] h-px bg-[#dfe3ee]" />
              {JORNADA.map((etapa, i) => (
                <div key={etapa.label} className="relative flex flex-col items-center text-center gap-3">
                  <div
                    className="absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-[0_7px_18px_-4px_rgba(126,87,244,0.4)]"
                    style={{ background: GRADIENT }}
                  >
                    {i + 1}
                  </div>
                  <div
                    className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[#e7e6ef] bg-gradient-to-br from-white to-[#f4eaff] text-[#1f2440] shadow-[0_12px_28px_-8px_rgba(73,68,111,0.18)]"
                  >
                    <etapa.icon size={24} />
                  </div>
                  <h3 className="font-sans text-sm font-bold text-[#181d27]">{etapa.label}</h3>
                  <p className="text-xs text-[#767f90] max-w-[150px] leading-relaxed">{etapa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAPACIDADES ────────────────────────────────────── */}
        <section className="py-20" id="recursos">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.08em] mb-2.5" style={{ color: "#7b70ff" }}>
              Tudo que você precisa
            </p>
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#181d27]">
              Capacidades que trabalham juntas para simplificar sua operação
            </h2>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAPACIDADES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-gray-100 bg-white p-6 shadow-[0_3px_10px_-4px_rgba(28,34,54,0.06)] transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_36px_-12px_rgba(54,43,111,0.16)]"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[11px] mb-5"
                    style={{ background: "linear-gradient(135deg,#eaf9ff,#f6e6ff)", color: "#5545da" }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-sans text-[15px] font-bold text-[#181d27]">{title}</h3>
                  <p className="mt-2 text-[13px] text-[#737c8d] leading-relaxed">{desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6d59ef] opacity-0 group-hover:opacity-100 transition">
                    Saiba mais →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#f0f1f6] bg-gradient-to-r from-[#fbfcff] via-white to-[#fbfcff] px-6 sm:px-10 py-10">
            <p className="text-center text-[12px] font-bold text-[#2f3444] mb-8">
              Produtores e estabelecimentos que confiam na Nokta
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center justify-center gap-3.5">
                  <span
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg,#e8fbff,#f7e5ff)", color: "#6a5cf3" }}
                  >
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong className="block text-[26px] font-extrabold tracking-tight text-[#181d27] leading-none">{value}</strong>
                    <span className="block mt-1 text-[11px] text-[#7c8390]">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#181d27]">
              Quem usa, recomenda
            </h2>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DEPOIMENTOS.map((d) => (
                <div key={d.name} className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_3px_10px_-4px_rgba(28,34,54,0.05)]">
                  <div className="grid grid-cols-[42px_1fr] gap-3.5 items-start">
                    <span
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                      style={{ background: GRADIENT }}
                    >
                      {d.initials}
                    </span>
                    <p className="text-[12.5px] text-[#767e8d] leading-relaxed">{d.quote}</p>
                  </div>
                  <strong className="block mt-5 text-[13px] font-bold text-[#181d27]">{d.name}</strong>
                  <span className="block mt-0.5 text-[11px] text-[#7d8492]">{d.role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div
            className="rounded-2xl px-6 sm:px-16 py-10 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-8"
            style={{ background: "linear-gradient(100deg,#eef7ff 0%,#eff0ff 48%,#fbe8fb 100%)" }}
          >
            <div className="text-center sm:text-left">
              <h2 className="font-sans text-[26px] sm:text-3xl font-bold tracking-tight text-[#181d27] leading-tight">
                Pronto para transformar
                <br />a sua operação?
              </h2>
              <p className="mt-3 text-sm text-[#727b8d]">Comece agora e leve sua gestão para o próximo nível.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              <a
                href={cadastroUrl}
                className="inline-flex items-center justify-center rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-6px_rgba(123,97,255,0.4)] transition hover:-translate-y-0.5 w-full sm:w-auto"
                style={{ background: GRADIENT }}
              >
                Começar agora
              </a>
              <a
                href="mailto:contato@noktatickets.com.br"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-[#181d27] hover:bg-gray-50 transition w-full sm:w-auto"
              >
                Falar com especialista
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="w-full border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandMark />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#717680]">
            <Link href="/termos" className="hover:text-[#181d27] transition">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-[#181d27] transition">Política de Privacidade</Link>
            <a href="mailto:contato@noktatickets.com.br" className="hover:text-[#181d27] transition">Contato</a>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-xs text-[#a4a7ae] text-center sm:text-left">
          Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39
        </div>
      </footer>
    </div>
  );
}
