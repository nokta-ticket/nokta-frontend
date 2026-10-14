import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaqList } from "@/components/ui/faq";
import { Icon, type IconName } from "@/components/ui/icon";
import { COMPANY, LEGAL_LINE } from "@/lib/company";
import { getPlatformUrl, getPublicTicketsUrl } from "@/lib/surfaces";

/**
 * Landing institucional (www.nokta.live), servida via rewrite do middleware
 * (surface MARKETING, path "/"). É "chromeless": o shell público não desenha
 * header nem footer aqui, então a página traz os seus. Estática de
 * propósito (`revalidate`), sem nenhuma chamada de API.
 */
export const metadata: Metadata = {
  title: "Nokta: a plataforma de quem faz a noite acontecer",
  description: "Venda de ingressos, operação do bar e restaurante, reservas e financeiro numa conta só. Você liga só as partes que usa.",
  alternates: { canonical: "https://www.nokta.live" },
  openGraph: {
    title: "Nokta: do ingresso ao fechamento do caixa, numa conta só",
    description: "Eventos, bar e restaurante, relacionamento e gestão numa única plataforma, com as partes que a sua operação liga.",
    url: "https://www.nokta.live",
    siteName: "Nokta",
    locale: "pt_BR",
    type: "website",
  },
};

export const revalidate = 60;

type Feature = { icon: IconName; title: string; text: string };

const PRODUTORES: Feature[] = [
  { icon: "ticket", title: "Ingressos e lotes", text: "Venda com Pix e cartão parcelado, com a virada de lote que você definir e cupons quando quiser." },
  { icon: "qr", title: "Check-in no celular", text: "O QR chega pelo WhatsApp antes do evento e a portaria lê o código pelo celular na entrada." },
  { icon: "megaphone", title: "Promoters", text: "Link de venda próprio pra cada promoter, com cliques, pedidos pagos, conversão e comissão." },
  { icon: "people-group", title: "CRM e convidados", text: "Lista de convidados, cortesias e o histórico de quem já foi nas suas festas." },
  { icon: "wallet", title: "Saldo por evento", text: "O que está liberado, em custódia e em saque, evento por evento, sem misturar." },
];

const BARES: Feature[] = [
  { icon: "qr", title: "Cardápio digital com QR", text: "Um QR só pras mesas e pra bio, com o que está esgotado atualizado na hora." },
  { icon: "receipt", title: "Comandas e pedidos", text: "No painel e na maquininha do garçom, indo direto pro preparo." },
  { icon: "chair", title: "Reservas e fila", text: "As de hoje separadas em confirmadas, a chegar e não vieram. Fila de espera em ordem." },
  { icon: "box", title: "Estoque", text: "Alerta do que está abaixo do mínimo antes de faltar no meio da noite." },
  { icon: "sack-dollar", title: "Financeiro e caixa", text: "Abertura, fechamento e a diferença entre o esperado e o contado." },
];

const NUMBERS = [
  { value: "R$ 0", label: "de mensalidade", hint: "Você paga só quando vende" },
  { value: "Pix + cartão", label: "parcelado", hint: "Taxas às claras em cada venda" },
  { value: "1 conta", label: "várias partes", hint: "Ligue só o que a sua casa usa" },
  { value: "24h", label: "resposta do suporte", hint: "Em dias úteis, por e-mail" },
];

const FAQ = [
  { q: "Quanto custa usar a Nokta?", a: "Não tem mensalidade. Na venda de ingressos, a taxa de serviço é mostrada ao comprador no checkout e cada venda mostra o que é comissão e o que o comprador pagou por cima. A operação do bar segue o mesmo princípio: sem custo fixo pra começar." },
  { q: "Preciso usar todas as partes?", a: "Não. Quem faz festa começa por Eventos; quem abre a porta todo dia começa por Bar e restaurante. Você liga as outras partes quando fizer sentido, tudo na mesma conta." },
  { q: "Como recebo o dinheiro dos ingressos?", a: "O saldo fica separado por evento: o que está liberado, o que está em custódia e o que já está em saque. O saque cai na conta bancária cadastrada no seu workspace." },
  { q: "Funciona no celular?", a: "Sim. O painel inteiro foi feito pra celular: check-in na portaria, comandas na mão do garçom e o financeiro no bolso." },
  { q: "Como falo com a Nokta?", a: `Pelo e-mail ${COMPANY.emails.support}. Respondemos em até 24 horas úteis.` },
];

const NAV = [
  { label: "Produtores", href: "#produtores" },
  { label: "Bares e casas", href: "#bares" },
  { label: "Perguntas", href: "#faq" },
];

