import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, RECURSOS_DIVULGACAO, RECURSOS_EVENTO, comparativoMetadata, crumbsFor, linhasIngressos } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-sympla";
const TITLE = "Nokta vs Sympla: alternativa ao Sympla para festas";
const DESCRIPTION = "Sympla ou Nokta? Compare recursos para vender ingressos de festa: taxa no checkout, Pix e cartão em 12x, check-in pelo celular, promoters e bar na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const FAQ = [
  {
    q: "A Nokta é uma alternativa ao Sympla?",
    a: "Sim. As duas vendem ingressos online. A Nokta foi feita pra festas, baladas e casas noturnas, com promoters, lista VIP, revenda oficial e o módulo de bar e restaurante na mesma conta.",
  },
  {
    q: "Quanto custa vender ingressos na Nokta?",
    a: "Não tem mensalidade. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você pode configurar por evento.",
  },
  {
    q: "Posso usar a Nokta e o Sympla ao mesmo tempo?",
    a: "Pode. Muitos produtores testam uma plataforma nova num evento antes de migrar tudo. Só cuide pra não vender a mesma capacidade nos dois lugares sem controle de estoque de ingressos.",
  },
  {
    q: "Consigo levar meus compradores do Sympla pra Nokta?",
    a: "Os dados de compradores de outra plataforma seguem as regras dela e a LGPD. Na Nokta, cada nova compra entra no seu CRM, e você usa essa base pra campanhas por e-mail e WhatsApp nos próximos eventos.",
  },
  {
    q: "Quais formas de pagamento a Nokta aceita?",
    a: "Pix e cartão de crédito em até 12x. O cartão passa por autenticação 3DS, que reduz o risco de compra com cartão de terceiros.",
  },
  {
    q: "Como o dinheiro dos ingressos chega até mim na Nokta?",
    a: "O saldo fica separado por evento, mostrando o que está liberado, o que está em custódia e o que já está em saque. O saque cai na conta bancária cadastrada.",
  },
];

export default function NoktaVsSymplaPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Sympla", PATH)}
        title="Nokta vs Sympla"
        lede="Sympla e Nokta vendem ingressos online. A diferença está no foco: a Nokta nasceu pra festa e casa noturna e junta venda de ingressos, portaria e operação do bar numa conta só."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Sympla é uma plataforma brasileira muito conhecida de venda de ingressos e inscrições, usada por eventos de vários formatos, de cursos e congressos a shows. Esse alcance e o reconhecimento da marca são pontos fortes reais.
          </p>
          <p>
            A Nokta tende a servir melhor quem produz festa, balada e evento de casa noturna, e quem também opera bar ou restaurante. Promoters, lista VIP, check-in no celular e cardápio digital ficam no mesmo painel.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Sympla ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Sympla"]}
          caption="Comparativo de recursos entre Nokta e Sympla"
          rows={linhasIngressos({ vendaOnline: true })}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança. Consulte o site oficial do Sympla para condições atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="venda-e-portaria" title="Venda e portaria pensadas pra festa" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Festa tem um ritmo próprio. A venda acelera nos últimos dias, o lote vira de madrugada e a fila da porta não pode travar. A Nokta foi desenhada pra esse ritmo. O comprador paga com Pix ou cartão em até 12x e recebe o QR no WhatsApp. Na porta, a equipe lê o código com o celular.
          </p>
          <p>
            A taxa de serviço aparece pro comprador no checkout, sem surpresa no final. Cada venda mostra o que é comissão e o que o comprador pagou por cima. Do seu lado, cada evento tem saldo próprio, então a festa de sexta não se mistura com a de sábado.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_EVENTO} />
      </ContentSection>

      <ContentSection id="divulgacao" title="Divulgação com promoters, lista VIP e CRM" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Em festa, boa parte da venda vem de gente: promoter, DJ, influenciador, a turma que leva a turma. Na Nokta, cada promoter tem link e código próprios e você acompanha quem vendeu o quê. A lista VIP funciona com um link de inscrição, sem planilha e sem grupo de WhatsApp pra controlar nome.
          </p>
          <p>
            Quem compra entra no seu CRM. No próximo evento, você manda campanha por e-mail ou WhatsApp pra quem já foi. Veja mais em <Link href="/solucoes/vender-ingressos-online">vender ingressos online</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_DIVULGACAO} columns={2} />
      </ContentSection>

      <ContentSection id="bar" title="O bar na mesma conta" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Esse é o ponto que mais separa a Nokta de uma plataforma só de ingressos. Se você tem casa noturna, bar ou restaurante, liga o módulo de operação na mesma conta. Cardápio digital com QR, comandas, pedidos pro preparo, reservas, fila de espera, estoque e caixa ficam ao lado da venda de ingressos.
          </p>
          <p>
            Os números não se somam por engano: ingressos têm saldo, custódia e saque; o bar tem vendas e fechamento de caixa. Mais detalhes em <Link href="/solucoes/sistema-para-bar">sistema para bar</Link> e <Link href="/solucoes/cardapio-digital">cardápio digital</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="quando-sympla" title="Quando o Sympla pode fazer mais sentido">
        <Prose>
          <p>Nenhuma plataforma serve pra tudo. O Sympla pode ser a escolha mais natural quando:</p>
          <ul>
            <li>o seu evento é um curso, congresso, palestra ou inscrição, formatos em que a plataforma é amplamente usada;</li>
            <li>o seu público já conhece a marca e você quer aproveitar esse reconhecimento;</li>
            <li>você não opera bar nem restaurante e não precisa de promoters ou lista VIP;</li>
            <li>a sua equipe já tem processos montados em torno da ferramenta e a troca não compensa agora.</li>
          </ul>
          <p>Antes de decidir, confira no site oficial do Sympla as condições atuais de taxa, repasse e recursos.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta.</strong> O cadastro de produtor é grátis e não tem mensalidade.
            </li>
            <li>
              <strong>Cadastre o evento.</strong> Coloque arte, data, local, setores e lotes. Defina a taxa de serviço se quiser mudar o padrão.
            </li>
            <li>
              <strong>Configure o recebimento.</strong> Informe a conta bancária pro saque. O saldo de cada evento aparece separado no financeiro.
            </li>
            <li>
              <strong>Monte a divulgação.</strong> Crie os links dos promoters, a lista VIP e os cupons.
            </li>
            <li>
              <strong>Divulgue o link.</strong> Coloque na bio, nos stories e nos grupos. Se quiser testar antes, comece por um evento só.
            </li>
          </ol>
          <p>
            Um passo a passo completo está no guia <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks
        currentPath={PATH}
        paths={["/comparativos/alternativas-sympla", "/comparativos/nokta-vs-ingresse", "/solucoes/vender-ingressos-online", "/guias/como-vender-ingressos-online"]}
      />
      <CtaBand title="Teste a Nokta no próximo evento" text="Crie a conta, cadastre a festa e compartilhe o link. Sem mensalidade." />
    </>
  );
}
