import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import type { IconName } from "@/components/ui/icon";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, RECURSOS_DIVULGACAO, comparativoMetadata, crumbsFor, linhasBar } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-consumer";
const TITLE = "Nokta vs Consumer: sistema para bar e restaurante";
const DESCRIPTION = "Consumer ou Nokta? Compare sistemas para bar e restaurante: cardápio digital com QR, comandas, reservas, estoque, caixa e venda de ingressos na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const NOITE: { icon: IconName; title: string; text: string }[] = [
  { icon: "ticket", title: "Ingressos com lotes", text: "Venda a entrada da noite com Pix e cartão em até 12x. A taxa de serviço aparece pro comprador no checkout." },
  { icon: "whatsapp", title: "QR pelo WhatsApp", text: "O ingresso chega no WhatsApp e a portaria lê com o celular, num fluxo pensado pra internet instável." },
  { icon: "wallet", title: "Saldo por evento", text: "Ingressos têm saldo próprio por evento, separado do caixa do bar: liberado, em custódia e em saque." },
  { icon: "transfer", title: "Revenda oficial", text: "Quem não pode ir anuncia o ingresso na plataforma. O QR fica suspenso enquanto está anunciado." },
];

const FAQ = [
  {
    q: "A Nokta é um sistema para bar e restaurante?",
    a: "É. O módulo de bar e restaurante tem cardápio digital com QR, comandas no painel e na maquininha do garçom, pedidos pro preparo, reservas, fila de espera, estoque e financeiro com fechamento de caixa.",
  },
  {
    q: "A Nokta é uma alternativa ao Consumer?",
    a: "Para bares, casas noturnas e restaurantes que também fazem eventos, sim. A Nokta junta a operação da casa e a venda de ingressos numa conta só.",
  },
  {
    q: "A Nokta cobra mensalidade?",
    a: "Não. Você cria a conta e liga só as partes que a sua casa usa.",
  },
  {
    q: "Cada funcionário vê tudo no sistema?",
    a: "Não. Cada pessoa da equipe vê só o que o papel dela permite. O garçom não precisa ver o financeiro, por exemplo.",
  },
  {
    q: "Os números de ingressos e de bar se misturam?",
    a: "Não. Ingressos têm saldo, custódia e saque por evento. O bar tem vendas e fechamento de caixa. Eles aparecem lado a lado, nunca somados.",
  },
];

export default function NoktaVsConsumerPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Consumer", PATH)}
        title="Nokta vs Consumer"
        lede="Consumer e Nokta são sistemas para bar e restaurante. A Nokta junta a operação da casa com a venda de ingressos de eventos, na mesma conta e sem mensalidade."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Consumer é um sistema brasileiro de gestão para bares, restaurantes e outros negócios de alimentação, conhecido entre donos de estabelecimento. Para quem busca um sistema de gestão focado no salão e no balcão, é uma opção bastante citada.
          </p>
          <p>
            A Nokta tende a servir melhor a casa que vive de noite: bar com música, casa noturna, restaurante com eventos. Cardápio digital, comandas, reservas, estoque e caixa ficam ao lado da venda de ingressos, da lista VIP e dos promoters.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Consumer ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Consumer"]}
          caption="Comparativo de recursos entre Nokta e Consumer"
          rows={linhasBar()}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança. Consulte o site oficial do Consumer para planos e recursos atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="operacao" title="A operação do bar e do restaurante" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            O módulo de bar e restaurante da Nokta cobre o turno inteiro. O cliente vê o cardápio pelo QR, com o que acabou já fora da lista. O garçom abre a comanda no painel ou na maquininha, e o pedido segue pro preparo na cozinha ou no bar.
          </p>
          <p>
            As reservas do dia aparecem separadas em confirmadas, a chegar e não vieram. A fila de espera fica em ordem. O estoque avisa o que está abaixo do mínimo antes de faltar. No fim da noite, o caixa mostra a diferença entre o esperado e o contado. Veja <Link href="/solucoes/sistema-para-bar">sistema para bar</Link> e <Link href="/solucoes/cardapio-digital">cardápio digital</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="noite" title="Quando a casa também vende ingresso" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Esse é o ponto que mais separa a Nokta de um sistema só de gestão. Show, festa, noite temática e evento fechado podem ter ingresso vendido na mesma conta do bar. Você não precisa de um segundo sistema nem de planilha pra juntar os números da noite.
          </p>
        </Prose>
        <FeatureGrid items={NOITE} columns={2} />
      </ContentSection>

      <ContentSection id="publico" title="Público que volta" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Encher a casa numa terça exige base de clientes. Na Nokta, quem compra ingresso entra no CRM. Você manda campanha por e-mail ou WhatsApp, cria lista VIP com link e dá a cada promoter um link e código próprios. Mais em <Link href="/solucoes/vender-ingressos-online">vender ingressos online</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_DIVULGACAO} columns={2} />
      </ContentSection>

      <ContentSection id="quando-consumer" title="Quando o Consumer pode fazer mais sentido">
        <Prose>
          <ul>
            <li>a sua casa não faz eventos com ingresso e o foco é só a gestão do salão e do balcão;</li>
            <li>a sua equipe já está treinada no sistema e a troca agora atrapalharia a operação;</li>
            <li>você precisa de alguma integração ou rotina específica que já funciona bem na ferramenta atual.</li>
          </ul>
          <p>Confira no site oficial do Consumer os planos e recursos atuais antes de comparar.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta</strong> e ligue o módulo de bar e restaurante. Sem mensalidade.
            </li>
            <li>
              <strong>Cadastre o cardápio</strong> com categorias, itens, preços e estações de preparo.
            </li>
            <li>
              <strong>Configure a casa:</strong> mesas, equipe com permissões, estoque mínimo e caixa.
            </li>
            <li>
              <strong>Configure o recebimento</strong> dos ingressos, com a conta bancária pro saque.
            </li>
            <li>
              <strong>Divulgue:</strong> QR do cardápio nas mesas e na bio, link do próximo evento nos stories.
            </li>
          </ol>
          <p>
            Uma dica: rode os dois sistemas em paralelo por alguns dias antes de desligar o antigo.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-goomer", "/solucoes/sistema-para-bar", "/solucoes/cardapio-digital", "/comparativos/nokta-vs-shotgun"]} />
      <CtaBand title="O bar e a noite numa conta só" text="Crie a conta, cadastre o cardápio e venda o próximo evento. Sem mensalidade." />
    </>
  );
}
