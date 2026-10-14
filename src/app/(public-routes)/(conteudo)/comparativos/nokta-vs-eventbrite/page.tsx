import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, RECURSOS_DIVULGACAO, RECURSOS_EVENTO, comparativoMetadata, crumbsFor, linhasIngressos } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-eventbrite";
const TITLE = "Nokta vs Eventbrite: qual escolher para vender ingressos";
const DESCRIPTION = "Eventbrite ou Nokta? Compare uma plataforma global com uma feita pra festa brasileira: Pix, cartão em 12x, QR pelo WhatsApp, promoters e bar na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const FAQ = [
  {
    q: "A Nokta é uma alternativa ao Eventbrite no Brasil?",
    a: "Sim. A Nokta é uma plataforma brasileira de ingressos feita pra festas, baladas e casas noturnas, com Pix, cartão em até 12x, QR pelo WhatsApp e operação de bar na mesma conta.",
  },
  {
    q: "A Nokta aceita Pix?",
    a: "Aceita. O comprador paga com Pix ou cartão de crédito em até 12x, com autenticação 3DS no cartão.",
  },
  {
    q: "A Nokta funciona para eventos fora do Brasil?",
    a: "A Nokta foi feita pro mercado brasileiro: textos em português, pagamento em reais com Pix e cartão parcelado. Para eventos em vários países, uma plataforma global pode atender melhor.",
  },
  {
    q: "Quanto custa usar a Nokta?",
    a: "Não tem mensalidade. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você configura por evento.",
  },
  {
    q: "Como o comprador recebe o ingresso na Nokta?",
    a: "Pelo WhatsApp, com o QR code. Na entrada, a equipe lê o código com o celular.",
  },
];

export default function NoktaVsEventbritePage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Eventbrite", PATH)}
        title="Nokta vs Eventbrite"
        lede="O Eventbrite é uma plataforma global de eventos e ingressos. A Nokta é brasileira e foi feita pra festa: Pix, cartão em 12x, QR no WhatsApp e o bar na mesma conta."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Eventbrite é uma das plataformas de eventos mais conhecidas do mundo e atende organizadores em muitos países. Esse alcance internacional é a sua grande força, principalmente pra quem faz eventos fora do Brasil ou com público estrangeiro.
          </p>
          <p>
            A Nokta tende a servir melhor quem produz festa, balada ou evento de casa noturna no Brasil. Ela foi desenhada em torno de hábitos locais: Pix, cartão parcelado, ingresso no WhatsApp, promoters e lista VIP. E junta tudo isso à operação do bar.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Eventbrite ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Eventbrite"]}
          caption="Comparativo de recursos entre Nokta e Eventbrite"
          rows={linhasIngressos({ vendaOnline: true })}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança para o Brasil. Consulte o site oficial do Eventbrite para condições atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="brasil" title="Feita pro jeito brasileiro de comprar ingresso" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            No Brasil, boa parte do público paga com Pix ou parcela no cartão. A Nokta aceita os dois: Pix e cartão em até 12x, com 3DS. A taxa de serviço aparece no checkout antes do pagamento, então ninguém leva susto no final.
          </p>
          <p>
            O ingresso chega no WhatsApp, o app que o público já abre dezenas de vezes por dia. Na porta, a equipe lê o QR com o celular, num fluxo pensado pra lugar em que o sinal oscila. Se alguém desistir, anuncia o ingresso na revenda oficial, e o QR fica suspenso enquanto o anúncio está no ar.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_EVENTO} />
      </ContentSection>

      <ContentSection id="festa" title="Ferramentas de festa, não só de evento" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Festa vende por indicação. Na Nokta, cada promoter tem link e código próprios, com comissão sobre o que vendeu. A lista VIP sai de um link de inscrição. O CRM guarda quem já foi nas suas festas e permite campanha por e-mail ou WhatsApp no próximo evento. Cupons ajudam a ativar parceiros e influenciadores.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_DIVULGACAO} columns={2} />
      </ContentSection>

      <ContentSection id="bar" title="Ingressos e bar numa conta só" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Para casa noturna, bar ou restaurante, a Nokta liga o módulo de operação na mesma conta dos ingressos: cardápio digital com QR, comandas, pedidos pro preparo, reservas, fila, estoque e financeiro. Ingressos e bar ficam lado a lado no painel, sem números somados por engano. Saiba mais em <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="quando-eventbrite" title="Quando o Eventbrite pode fazer mais sentido">
        <Prose>
          <ul>
            <li>você organiza eventos em mais de um país ou vende pra público de fora do Brasil;</li>
            <li>o seu evento é uma conferência, workshop ou encontro corporativo e a marca global ajuda na confiança do público;</li>
            <li>a sua equipe já usa a ferramenta em outros mercados e quer manter um processo só.</li>
          </ul>
          <p>Confira no site oficial do Eventbrite as condições atuais pro Brasil, como formas de pagamento, taxas e repasse.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta.</strong> Cadastro de produtor grátis, sem mensalidade.
            </li>
            <li>
              <strong>Cadastre o evento.</strong> Arte, data, local, setores, lotes e a taxa de serviço, se quiser mudar o padrão.
            </li>
            <li>
              <strong>Configure o recebimento.</strong> Cadastre a conta bancária. O saldo de cada evento aparece separado.
            </li>
            <li>
              <strong>Prepare a divulgação.</strong> Links de promoters, lista VIP e cupons.
            </li>
            <li>
              <strong>Divulgue o link.</strong> Use na bio, nos stories e nas campanhas.
            </li>
          </ol>
          <p>
            Passo a passo completo em <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-sympla", "/comparativos/alternativas-sympla", "/solucoes/vender-ingressos-online", "/guias/como-vender-ingressos-online"]} />
      <CtaBand title="Venda a sua festa com Pix e 12x" text="Crie a conta, cadastre o evento e compartilhe o link. Sem mensalidade." />
    </>
  );
}
