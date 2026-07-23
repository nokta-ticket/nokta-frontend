import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CalendarCheck,
  ClipboardList,
  DoorOpen,
  ShieldCheck,
  Ticket,
  UsersRound,
  UtensilsCrossed,
  Wallet,
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

const JORNADA = [
  { label: "Aquisição", desc: "Eventos e venda de ingressos" },
  { label: "Entrada", desc: "Check-in e controle de acesso" },
  { label: "Operação", desc: "Mesas, comandas e pedidos" },
  { label: "Consumo", desc: "Cardápio e produtos" },
  { label: "Gestão", desc: "Estoque, equipe e financeiro" },
  { label: "Análise", desc: "Insights de toda a operação" },
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

const PARA_QUEM = [
  "Produtores de eventos",
  "Casas noturnas",
  "Bares",
  "Restaurantes",
  "Beach clubs",
  "Espaços de eventos",
  "Operações híbridas",
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
      <header className="w-full">
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
              className="inline-flex items-center rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#00DDFF,#FF00D4)" }}
            >
              Começar agora
            </a>
          </div>
        </div>
        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,#00DDFF,#FF00D4)" }} />
      </header>

      <main className="flex-1">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <h1 className="font-sans text-4xl sm:text-5xl font-bold text-[#181d27] leading-tight max-w-3xl mx-auto">
            A Nokta conecta toda a jornada da sua operação
          </h1>
          <p className="mt-5 text-lg text-[#414651] max-w-2xl mx-auto">
            Eventos, ingressos, convidados, reservas, entrada, mesas, comandas, pedidos, estoque,
            financeiro e insights — numa única plataforma de software e gestão.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={entrarUrl}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 w-full sm:w-auto"
              style={{ background: "linear-gradient(90deg,#00DDFF,#FF00D4)" }}
            >
              Entrar na Nokta
            </a>
            <a
              href={ticketsUrl}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-[#181d27] hover:bg-gray-50 transition w-full sm:w-auto"
            >
              Conhecer a bilheteria
            </a>
          </div>
        </section>

        {/* ── JORNADA COMPLETA ───────────────────────────────── */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold text-[#181d27]">
              Uma jornada completa, do primeiro ingresso ao relatório final
            </h2>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {JORNADA.map((etapa, i) => (
                <div key={etapa.label} className="flex flex-col items-center text-center gap-2">
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#00DDFF,#FF00D4)" }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-sans text-sm font-semibold text-[#181d27]">{etapa.label}</h3>
                  <p className="text-xs text-[#717680]">{etapa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAPACIDADES ────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold text-[#181d27]">
              Capacidades da plataforma
            </h2>
            <p className="mt-3 text-center text-[#414651] max-w-2xl mx-auto">
              Cada operação ativa só as capacidades que precisa, dentro do mesmo sistema.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CAPACIDADES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-100 p-6 shadow-sm">
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-lg mb-4"
                    style={{ background: "linear-gradient(135deg,#00DDFF1A,#FF00D41A)" }}
                  >
                    <Icon size={20} className="text-[#181d27]" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-[#181d27]">{title}</h3>
                  <p className="mt-1.5 text-sm text-[#717680]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARA QUEM É ────────────────────────────────────── */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-sans text-2xl sm:text-3xl font-bold text-[#181d27]">
              Para quem é a Nokta
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {PARA_QUEM.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-[#181d27]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATAFORMA ÚNICA ───────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-[840px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div
              className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl mb-6"
              style={{ background: "linear-gradient(135deg,#00DDFF,#FF00D4)" }}
            >
              <ShieldCheck size={22} className="text-white" />
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#181d27]">
              Uma plataforma única, não um pacote de produtos separados
            </h2>
            <p className="mt-4 text-[#414651]">
              A Nokta é a camada de software e gestão por trás da operação: o mesmo sistema atende
              desde a venda de ingressos até o controle da mesa, do estoque e do financeiro. Cada
              cliente ativa apenas as capacidades que a sua operação precisa — sem trocar de
              sistema, sem duplicar dados, sem operar às cegas entre etapas.
            </p>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────── */}
        <section className="py-20" style={{ background: "linear-gradient(120deg,#0b0c10,#181022)" }}>
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 text-white/70 mb-4">
              <DoorOpen size={18} />
              <span className="text-sm">Comece pela sua operação</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white">
              Pronto para gerenciar toda a sua operação num só lugar?
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={entrarUrl}
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 w-full sm:w-auto"
                style={{ background: "linear-gradient(90deg,#00DDFF,#FF00D4)" }}
              >
                Entrar na Nokta
              </a>
              <a
                href={ticketsUrl}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition w-full sm:w-auto"
              >
                Conhecer a bilheteria
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
