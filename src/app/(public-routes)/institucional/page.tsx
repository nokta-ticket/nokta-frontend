import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, ArrowUp, CircleCheck } from "lucide-react";
import { getPlatformUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { NoktaWordmark } from "@/components/brand/nokta-wordmark";
import { HeroStage, CloseVisual } from "./_components/hero-stage";
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

const MOTION_BOOT =
  "(function(){var r=document.getElementById('institucional-lp');if(r&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){r.setAttribute('data-motion','true')}})()";

type Area = {
  id: string;
  tag: string;
  title: string;
  features: [string, string][];
  image: { src: string; width: number; height: number; alt: string };
  /** Recorte legível no celular (a captura inteira de 1440px vira miniatura). */
  mobile: { src: string; width: number; height: number };
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
    mobile: { src: "/institucional/m-eventos.webp", width: 740, height: 980 },
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
    mobile: { src: "/institucional/m-comandas.webp", width: 900, height: 900 },
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
    mobile: { src: "/institucional/m-reservas.webp", width: 900, height: 811 },
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
    mobile: { src: "/institucional/m-financeiro.webp", width: 1000, height: 552 },
  },
];

export default function InstitucionalPage() {
  const entrarUrl = getPlatformUrl("/login");
  const cadastroUrl = getPlatformUrl("/register?ctx=produtor");
  const ticketsUrl = getPublicTicketsUrl("/");
  const headline = "Do ingresso ao fechamento do caixa, numa conta só.".split(" ");

  return (
    <div id="institucional-lp" className="nk fixed inset-0 z-50 flex w-full max-w-full flex-col overflow-x-hidden overflow-y-auto" suppressHydrationWarning>
      {/* Liga o estado inicial das animações ainda durante o carregamento do HTML,
          antes da primeira pintura: sem isso o conteúdo aparece pronto e "pisca". */}
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
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
        <section className="hero" aria-labelledby="nk-title">
          <div className="wrap">
            <div className="hero-copy">
              <h1 id="nk-title" aria-label={headline.join(" ")}>
                {headline.map((w, i) => (
                  <Fragment key={i}>
                    <span className="w" style={{ ["--i" as string]: i }} aria-hidden="true">
                      {w}
                    </span>{" "}
                  </Fragment>
                ))}
              </h1>
              <p className="lede intro" style={{ ["--d" as string]: "520ms" }}>
                A Nokta junta a venda de ingressos, a operação do bar e restaurante, as reservas e o financeiro. Você liga só as partes que usa.
              </p>
              <div className="cta intro" style={{ ["--d" as string]: "640ms" }}>
                <a className="btn btn-primary" href={cadastroUrl}>
                  Criar minha conta <ArrowRight aria-hidden="true" />
                </a>
                <a className="btn btn-line" href={entrarUrl}>
                  Já tenho conta
                </a>
              </div>
            </div>
            <HeroStage />
          </div>
        </section>

        <section className="areas-sec" aria-labelledby="nk-areas">
          <div className="wrap">
            <div className="sec-head" data-reveal>
              <h2 id="nk-areas">Quatro partes. Ligue a que você precisa hoje.</h2>
              <p className="sub">
                Cada parte resolve um pedaço da operação e conversa com as outras. Quem faz festa começa por Eventos; quem abre a porta todo dia, por Bar e restaurante. As telas abaixo são do próprio painel, com dados de demonstração.
              </p>
            </div>
            <div className="areas">
              {AREAS.map((a, i) => (
                <article key={a.id} id={a.id} className={`arow${i % 2 ? " flip" : ""}`} data-reveal>
                  <div className="atext">
                    <h3>{a.tag}</h3>
                    <p className="alead">{a.title}</p>
                    <ul className="feat">
                      {a.features.map(([b, s], k) => (
                        <li key={b} style={{ ["--i" as string]: k }}>
                          <CircleCheck aria-hidden="true" />
                          <div>
                            <b>{b}</b> <span>{s}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="shot">
                    <picture className="shot-img">
                      <source media="(max-width: 699px)" srcSet={a.mobile.src} width={a.mobile.width} height={a.mobile.height} />
                      <Image src={a.image.src} alt={a.image.alt} width={a.image.width} height={a.image.height} sizes="(min-width: 1000px) 55vw, 100vw" />
                    </picture>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="close" aria-labelledby="nk-close">
          <div className="wrap">
            <div className="close-band" data-reveal>
              <div className="close-copy">
                <h2 id="nk-close">Junte a sua operação numa conta só.</h2>
                <p className="sub">Crie a conta, escolha as partes que você usa e comece pelo que a sua casa ou o seu evento faz hoje.</p>
                <div className="cta">
                  <a className="btn btn-primary" href={cadastroUrl}>
                    Criar minha conta <ArrowRight aria-hidden="true" />
                  </a>
                  <a className="btn btn-ghost-dark" href={entrarUrl}>
                    Entrar
                  </a>
                </div>
              </div>
              <CloseVisual />
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <NoktaWordmark className="text-[44px]" />
              <p>Ingressos, operação do bar e restaurante, reservas e financeiro numa conta só.</p>
              <a className="btn btn-primary btn-sm" href={cadastroUrl}>
                Criar conta <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <nav className="foot-cols" aria-label="Rodapé">
              <div>
                <b>Plataforma</b>
                {AREAS.map((a) => (
                  <a key={a.id} href={`#${a.id}`}>
                    {a.tag}
                  </a>
                ))}
              </div>
              <div>
                <b>Conta</b>
                <a href={cadastroUrl}>Criar conta</a>
                <a href={entrarUrl}>Entrar</a>
                <a href={ticketsUrl}>Bilheteria</a>
              </div>
              <div>
                <b>Legal</b>
                <Link href="/termos">Termos de uso</Link>
                <Link href="/privacidade">Privacidade</Link>
                <Link href="/politica-de-cancelamento">Reembolso</Link>
                <a href="mailto:contato@noktatickets.com.br">Contato</a>
              </div>
            </nav>
          </div>
          <div className="foot-bottom">
            <p>© {new Date().getFullYear()} Nokta Tecnologia LTDA · CNPJ 59.386.582/0001-39</p>
            <a href="#nk-title" className="to-top">
              Voltar ao topo <ArrowUp aria-hidden="true" />
            </a>
          </div>
          <div className="foot-mark" aria-hidden="true">
            <NoktaWordmark className="!text-inherit" />
          </div>
        </div>
      </footer>
    </div>
  );
}
