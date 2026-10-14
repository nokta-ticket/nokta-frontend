import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { NOTA_COMPARATIVO, PUBLICADO, RECURSOS_BAR, RECURSOS_DIVULGACAO, RECURSOS_EVENTO, comparativoMetadata, crumbsFor, linhasIngressos } from "../_comum/comparativo";

const PATH = "/comparativos/nokta-vs-shotgun";
const TITLE = "Nokta vs Shotgun: ingressos para festas e música eletrônica";
const DESCRIPTION = "Shotgun ou Nokta para festa de música eletrônica? Compare promoters, lista VIP, check-in no celular, Pix e cartão em 12x e o bar da casa na mesma conta.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const FAQ = [
  {
    q: "A Nokta serve para festa de música eletrônica?",
    a: "Serve. A Nokta foi feita pra festa e casa noturna: lotes com virada, promoters com link e código, lista VIP, check-in no celular e revenda oficial.",
  },
  {
    q: "A Nokta é uma alternativa ao Shotgun?",
    a: "Sim. As duas vendem ingressos pra festas. A Nokta junta a venda à operação do bar da casa, com cardápio digital, comandas, estoque e caixa na mesma conta.",
  },
  {
    q: "Quanto custa vender ingressos na Nokta?",
    a: "Não tem mensalidade. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você configura por evento.",
  },
  {
    q: "O público precisa baixar um app pra entrar na festa?",
    a: "Não. O QR do ingresso chega pelo WhatsApp e a portaria lê com o celular.",
  },
  {
    q: "Como controlo a lista VIP e os convidados dos DJs?",
    a: "Crie uma lista VIP com link de inscrição. Quem se inscreve entra na lista da portaria, sem planilha nem mensagem perdida em grupo.",
  },
];

export default function NoktaVsShotgunPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Nokta vs Shotgun", PATH)}
        title="Nokta vs Shotgun"
        lede="As duas falam com quem faz festa. O Shotgun é conhecido na cena de música eletrônica; a Nokta junta venda, portaria, promoters e o bar da casa numa conta só."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Shotgun é uma plataforma de ingressos conhecida na cena de música eletrônica, com presença em vários países. Para coletivos e festas que já têm público nessa comunidade, essa familiaridade é uma força real.
          </p>
          <p>
            A Nokta tende a servir melhor quem quer controlar a festa inteira num painel só: venda com Pix e cartão em 12x, promoters, lista VIP, check-in e, se a festa acontece numa casa própria, o bar.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tabela" title="Shotgun ou Nokta: lado a lado" wide>
        <ResponsiveComparison
          columns={["Nokta", "Shotgun"]}
          caption="Comparativo de recursos entre Nokta e Shotgun"
          rows={linhasIngressos({ vendaOnline: true })}
          note={
            <>
              &ldquo;Não informado&rdquo; quer dizer que não confirmamos a informação em fonte pública com segurança para o Brasil. Consulte o site oficial do Shotgun para condições atuais. {NOTA_COMPARATIVO}
            </>
          }
        />
      </ContentSection>

      <ContentSection id="pista" title="Da pré-venda à pista" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Festa eletrônica tem lote que esgota em minutos e público que compra de madrugada. Na Nokta, você define os lotes e a virada. O comprador paga com Pix ou cartão em até 12x, vê a taxa de serviço no checkout e recebe o QR no WhatsApp.
          </p>
          <p>
            Na entrada, a equipe lê o QR com o celular. O fluxo foi pensado pra galpão, clube ou área aberta onde a internet oscila. Quem não puder ir anuncia o ingresso na revenda oficial, e o QR fica suspenso enquanto o anúncio está ativo. Isso diminui o espaço pra golpe com ingresso repassado em grupo.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_EVENTO} />
      </ContentSection>

      <ContentSection id="comunidade" title="Promoters, lista VIP e a sua comunidade" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Coletivo vive da sua comunidade. Na Nokta, cada promoter tem link e código próprios, e você vê quanto cada um vendeu, com a comissão calculada. Os convidados dos DJs entram por uma lista VIP com link. Quem comprou fica no seu CRM, e a próxima edição pode ser anunciada por e-mail ou WhatsApp direto pra quem já esteve na pista.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_DIVULGACAO} columns={2} />
      </ContentSection>

      <ContentSection id="casa" title="Se a festa tem casa, o bar vem junto" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Clubes e casas noturnas vendem ingresso e bebida na mesma noite. Na Nokta, o módulo de bar fica na mesma conta: cardápio digital com QR, comandas, pedidos pro preparo, estoque com alerta de mínimo e fechamento de caixa. Ingressos e bar aparecem lado a lado, sem misturar os números. Veja <Link href="/solucoes/sistema-para-bar">sistema para bar</Link> e <Link href="/solucoes/cardapio-digital">cardápio digital</Link>.
          </p>
        </Prose>
        <FeatureGrid items={RECURSOS_BAR} />
      </ContentSection>

      <ContentSection id="quando-shotgun" title="Quando o Shotgun pode fazer mais sentido">
        <Prose>
          <ul>
            <li>o seu público já descobre e compra festas por lá e você quer estar onde ele está;</li>
            <li>você produz festas em mais de um país e quer uma ferramenta só;</li>
            <li>você não opera bar e a divulgação dentro da comunidade da plataforma pesa mais que os outros recursos.</li>
          </ul>
          <p>Confira no site oficial do Shotgun as condições atuais de taxa, repasse e recursos pro Brasil.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta.</strong> Grátis e sem mensalidade.
            </li>
            <li>
              <strong>Cadastre a festa.</strong> Arte, line-up na descrição, local, lotes e a taxa de serviço se quiser mudar o padrão.
            </li>
            <li>
              <strong>Configure o recebimento.</strong> Cadastre a conta bancária pro saque.
            </li>
            <li>
              <strong>Monte o time.</strong> Links de promoters, lista VIP dos DJs e cupons pra parceiros.
            </li>
            <li>
              <strong>Divulgue o link.</strong> Bio do coletivo, stories e campanha pro seu CRM.
            </li>
          </ol>
          <p>
            Mais dicas no guia <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-sympla", "/comparativos/nokta-vs-ingresse", "/solucoes/vender-ingressos-online", "/solucoes/sistema-para-bar"]} />
      <CtaBand title="Coloque a próxima festa na Nokta" text="Crie a conta, cadastre a festa e compartilhe o link. Sem mensalidade." />
    </>
  );
}
