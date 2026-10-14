import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaqList } from "@/components/ui/faq";
import { Icon, type IconName } from "@/components/ui/icon";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Para produtores",
  description: "Crie seu evento, venda ingressos com Pix e cartão, controle a portaria pelo celular e receba direto na sua conta. Sem mensalidade.",
};

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: "bolt", title: "Ative em minutos", text: "Crie sua conta de produtor e publique o primeiro evento hoje. Sem burocracia pra começar." },
  { icon: "ticket", title: "Lotes, cupons e meia", text: "Monte os lotes, defina preços e datas de virada, e valide tudo na portaria pelo celular." },
  { icon: "credit-card", title: "Pix e cartão parcelado", text: "O comprador paga como preferir. A taxa de serviço aparece às claras no checkout." },
  { icon: "qr", title: "QR pelo WhatsApp", text: "O ingresso chega antes do evento no número verificado do comprador — sem app pra baixar." },
  { icon: "megaphone", title: "Promoters e convidados", text: "Link próprio pra cada promoter, lista de convidados e cortesias controladas." },
  { icon: "chart-line", title: "Números em tempo real", text: "Vendas, receita e check-ins num painel que funciona no celular." },
];

const STEPS = [
  { title: "Crie a conta", text: "Nome do projeto, telefone e aceite dos termos de produtor." },
  { title: "Publique o evento", text: "Banner, lotes, local e horário. Ingressos pagos pedem a verificação de identidade." },
  { title: "Venda e receba", text: "Acompanhe as vendas e saque o saldo liberado direto pra sua conta." },
];

const FAQ = [
  { q: "Quanto custa?", a: "Não tem mensalidade. A taxa de serviço da plataforma é cobrada por ingresso vendido e exibida ao comprador no momento da compra." },
  { q: "Quando recebo o repasse?", a: "O saldo fica separado por evento, entre liberado, em custódia e em saque. O repasse é feito via Pix pra conta cadastrada, descontadas as taxas vigentes." },
  { q: "Posso vender evento gratuito?", a: "Sim. Eventos gratuitos e rascunhos podem ser criados assim que a conta de produtor é ativada; pra ingressos pagos é preciso concluir a verificação de identidade." },
  { q: "Como funciona a portaria?", a: "O QR do comprador é lido pelo celular da equipe, com o status de cada ingresso na hora. Cada pessoa da equipe acessa só o que o papel dela permite." },
];

/** LP pra produtores dentro do site de ingressos — vive no shell público (header/footer vêm de lá). */
export default function ParaProdutoresPage() {
  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="pp-title">
        <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_90%_-20%,color-mix(in_oklab,var(--brand)_36%,transparent),transparent_60%),radial-gradient(600px_circle_at_0%_100%,color-mix(in_oklab,var(--brand)_16%,transparent),transparent_60%)]" aria-hidden />
        <div className="grain absolute inset-0" aria-hidden />
        <div className="hero-fade absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 lg:px-6 lg:pb-20 lg:pt-20">
          <div className="max-w-2xl">
            <p className="slide-up mb-4 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              Para produtores
            </p>
            <h1 id="pp-title" className="slide-up [--i:1] text-balance font-display text-hero uppercase text-white">
              Crie seu evento com a gente
            </h1>
            <p className="slide-up [--i:2] mt-5 max-w-lg text-pretty text-lg leading-relaxed text-white/80">Venda ingressos, controle a portaria pelo celular e receba direto na sua conta. Sem mensalidade.</p>
            <div className="slide-up [--i:3] mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="primary" shape="pill" size="lg" className="w-full sm:w-auto">
                <Link href="/register?ctx=produtor">
                  Criar conta de produtor
                  <Icon name="arrow-right" size={14} />
                </Link>
              </Button>
              <Button asChild variant="contrast" shape="pill" size="lg" className="w-full sm:w-auto">
                <Link href="/login?ctx=produtor">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16" aria-labelledby="pp-beneficios">
        <h2 id="pp-beneficios" className="text-balance font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">
          Tudo que o seu evento precisa
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Card key={b.title} glow className="fade-up gap-2 p-5" style={{ ["--i" as string]: i } as never}>
              <Icon name={b.icon} size={20} className="text-brand" />
              <p className="mt-1 text-[15px] font-semibold text-foreground">{b.title}</p>
              <p className="text-body text-muted-foreground">{b.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-y border-border bg-surface/40" aria-labelledby="pp-passos">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
          <h2 id="pp-passos" className="text-balance font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">
            Do cadastro ao saque em três passos
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="fade-up flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card" style={{ ["--i" as string]: i } as never}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">{i + 1}</span>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">{s.title}</p>
                  <p className="mt-1 text-body text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 lg:px-6 lg:py-16" aria-labelledby="pp-faq">
        <h2 id="pp-faq" className="text-balance text-center font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">
          Dúvidas de quem produz
        </h2>
        <FaqList items={FAQ} name="pp-faq" className="mt-8" />
        <p className="mt-6 text-center text-body text-muted-foreground">
          Ficou alguma dúvida? Fala com a gente em{" "}
          <a href={`mailto:${COMPANY.emails.support}`} className="font-semibold text-brand underline-offset-4 hover:underline">
            {COMPANY.emails.support}
          </a>
          .
        </p>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-4 lg:px-6" aria-labelledby="pp-cta">
        <div className="card-accent relative overflow-hidden rounded-[24px] border border-border bg-surface p-6 lg:flex lg:items-center lg:justify-between lg:p-10">
          <div className="ambient-blob -right-16 -top-16 size-64" aria-hidden />
          <div className="relative">
            <h2 id="pp-cta" className="text-balance font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">
              Pronto pra começar?
            </h2>
            <p className="mt-3 max-w-md text-body text-muted-foreground">Crie sua conta em menos de 2 minutos e publique seu primeiro evento ainda hoje.</p>
          </div>
          <Button asChild variant="primary" shape="pill" size="lg" className="relative mt-6 w-full sm:w-auto lg:mt-0">
            <Link href="/register?ctx=produtor">
              Quero produzir
              <Icon name="arrow-right" size={14} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