function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((f, i) => (
        <li key={f.title} className="fade-up flex gap-4 py-4" style={{ ["--i" as string]: i } as never}>
          <Icon name={f.icon} size={18} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="text-[15px] font-semibold text-foreground">{f.title}</p>
            <p className="mt-0.5 text-body text-muted-foreground">{f.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Shot({ src, alt, width, height, priority, className }: { src: string; alt: string; width: number; height: number; priority?: boolean; className?: string }) {
  return (
    <Card className={`overflow-hidden rounded-[20px] border-0 bg-surface-2 ring-1 ring-white/10 shadow-3 ${className ?? ""}`}>
      <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes="(min-width: 1024px) 640px, 100vw" className="h-auto w-full" />
    </Card>
  );
}

export default function InstitucionalPage() {
  const entrarUrl = getPlatformUrl("/login");
  const cadastroUrl = getPlatformUrl("/register?ctx=produtor");
  const ticketsUrl = getPublicTicketsUrl("/");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Cabeçalho próprio (rota chromeless) */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-6">
          <Link href="/" aria-label="Nokta, página inicial" className="press shrink-0">
            <BrandLogo variant="nokta" height={26} />
          </Link>
          <nav aria-label="Seções" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="rounded-pill px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" shape="pill" size="sm">
              <a href={entrarUrl}>Entrar</a>
            </Button>
            <Button asChild variant="primary" shape="pill" size="sm">
              <a href={cadastroUrl}>Criar conta</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="nk-title">
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_85%_-10%,color-mix(in_oklab,var(--brand)_42%,transparent),transparent_62%),radial-gradient(700px_circle_at_-10%_90%,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_60%),linear-gradient(180deg,color-mix(in_oklab,var(--brand)_10%,var(--background)),var(--background))]" aria-hidden />
          <div className="grain absolute inset-0" aria-hidden />
          <div className="hero-fade absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 lg:px-6 lg:pb-16 lg:pt-24">
            <div className="max-w-3xl">
              <p className="slide-up mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                Ingressos, bar e financeiro numa conta só
              </p>
              <h1 id="nk-title" className="slide-up [--i:1] text-balance font-display text-hero uppercase text-white">
                A plataforma de quem faz a noite acontecer
              </h1>
              <p className="slide-up [--i:2] mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/80">A Nokta junta a venda de ingressos, a operação do bar e restaurante, as reservas e o financeiro. Você liga só as partes que usa. E tudo funciona no celular.</p>
              <div className="slide-up [--i:3] mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="primary" shape="pill" size="lg" className="w-full sm:w-auto">
                  <a href={cadastroUrl}>
                    Criar conta grátis
                    <Icon name="arrow-right" size={14} />
                  </a>
                </Button>
                <Button asChild variant="contrast" shape="pill" size="lg" className="w-full sm:w-auto">
                  <a href={ticketsUrl}>
                    <Icon name="ticket" size={14} />
                    Ver eventos
                  </a>
                </Button>
              </div>
            </div>
            <div className="slide-up [--i:4] mt-12 lg:mt-16">
              <Shot src="/institucional/painel-inicio.webp" alt="Tela Início do painel da Nokta: faturamento do dia, comandas abertas, reservas de hoje, ticket médio e o que está acontecendo na operação agora (dados de demonstração)" width={1440} height={900} priority className="mx-auto max-w-5xl rounded-[24px]" />
            </div>
          </div>
        </section>

        {/* Números */}
        <section className="reveal mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16" aria-label="Por que a Nokta">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NUMBERS.map((n, i) => (
              <Card key={n.label} className="fade-up gap-1 p-5" style={{ ["--i" as string]: i } as never}>
                <p className="text-stat font-medium tabular-nums tracking-tight text-foreground">{n.value}</p>
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-caption text-subtle-foreground">{n.hint}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Para produtores */}
        <section id="produtores" className="reveal scroll-mt-20 border-t border-border" aria-labelledby="nk-produtores">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:py-24">
            <div>
              <p className="text-sm font-semibold text-brand">Para produtores</p>
              <h2 id="nk-produtores" className="mt-2 text-balance font-display text-[2.25rem] uppercase leading-[0.95] text-foreground lg:text-[3rem]">
                Venda, portaria e repasse do seu evento
              </h2>
              <p className="mt-4 max-w-lg text-body text-muted-foreground">Do primeiro lote ao saque: tudo o que a sua festa precisa, sem planilha e sem grupo de WhatsApp pra controlar lista.</p>
              <FeatureList items={PRODUTORES} />
              <Button asChild variant="primary" shape="pill" size="lg" className="mt-2 w-full sm:w-auto">
                <a href={cadastroUrl}>Começar a vender</a>
              </Button>
            </div>
            <Shot src="/institucional/tela-eventos.webp" alt="Tela Eventos do painel da Nokta com três eventos publicados (demonstração)" width={1800} height={1157} />
          </div>
        </section>

        {/* Para bares e casas */}
        <section id="bares" className="reveal scroll-mt-20 border-t border-border bg-surface/40" aria-labelledby="nk-bares">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:py-24">
            <div className="grid gap-4 lg:order-first">
              <Shot src="/institucional/tela-comandas.webp" alt="Tela Mesas e comandas do painel da Nokta com o mapa de mesas ocupadas e livres (demonstração)" width={1800} height={1096} />
              <Shot src="/institucional/tela-reservas.webp" alt="Tela Reservas do painel da Nokta com a agenda do dia (demonstração)" width={1800} height={1093} className="hidden lg:block" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand">Para bares e casas</p>
              <h2 id="nk-bares" className="mt-2 text-balance font-display text-[2.25rem] uppercase leading-[0.95] text-foreground lg:text-[3rem]">
                Mesas, comandas e reservas no mesmo cadastro do cardápio
              </h2>
              <p className="mt-4 max-w-lg text-body text-muted-foreground">Quem abre a porta todo dia precisa que a casa gire sem atrito: pedido entra, cozinha prepara, caixa fecha batendo.</p>
              <FeatureList items={BARES} />
              <Button asChild variant="primary" shape="pill" size="lg" className="mt-2 w-full sm:w-auto">
                <a href={cadastroUrl}>Montar meu cardápio</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Gestão */}
        <section className="reveal border-t border-border" aria-labelledby="nk-gestao">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-6 lg:py-24">
            <div>
              <p className="text-sm font-semibold text-brand">Gestão</p>
              <h2 id="nk-gestao" className="mt-2 text-balance font-display text-[2.25rem] uppercase leading-[0.95] text-foreground lg:text-[3rem]">
                O dinheiro de cada parte, sem misturar
              </h2>
              <p className="mt-4 max-w-lg text-body text-muted-foreground">Ingressos com saldo, custódia e saque; bar com vendas e fechamentos de caixa. Nunca somados. Cada pessoa da equipe vê só o que o papel dela permite.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: "chart-line" as IconName, text: "Panorama do dia em uma tela" },
                  { icon: "percent" as IconName, text: "Taxas às claras em cada venda" },
                  { icon: "user-shield" as IconName, text: "Permissões por papel na equipe" },
                  { icon: "bolt" as IconName, text: "Conecte a conta ao Claude e pergunte" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-card">
                    <Icon name={item.icon} size={15} className="shrink-0 text-brand" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <Shot src="/institucional/tela-financeiro.webp" alt="Tela Financeiro de ingressos do painel da Nokta com saldo disponível e em custódia (demonstração)" width={1800} height={1274} />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="reveal scroll-mt-20 border-t border-border" aria-labelledby="nk-faq">
          <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6 lg:py-24">
            <h2 id="nk-faq" className="text-balance text-center font-display text-[2.25rem] uppercase leading-[0.95] text-foreground lg:text-[3rem]">
              Perguntas frequentes
            </h2>
            <FaqList items={FAQ} className="mt-10" />
          </div>
        </section>

        {/* CTA final */}
        <section className="reveal mx-auto max-w-7xl px-4 pb-16 lg:px-6 lg:pb-24" aria-labelledby="nk-close">
          <div className="card-accent relative overflow-hidden rounded-[24px] border border-border bg-surface p-7 lg:flex lg:items-center lg:justify-between lg:p-12">
            <div className="ambient-blob -right-16 -top-16 size-72" aria-hidden />
            <div className="relative max-w-xl">
              <h2 id="nk-close" className="text-balance font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">
                Junte a sua operação numa conta só
              </h2>
              <p className="mt-3 text-body text-muted-foreground">Crie a conta, escolha as partes que você usa e comece pelo que a sua casa ou o seu evento faz hoje.</p>
            </div>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Button asChild variant="primary" shape="pill" size="lg" className="w-full sm:w-auto">
                <a href={cadastroUrl}>Criar conta grátis</a>
              </Button>
              <Button asChild variant="outline" shape="pill" size="lg" className="w-full sm:w-auto">
                <a href={entrarUrl}>Já tenho conta</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé institucional */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div className="space-y-4">
              <BrandLogo variant="nokta" height={28} />
              <p className="max-w-xs text-body text-muted-foreground">Ingressos, operação do bar e restaurante, reservas e financeiro numa conta só.</p>
              <div className="flex items-center gap-2">
                <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                  <Icon name="instagram" size={16} />
                </a>
                <a href={`mailto:${COMPANY.emails.support}`} aria-label="E-mail de suporte" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                  <Icon name="mail" size={15} />
                </a>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Plataforma</p>
              <ul className="space-y-2 text-body text-muted-foreground">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="transition-colors hover:text-foreground">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Conta</p>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>
                  <a href={cadastroUrl} className="transition-colors hover:text-foreground">
                    Criar conta
                  </a>
                </li>
                <li>
                  <a href={entrarUrl} className="transition-colors hover:text-foreground">
                    Entrar
                  </a>
                </li>
                <li>
                  <a href={ticketsUrl} className="transition-colors hover:text-foreground">
                    Bilheteria
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Legal</p>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>
                  <Link href="/termos" className="transition-colors hover:text-foreground">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="transition-colors hover:text-foreground">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/politica-de-cancelamento" className="transition-colors hover:text-foreground">
                    Política de cancelamento
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${COMPANY.emails.support}`} className="transition-colors hover:text-foreground">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 space-y-2 border-t border-border pt-6 text-caption text-subtle-foreground">
            <p>{LEGAL_LINE}</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>
                © {new Date().getFullYear()} {COMPANY.legalName}. Todos os direitos reservados.
              </span>
              <a href={`mailto:${COMPANY.emails.support}`} className="transition-colors hover:text-foreground">
                {COMPANY.emails.support}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
