import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import type { IconName } from "@/components/ui/icon";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, comparativoMetadata, crumbsFor, linhasBar } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-goomer";
const TITLE = "Nokta vs Goomer: cardápio digital com QR code comparado";
const DESCRIPTION = "Goomer ou Nokta? Compare o cardápio digital com QR code e veja o que vem junto na Nokta: comandas, reservas, estoque, caixa e venda de ingressos na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const CARDAPIO: { icon: IconName; title: string; text: string }[] = [
  { icon: "qr", title: "Um QR pra tudo", text: "O mesmo QR serve pras mesas, pro balcão e pra bio do Instagram. Você imprime uma vez." },
  { icon: "bolt", title: "Esgotado na hora", text: "Acabou o item, ele some do cardápio. O cliente não pede o que não tem e o garçom não precisa voltar na mesa." },
  { icon: "receipt", title: "Pedido no lugar certo", text: "O garçom lança o pedido na comanda, pelo painel ou pela maquininha, e ele segue pro preparo na cozinha ou no bar." },
  { icon: "image", title: "Itens com foto e preço", text: "Categorias, fotos, variantes e adicionais organizados pro cliente decidir rápido na mesa." },
];

const FAQ = [
  {
    q: "A Nokta tem cardápio digital com QR code?",
    a: "Tem. Um QR serve pras mesas e pra bio, e o que está esgotado sai do cardápio na hora. Os pedidos são lançados em comandas, no painel ou na maquininha do garçom, e seguem pro preparo.",
  },
  {
    q: "A Nokta é uma alternativa ao Goomer?",
    a: "Para quem quer cardápio digital junto de comandas, reservas, estoque, caixa e venda de ingressos de eventos, sim. Tudo fica numa conta só.",
  },
  {
    q: "A Nokta cobra mensalidade pelo cardápio digital?",
    a: "A Nokta não cobra mensalidade. Você liga só as partes que a sua casa usa.",
  },
  {
    q: "Consigo vender ingresso de evento no mesmo sistema do restaurante?",
    a: "Consegue. A venda de ingressos, com lotes, lista VIP e promoters, fica na mesma conta do cardápio e das comandas. Os números de ingressos e de bar aparecem separados.",
  },
  {
    q: "Preciso de equipamento especial pra usar o cardápio digital?",
    a: "Não. O cliente lê o QR com o próprio celular. A equipe usa o painel e a maquininha do garçom pra comandas.",
  },
];

export default function NoktaVsGoomerPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Goomer", PATH)}
        title="Nokta vs Goomer"
        lede="Goomer e Nokta oferecem cardápio digital com QR code. Na Nokta, o cardápio é uma parte de um sistema maior, com comandas, reservas, estoque, caixa e até venda de ingressos."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Goomer é uma empresa brasileira conhecida por soluções de cardápio digital e pedidos para restaurantes. Para quem quer começar pelo cardápio, é um nome bastante citado no mercado.
          </p>
          <p>
            A Nokta tende a servir melhor bares, casas noturnas e restaurantes que também fazem eventos, ou que querem cardápio, comandas, reservas, estoque e caixa no mesmo painel. O cardápio conversa com o resto da operação.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Goomer ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Goomer"]}
          caption="Comparativo de recursos entre Nokta e Goomer"
          rows={linhasBar({ cardapio: true })}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança. Consulte o site oficial do Goomer para planos e recursos atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="cardapio" title="Cardápio digital com QR code na Nokta" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            O cardápio digital da Nokta resolve o básico bem: o cliente aponta a câmera e vê os itens com foto e preço. O que acabou na cozinha some do cardápio na hora. Assim ninguém pede o que não tem, e a equipe para de correr pra avisar mesa por mesa.
          </p>
          <p>
            A diferença aparece na hora do pedido. O garçom lança na comanda, o pedido segue pro preparo e a venda entra no financeiro da mesma conta. O cardápio, a comanda e o caixa usam os mesmos itens e preços. Mais detalhes em <Link href="/solucoes/cardapio-digital">cardápio digital</Link>.
          </p>
        </Prose>
        <FeatureGrid items={CARDAPIO} columns={2} />
      </ContentSection>

      <ContentSection id="operacao" title="A operação inteira da casa" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Além do cardápio, o módulo de bar e restaurante cobre o dia a dia. Comandas no painel e na maquininha do garçom. Reservas do dia separadas por status e fila de espera em ordem. Estoque com alerta do que está abaixo do mínimo. Caixa com abertura, fechamento e a diferença entre o esperado e o contado. Veja <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="eventos" title="Eventos na mesma conta">
        <Prose>
          <p>
            Muita casa faz noite temática, show, festa de aniversário da casa ou happy hour com atração. Na Nokta, você vende os ingressos desses eventos na mesma conta do restaurante. O comprador paga com Pix ou cartão em até 12x e recebe o QR pelo WhatsApp. A portaria faz o check-in pelo celular.
          </p>
          <p>
            Para divulgar, você tem lista VIP com link, promoters com link e código, cupons e um CRM com campanhas por e-mail e WhatsApp. Os números de ingressos e de bar aparecem lado a lado, sem somar por engano.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="quando-goomer" title="Quando o Goomer pode fazer mais sentido">
        <Prose>
          <ul>
            <li>você quer resolver só o cardápio digital agora, sem mexer no resto da operação;</li>
            <li>a sua casa já usa outro sistema de gestão e você busca uma solução focada em cardápio e pedidos;</li>
            <li>você não faz eventos com ingresso e não precisa de reservas ou estoque no mesmo lugar.</li>
          </ul>
          <p>Confira no site oficial do Goomer os planos e recursos atuais.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta</strong> e ligue o módulo de bar e restaurante. Sem mensalidade.
            </li>
            <li>
              <strong>Cadastre o cardápio</strong> com categorias, itens, fotos e preços.
            </li>
            <li>
              <strong>Configure a operação:</strong> mesas, equipe com permissões, estoque mínimo e caixa.
            </li>
            <li>
              <strong>Imprima o QR</strong> e coloque nas mesas. Use o mesmo link na bio.
            </li>
            <li>
              <strong>Crie o primeiro evento</strong>, se a casa fizer noites com ingresso.
            </li>
          </ol>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-consumer", "/solucoes/cardapio-digital", "/solucoes/sistema-para-bar", "/comparativos/nokta-vs-sympla"]} />
      <CtaBand title="Cardápio, comandas e eventos numa conta" text="Crie a conta, cadastre o cardápio e imprima o QR. Sem mensalidade." />
    </>
  );
}
