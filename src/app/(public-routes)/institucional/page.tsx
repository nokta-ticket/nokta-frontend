import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { getPlatformUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { NoktaWordmark } from "@/components/brand/nokta-wordmark";
import { HeroStage } from "./_components/hero-stage";
import { LandingMotion } from "./_components/landing-motion";
import "./institucional.css";

/**
 * Landing institucional (www.nokta.live), renderizada via rewrite do
 * middleware (surface MARKETING, path "/"). O Root Layout sempre renderiza o
 * header/footer da bilheteria (nunca decide por host, para manter cache
 * estático); esta página se sobrepõe a eles com o wrapper `fixed inset-0`,
 * mesmo padrão de dashboard/admin.
 *
 * Redesign 2026-10-02: identidade da Nokta (empresa mãe), não da Nokta
 * Tickets. As imagens são capturas reais do painel numa organização de
 * demonstração da própria Nokta; nenhum número aqui é métrica de cliente.
 */
export const metadata: Metadata = {
  title: "Nokta: ingressos, operação do bar e financeiro numa conta só",
  description:
    "A Nokta junta a venda de ingressos, a operação do bar e restaurante, as reservas e o financeiro numa única conta. Você liga só as partes que usa.",
  alternates: { canonical: "https://www.nokta.live" },
  openGraph: {
    title: "Nokta: do ingresso ao fechamento do caixa, numa conta só",
    description:
      "Eventos, bar e restaurante, relacionamento e gestão numa única plataforma, com as partes que a sua operação liga.",
    url: "https://www.nokta.live",
    siteName: "Nokta",
    locale: "pt_BR",
    type: "website",
  },
};

export const revalidate = 60;

type Area = {
  id: string;
  tag: string;
  title: string;
  features: [string, string][];
  image: { src: string; width: number; height: number; alt: string };
};

const AREAS: Area[] = [
  {
    id: "eventos",
    tag: "Eventos",
    title: "Venda, entrada e repasse do seu evento.",
    features: [
      ["Lotes e cupons.", "Venda com Pix e cartão parcelado, com a virada de lote que você definir."],
      ["QR pelo WhatsApp.", "O ingresso chega antes do evento e a portaria lê pelo celular."],
      ["Convidados e promotores.", "Cortesias, lista e link de venda próprio para cada promotor."],
      ["Saldo por evento.", "O que está liberado, em custódia e em saque, evento por evento."],
    ],
    image: { src: "/institucional/tela-eventos.webp", width: 1800, height: 896, alt: "Tela Eventos do painel da Nokta com três eventos publicados (demonstração)" },
  },
  {
    id: "bar",
    tag: "Bar e restaurante",
    title: "Mesas, comandas e pedidos no mesmo cadastro do cardápio.",
    features: [
      ["Comandas e pedidos.", "No painel e na maquininha do garçom, indo direto para o preparo."],
      ["Cardápio por QR.", "Um QR só para as mesas e para a bio, com o que está esgotado na hora."],
      ["Estoque.", "Alerta do que está abaixo do mínimo antes de faltar."],
      ["Caixa.", "Abertura, fechamento e a diferença entre o esperado e o contado."],
    ],
    image: { src: "/institucional/tela-comandas.webp", width: 1800, height: 1306, alt: "Tela Mesas e comandas do painel da Nokta com comandas abertas (demonstração)" },
  },
  {
    id: "relacionamento",
    tag: "Relacionamento",
    title: "Quem vem, quem chegou e o que achou.",
    features: [
      ["Reservas.", "As de hoje separadas em confirmadas, a chegar e não vieram."],
      ["Fila de espera.", "Quem está esperando mesa, em ordem."],
      ["Convidados.", "Lista de nomes na reserva, com check-in na porta."],
      ["Avaliações.", "Notas e comentários dos clientes, numa página própria da sua casa."],
    ],
    image: { src: "/institucional/tela-reservas.webp", width: 1800, height: 1328, alt: "Tela Reservas do painel da Nokta com a agenda do dia (demonstração)" },
  },
  {
    id: "gestao",
    tag: "Gestão",
    title: "O dinheiro de cada parte, sem misturar.",
    features: [
      ["Financeiro.", "Ingressos com saldo, custódia e saque; bar com vendas e fechamentos de caixa. Nunca somados."],
      ["Taxas às claras.", "Cada venda mostra o que é comissão e o que o comprador pagou por cima."],
      ["Equipe.", "Cada pessoa vê só o que o papel dela permite."],
      ["Claude.", "Conecte a conta ao Claude e pergunte quanto vendeu ou o que está acabando."],
    ],
    image: { src: "/institucional/tela-financeiro.webp", width: 1800, height: 947, alt: "Tela Financeiro de ingressos do painel da Nokta com saldo disponível e em custódia (demonstração)" },
  },
];

export default function InstitucionalPage() {
  const entrarUrl = getPlatformUrl("/login");
  const cadastroUrl = getPlatformUrl("/register?ctx=produtor");
  const ticketsUrl = getPublicTicketsUrl("/");

  return (
    <div id="institucional-lp" className="nk fixed inset-0 z-50 flex w-full max-w-full flex-col overflow-x-hidden overflow-y-auto">
      <LandingMotion />

      <header className="nav" data-nav>
        <div className="wrap nav-in">
          <Link href="/" className="brand" aria-label="Nokta, página inicial">
            <NoktaWordmark className="text-[42px]" />
          </Link>
          <nav className="nav-links" aria-label="Seções">
            {AREAS.map((a) => (
              <a key={a.id} href={`#${a.id}`}>
                {a.tag}
              </a>
            ))}
          </nav>
          <div className="nav-act">
            <a className="btn btn-line btn-sm" href={entrarUrl}>
              Entrar
            </a>
            <a className="btn btn-primary btn-sm" href={cadastroUrl}>
              Criar conta
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="hero" id="nk-hero">
          <div className="hero-sticky">
            <div className="wrap hero-grid">
              <div>
                <h1>Do ingresso ao fechamento do caixa, numa conta só.</h1>
                <p className="lede">
                  A Nokta junta a venda de ingressos, a operação do bar e restaurante, as reservas e o financeiro. Você liga só as partes que usa.
                </p>
                <div className="cta">
                  <a className="btn btn-primary" href={cadastroUrl}>
                    Criar minha conta <ArrowRight aria-hidden="true" />
                  </a>
                  <a className="btn btn-line" href={entrarUrl}>
                    Já tenho conta
                  </a>
                </div>
                <p className="caption" aria-live="polite">
                  <i aria-hidden="true" />
                  <span id="nk-caption">Quatro partes da sua operação.</span>
                </p>
              </div>
              <HeroStage heroId="nk-hero" captionId="nk-caption" />
            </div>
          </div>
        </div>

        <section aria-labelledby="nk-areas">
          <div className="wrap">
            <h2 id="nk-areas">Quatro partes. Ligue a que você precisa hoje.</h2>
            <p className="sub">
              Cada parte da Nokta resolve um pedaço da operação e conversa com as outras. Quem faz festa começa por Eventos; quem abre a porta todo dia, por Bar e restaurante. O resto fica a um clique. As telas abaixo são do próprio painel, com dados de demonstração.
            </p>
            <div className="areas">
              {AREAS.map((a, i) => (
                <div key={a.id} id={a.id} className={`arow${i % 2 ? " flip" : ""}`}>
                  <div className="atext">
                    <span className="atag">{a.tag}</span>
                    <h3>{a.title}</h3>
                    <ul className="feat">
                      {a.features.map(([b, s]) => (
                        <li key={b}>
                          <CircleCheck aria-hidden="true" />
                          <div>
                            <b>{b}</b> <span>{s}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="shot reveal">
                    <div className="sheet" aria-hidden="true" />
                    <div className="shot-img">
                      <Image src={a.image.src} alt={a.image.alt} width={a.image.width} height={a.image.height} sizes="(min-width: 1000px) 55vw, 100vw" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="close" aria-labelledby="nk-close">
          <div className="wrap">
            <div className="close-card">
              <h2 id="nk-close">Junte a sua operação numa conta só.</h2>
              <p className="sub">Crie a conta, escolha as partes que você usa e comece pelo que a sua casa ou o seu evento faz hoje.</p>
              <div className="cta">
                <a className="btn btn-primary" href={cadastroUrl}>
                  Criar minha conta <ArrowRight aria-hidden="true" />
                </a>
                <a className="btn btn-line" href={entrarUrl}>
                  Entrar
                </a>
              </div>
              <span className="close-wm" aria-hidden="true">
                <NoktaWordmark className="!text-inherit" />
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <Link href="/" className="brand" aria-label="Nokta">
              <NoktaWordmark className="text-[42px]" />
            </Link>
            <div className="foot-cols">
              <div>
                <b>Plataforma</b>
                <a href="#eventos">Eventos</a>
                <a href="#bar">Bar e restaurante</a>
                <a href={ticketsUrl}>Bilheteria</a>
              </div>
              <div>
                <b>Conta</b>
                <a href={entrarUrl}>Entrar</a>
                <a href={cadastroUrl}>Criar conta</a>
                <a href="mailto:contato@noktatickets.com.br">Contato</a>
              </div>
              <div>
                <b>Legal</b>
                <Link href="/termos">Termos de uso</Link>
                <Link href="/privacidade">Privacidade</Link>
                <Link href="/politica-de-cancelamento">Reembolso</Link>
              </div>
            </div>
          </div>
          <p className="legal">Nokta Tecnologia LTDA · CNPJ 59.386.582/0001-39</p>
        </div>
      </footer>
    </div>
  );
}
