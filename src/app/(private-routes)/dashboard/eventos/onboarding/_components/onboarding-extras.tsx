import Link from "next/link";
import {
  ArrowUpRight,
  CalendarRange,
  LifeBuoy,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";

const FEATURE_TILES = [
  {
    icon: CalendarRange,
    title: "Venda mais e melhor",
    description: "Eventos, ingressos, check-in e filas.",
    accent: "from-[#8B5CF6] to-[#6D28D9]",
    shadow: "shadow-[0_8px_16px_-6px_rgba(109,40,217,0.45)]",
    hoverShadow: "hover:shadow-[0_16px_30px_-14px_rgba(109,40,217,0.45)] hover:border-[#E3D9FB]",
  },
  {
    icon: UsersRound,
    title: "Opere com eficiência",
    description: "Mesas, comandas, pedidos e estoque.",
    accent: "from-[#34D399] to-[#059669]",
    shadow: "shadow-[0_8px_16px_-6px_rgba(5,150,105,0.42)]",
    hoverShadow: "hover:shadow-[0_16px_30px_-14px_rgba(5,150,105,0.42)] hover:border-[#CFF0E2]",
  },
  {
    icon: Wallet,
    title: "Tenha controle total",
    description: "Financeiro, relatórios e indicadores.",
    accent: "from-[#FBBF24] to-[#F97316]",
    shadow: "shadow-[0_8px_16px_-6px_rgba(249,115,22,0.42)]",
    hoverShadow: "hover:shadow-[0_16px_30px_-14px_rgba(249,115,22,0.42)] hover:border-[#F6E3C4]",
  },
  {
    icon: ShieldCheck,
    title: "Trabalhe com segurança",
    description: "Permissões, acessos e auditoria.",
    accent: "from-[#60A5FA] to-[#2563EB]",
    shadow: "shadow-[0_8px_16px_-6px_rgba(37,99,235,0.42)]",
    hoverShadow: "hover:shadow-[0_16px_30px_-14px_rgba(37,99,235,0.42)] hover:border-[#D3E2FB]",
  },
];

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#ECE7F7] bg-white shadow-[0_26px_50px_-22px_rgba(80,45,160,0.4)]">
      <div className="flex items-center justify-between border-b border-[#F2EEFA] px-3 py-2">
        <span className="text-[10.5px] font-semibold text-[#4A4658]">Visão geral</span>
        <div className="flex items-center gap-1.5">
          <span className="h-[7px] w-[34px] rounded bg-[#EDE9F6]" />
          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]" />
        </div>
      </div>

      <div className="space-y-2.5 px-3 pb-3 pt-2.5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Receita", value: "R$ 142.590" },
            { label: "Ingressos", value: "1.250" },
            { label: "Check-in", value: "98,6%" },
            { label: "Eventos", value: "321" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-[#F0EEF6] bg-[#FAFAFD] px-2 py-1.5">
              <div className="text-[7px] uppercase tracking-wide text-[#9A98A6]">{kpi.label}</div>
              <div className="mt-0.5 text-[11px] font-bold text-[#241F33]">{kpi.value}</div>
            </div>
          ))}
        </div>

        <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="block h-auto w-full">
          <defs>
            <linearGradient id="onboarding-extras-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8B5CF6" stopOpacity=".28" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 70 C 30 60 40 40 70 46 C 100 52 110 30 140 34 C 170 38 185 20 215 28 C 245 36 260 22 290 18 L 320 24 L 320 90 L 0 90 Z"
            fill="url(#onboarding-extras-area)"
          />
          <path
            d="M0 70 C 30 60 40 40 70 46 C 100 52 110 30 140 34 C 170 38 185 20 215 28 C 245 36 260 22 290 18 L 320 24"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[9px] border border-[#F0EEF6] bg-[#FAFAFD] p-2.5">
            <div className="text-[8px] uppercase tracking-wide text-[#9A98A6]">Receita</div>
            <div className="text-[13px] font-bold text-[#241F33]">R$ 89.620,00</div>
            <div className="mt-0.5 text-[7.5px] text-[#A7A5B2]">+12,4% vs. mês anterior</div>
            <svg viewBox="0 0 120 26" preserveAspectRatio="none" className="mt-1.5 h-5 w-full">
              <path
                d="M0 20 L15 16 L30 18 L45 10 L60 13 L75 6 L90 9 L105 4 L120 7"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="1.6"
              />
            </svg>
          </div>
          <div className="rounded-[9px] border border-[#F0EEF6] bg-[#FAFAFD] p-2.5">
            <div className="text-[8px] uppercase tracking-wide text-[#9A98A6]">Eventos</div>
            <div className="mt-1 flex items-center gap-2">
              <svg viewBox="0 0 42 42" width="48" height="48" className="shrink-0">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEE9F9" strokeWidth="7" />
                <circle
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="#6D28D9"
                  strokeWidth="7"
                  strokeDasharray="45 55"
                  strokeDashoffset="25"
                  strokeLinecap="round"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="#A78BFA"
                  strokeWidth="7"
                  strokeDasharray="30 70"
                  strokeDashoffset="-20"
                  strokeLinecap="round"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.9"
                  fill="none"
                  stroke="#C4B5FD"
                  strokeWidth="7"
                  strokeDasharray="15 85"
                  strokeDashoffset="-50"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col gap-0.5 text-[8px] text-[#5E5B6B]">
                <span className="flex items-center gap-1">
                  <span className="h-[7px] w-[7px] rounded-sm bg-[#6D28D9]" /> Ativos 45%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-[7px] w-[7px] rounded-sm bg-[#A78BFA]" /> Rascunho 30%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-[7px] w-[7px] rounded-sm bg-[#C4B5FD]" /> Encerrados 25%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[9px] border border-[#F0EEF6]">
          <div className="grid grid-cols-[1.6fr_1fr_0.8fr] gap-1.5 border-b border-[#F0EEF6] bg-[#FAFAFD] px-2.5 py-1.5 text-[7px] uppercase tracking-wide text-[#9A98A6]">
            <span>Evento</span>
            <span>Vendas</span>
            <span>Total</span>
          </div>
          {[
            { name: "Festival Sunset", vendas: "Edge Sports", total: "14.200" },
            { name: "Show Acústico", vendas: "Vale em Clube", total: "9.870" },
            { name: "Rooftop Party", vendas: "Central Hub", total: "6.540" },
          ].map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1.6fr_1fr_0.8fr] items-center gap-1.5 border-t border-[#F5F3FA] px-2.5 py-1.5 text-[8.5px] text-[#403C4D] first:border-t-0"
            >
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-[#EFEAFB]" />
                {row.name}
              </span>
              <span>{row.vendas}</span>
              <span className="text-right font-semibold text-[#241F33]">{row.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpIllustration() {
  return (
    <svg viewBox="0 0 300 190" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full max-w-[280px]">
      <ellipse cx="150" cy="150" rx="120" ry="26" fill="#ECE6F8" />
      <ellipse cx="120" cy="120" rx="70" ry="46" fill="#F0EAFA" />
      <circle cx="52" cy="96" r="5" fill="#D6C8F6" />
      <circle cx="250" cy="70" r="4" fill="#D6C8F6" />
      <path d="M60 118v10M55 123h10" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />

      <g transform="translate(96,72)">
        <circle cx="42" cy="42" r="40" fill="#EDE7FE" />
        <circle cx="42" cy="42" r="40" fill="none" stroke="#7C3AED" strokeWidth="14" strokeDasharray="31.4 31.4" />
        <circle cx="42" cy="42" r="40" fill="none" stroke="#C4B5FD" strokeWidth="14" strokeDasharray="31.4 31.4" strokeDashoffset="31.4" />
        <circle cx="42" cy="42" r="20" fill="#fff" />
        <circle cx="42" cy="42" r="20" fill="none" stroke="#E6DEF9" strokeWidth="2" />
      </g>

      <g transform="translate(196,44)">
        <rect x="0" y="0" width="66" height="46" rx="12" fill="#7C3AED" />
        <path d="M16 46 L16 58 L30 46 Z" fill="#7C3AED" />
        <circle cx="20" cy="23" r="3.4" fill="#fff" />
        <circle cx="33" cy="23" r="3.4" fill="#fff" />
        <circle cx="46" cy="23" r="3.4" fill="#fff" />
      </g>

      <g transform="translate(198,104)">
        <rect x="0" y="0" width="40" height="30" rx="9" fill="#fff" stroke="#E4DCF6" strokeWidth="1.5" />
        <path d="M26 30 L26 39 L36 30 Z" fill="#fff" stroke="#E4DCF6" strokeWidth="1.5" />
        <rect x="9" y="11" width="22" height="3" rx="1.5" fill="#CDBFF2" />
        <rect x="9" y="17" width="14" height="3" rx="1.5" fill="#E1D8F5" />
      </g>
    </svg>
  );
}

/**
 * Preenche a área abaixo do card principal do onboarding, que ficava vazia
 * enquanto o usuário ainda não tem organização. Central de Ajuda ainda não
 * existe como página real — botão fica só visual por enquanto, mesmo
 * padrão já usado em "Ajuda" na sidebar.
 */
export function OnboardingExtras() {
  return (
    <div className="mt-6 grid w-full items-stretch gap-[22px] xl:grid-cols-[1.1fr_1.55fr_1fr]">
      <section className="rounded-[20px] border border-[#ecebf1] bg-white p-6">
        <h2 className="mb-4 text-base font-bold tracking-[-0.01em] text-[#1a1626]">A Nokta cuida do que importa para você</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.title}
                className={`group rounded-2xl border border-[#EEEDF3] bg-gradient-to-b from-white to-[#FCFBFE] p-4 pb-4.5 text-center transition ${tile.hoverShadow} hover:-translate-y-1`}
              >
                <div
                  className={`mx-auto mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-gradient-to-br ${tile.accent} ${tile.shadow}`}
                >
                  <Icon size={22} strokeWidth={2} className="text-white" />
                </div>
                <div className="text-[13px] font-bold leading-[1.3] text-[#1a1626]">{tile.title}</div>
                <div className="mt-1.5 text-[11.5px] leading-[1.5] text-[#7C7A8A]">{tile.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 rounded-[20px] border border-[#ECE6F8] bg-[#F5F2FC] p-6 md:flex-row">
        <div className="w-full md:min-w-0 md:flex-[0_0_38%]">
          <h2 className="text-xl font-bold leading-[1.25] tracking-[-0.01em] text-[#1a1626]">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="mt-3.5 text-[12.5px] leading-[1.6] text-[#7C7A8A]">
            Conecte pessoas, processos e dados para focar no que realmente importa: fazer o seu evento acontecer.
          </p>
          <Link
            href="/dashboard/explorar"
            className="mt-5 inline-flex items-center gap-2 rounded-[11px] border border-[#E5DDF6] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#6D28D9] shadow-[0_2px_6px_rgba(80,40,160,0.06)] transition hover:bg-[#FCFBFE] hover:shadow-[0_6px_14px_rgba(80,40,160,0.12)] active:translate-y-px"
          >
            Ver visão completa da plataforma
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="w-full min-w-0 flex-1">
          <DashboardMock />
        </div>
      </section>

      <section className="flex flex-col rounded-[20px] border border-[#ECE6F8] bg-[#F5F2FC] p-6 pb-5">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[#1a1626]">Precisa de ajuda?</h2>
        <p className="mb-5 mt-3 text-[12.5px] leading-[1.6] text-[#7C7A8A]">
          Nossa central de ajuda tem guias rápidos, vídeos e artigos para te ajudar em cada etapa.
        </p>
        <span className="inline-flex w-fit cursor-default items-center gap-2 rounded-[11px] border border-[#E5DDF6] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#6D28D9]/60">
          <LifeBuoy size={14} />
          Acessar Central de Ajuda
        </span>

        <div className="mt-auto flex justify-center pt-3.5">
          <HelpIllustration />
        </div>
      </section>
    </div>
  );
}
