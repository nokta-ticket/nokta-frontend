import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, RECURSOS_DIVULGACAO, RECURSOS_EVENTO, comparativoMetadata, crumbsFor, linhasIngressos } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-ingresse";
const TITLE = "Nokta vs Ingresse: comparativo para produtores de festa";
const DESCRIPTION = "Ingresse ou Nokta? Compare recursos para vender ingressos de festa: taxa no checkout, Pix e cartão em 12x, revenda oficial, promoters e bar na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const FAQ = [
  {
    q: "A Nokta é uma alternativa à Ingresse?",
    a: "Sim. As duas são plataformas brasileiras de venda de ingressos. A Nokta junta na mesma conta a venda, a portaria, os promoters, o CRM e a operação de bar e restaurante.",
  },
  {
    q: "A Nokta cobra mensalidade?",
    a: "Não. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você configura por evento.",
  },
  {
    q: "A Nokta tem revenda de ingressos?",
    a: "Tem revenda oficial dentro da plataforma. Enquanto o ingresso está anunciado, o QR fica suspenso, o que evita que o mesmo ingresso seja usado duas vezes.",
  },
  {
    q: "Como a portaria funciona na Nokta?",
    a: "O comprador recebe o QR pelo WhatsApp e a equipe lê o código com o celular. O check-in foi pensado pra lugares em que a internet oscila.",
  },
  {
    q: "Dá pra testar a Nokta num evento só?",
    a: "Dá. Crie a conta, cadastre um evento e divulgue o link. Sem mensalidade, você só paga quando vende.",
  },
];

export default function NoktaVsIngressePage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Ingresse", PATH)}
        title="Nokta vs Ingresse"
        lede="Ingresse e Nokta são plataformas brasileiras de venda de ingressos. A Nokta se diferencia por colocar a festa e a operação do bar na mesma conta."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            A Ingresse é uma plataforma brasileira de venda de ingressos para eventos, já estabelecida no mercado nacional. Para quem já usa e está satisfeito, trocar pode não ser prioridade.
          </p>
          <p>
            A Nokta tende a servir melhor o produtor que quer venda, portaria, promoters, lista VIP e CRM no mesmo painel, e a casa que também opera bar ou restaurante. Tudo fica numa conta só, sem mensalidade.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Ingresse ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Ingresse"]}
          caption="Comparativo de recursos entre Nokta e Ingresse"
          rows={linhasIngressos({ vendaOnline: true })}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança. Consulte o site oficial da Ingresse para condições atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="venda" title="Do checkout à portaria" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Na Nokta, o comprador vê a taxa de serviço no checkout antes de pagar. Ele escolhe Pix ou cartão em até 12x, e o cartão passa por autenticação 3DS. O ingresso chega no WhatsApp, onde a pessoa já conversa com os amigos e encontra o QR rápido na hora de entrar.
          </p>
          <p>
            Na porta, a equipe usa o próprio celular pra ler os códigos. Quem não puder ir anuncia o ingresso na revenda oficial, e o QR fica suspenso enquanto o anúncio está ativo. Isso reduz o risco de ingresso duplicado circulando em grupo.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_EVENTO} />
      </ContentSection>

      <ContentSection id="dinheiro" title="Dinheiro separado por evento">
        <Prose>
          <p>
            Quem produz várias festas no mês precisa saber quanto cada uma rendeu. Na Nokta, cada evento tem saldo próprio, dividido em três partes: o que está liberado, o que está em custódia e o que já foi pra saque. O saque cai na conta bancária cadastrada.
          </p>
          <p>
            Cada venda mostra o que é comissão e o que o comprador pagou por cima. Assim, o fechamento com sócios, casa e atrações fica mais simples.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="divulgacao" title="Promoters, lista VIP e campanhas" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Cada promoter tem link e código próprios, e a comissão sai do que ele vendeu. A lista VIP funciona com um link: a pessoa se inscreve e o nome entra na lista da portaria. Quem comprou fica no seu CRM, pronto pra receber campanha por e-mail ou WhatsApp no próximo evento.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_DIVULGACAO} columns={2} />
      </ContentSection>

      <ContentSection id="bar" title="Bar e restaurante na mesma conta" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Se a sua festa acontece numa casa própria, ou se você também tem bar, a Nokta liga o módulo de operação sem abrir outra conta. Cardápio digital com QR, comandas, reservas, estoque e caixa ficam ao lado dos ingressos. Veja <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="quando-ingresse" title="Quando a Ingresse pode fazer mais sentido">
        <Prose>
          <ul>
            <li>a sua equipe já opera bem com a ferramenta e a troca agora custaria mais do que renderia;</li>
            <li>você tem contrato ou condição comercial negociada que atende o seu evento;</li>
            <li>você não precisa de operação de bar, lista VIP ou promoters no mesmo painel.</li>
          </ul>
          <p>Confira no site oficial da Ingresse as condições atuais de taxa, repasse e recursos antes de comparar números.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta de produtor.</strong> É grátis e sem mensalidade.
            </li>
            <li>
              <strong>Cadastre o evento.</strong> Arte, data, local, setores, lotes e, se quiser, uma taxa de serviço diferente do padrão.
            </li>
            <li>
              <strong>Configure o recebimento.</strong> Cadastre a conta bancária que vai receber os saques.
            </li>
            <li>
              <strong>Monte a equipe de venda.</strong> Crie os links dos promoters, a lista VIP e os cupons.
            </li>
            <li>
              <strong>Divulgue o link.</strong> Bio, stories, grupos e campanhas pro seu CRM.
            </li>
          </ol>
          <p>
            Detalhes no guia <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-sympla", "/comparativos/nokta-vs-shotgun", "/solucoes/vender-ingressos-online", "/guias/como-vender-ingressos-online"]} />
      <CtaBand title="Teste a Nokta no próximo evento" text="Crie a conta, cadastre a festa e compartilhe o link. Sem mensalidade." />
    </>
  );
}
