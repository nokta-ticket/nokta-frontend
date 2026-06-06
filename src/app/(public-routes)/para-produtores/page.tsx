import Link from "next/link";
import { Zap, Shield, BarChart3, Ticket, Users, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: Zap,
    title: "Ative em minutos",
    description: "Crie sua conta de produtor automaticamente. Sem burocracia inicial para começar.",
  },
  {
    icon: Shield,
    title: "Pagamentos seguros",
    description: "Repasses via PIX com verificação de identidade para garantir segurança para todos.",
  },
  {
    icon: BarChart3,
    title: "Métricas em tempo real",
    description: "Acompanhe vendas, receita e engajamento do seu evento em um painel completo.",
  },
  {
    icon: Ticket,
    title: "Gestão de ingressos",
    description: "Crie lotes, defina preços, datas limite e valide ingressos no dia do evento.",
  },
  {
    icon: Users,
    title: "Todos os tipos de evento",
    description: "Festas, shows, workshops, esportes — a plataforma se adapta ao seu evento.",
  },
];


export default function ParaProdutoresPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <span className="mb-4 inline-block rounded-full bg-violet-500/20 px-4 py-1 text-sm font-medium text-violet-300">
            Para produtores
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            Crie e venda seus eventos
            <br />
            <span className="text-violet-400">sem complicação</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300">
            A Nokta é a plataforma que conecta produtores de eventos com seu público.
            Ative sua conta em minutos e comece hoje.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register?ctx=produtor"
              className="flex items-center gap-2 rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700"
            >
              Criar conta de produtor <ArrowRight size={16} />
            </Link>
            <Link
              href="/login?ctx=produtor"
              className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Tudo que você precisa para seu evento
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <b.icon className="text-violet-600" size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Pronto para começar?</h2>
        <p className="mx-auto mt-4 max-w-md text-gray-500">
          Crie sua conta em menos de 2 minutos e seu primeiro evento ainda hoje.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register?ctx=produtor"
            className="flex items-center gap-2 rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700"
          >
            Criar conta de produtor <ArrowRight size={16} />
          </Link>
          <Link
            href="/login?ctx=produtor"
            className="rounded-full border border-gray-200 px-8 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Já tenho conta
          </Link>
        </div>
      </section>
    </main>
  );
}
