import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-divulgar-uma-festa";
const TITLE = "Como divulgar uma festa e vender mais ingressos";
const DESCRIPTION = "Como divulgar uma festa: calendário em ondas, Instagram, promoters com link próprio, lista VIP e campanhas pra sua base por WhatsApp e e-mail.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como divulgar uma festa", "divulgação de festa", "divulgar evento no Instagram", "como vender ingresso de festa", "marketing para festas"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Com quanto tempo de antecedência devo divulgar uma festa?", a: "Pra uma festa, de três a seis semanas costuma funcionar. Dá tempo de anunciar, girar dois ou três lotes e fazer a reta final sem cansar o público." },
  { q: "Qual a melhor rede social pra divulgar festa?", a: "A que o seu público usa. Pra festa no Brasil, Instagram e WhatsApp costumam concentrar a divulgação, com TikTok crescendo pra alguns públicos. Teste e olhe de onde vêm as vendas." },
  { q: "Vale a pena pagar anúncio pra festa?", a: "Pode valer, desde que o anúncio leve direto pro link de compra e você meça quantas vendas ele trouxe. Comece com pouco, num público próximo do local, e aumente só o que der retorno." },
  { q: "Como divulgar uma festa de graça?", a: "Use o Instagram da festa, os stories dos artistas, os promoters, a lista VIP e a sua base de compradores antigos. Esses canais não custam mídia e falam com quem já conhece a festa ou confia em quem indica." },
  { q: "Como saber qual divulgação está funcionando?", a: "Use links diferentes por canal. Na Nokta, cada promoter tem um link próprio com cliques, pedidos pagos e conversão no painel. Cupons por canal também ajudam a medir." },
  { q: "O que postar pra divulgar uma festa?", a: "Line-up, fotos e vídeos da última edição, contagem pra virada de lote, bastidores da produção e a reta final com aviso de que está acabando. Sempre com o link de compra à mão." },
];

export default function ComoDivulgarUmaFestaPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Como divulgar uma festa", path: PATH },
        ]}
        title="Como divulgar uma festa"
        lede="Divulgar uma festa bem é planejar ondas: anúncio, revelações, viradas de lote e reta final, sempre com o link de compra à mão. Use os canais que já têm público (Instagram, promoters, sua base de compradores) antes de pagar anúncio."
        updated="2026-10-14"
      />

      <ContentSection id="antes" title="Antes de postar: link, preço e prazo">
        <Prose>
          <p>Divulgação sem lugar pra comprar só gera curtida. Antes do primeiro post, tenha pronto:</p>
          <ul>
            <li>
              a <strong>página do evento</strong> publicada, com data, local, atrações e preço;
            </li>
            <li>
              os <strong>lotes</strong> definidos, com quantidade e data limite. A virada é o seu melhor argumento de venda;
            </li>
            <li>
              os <strong>links rastreáveis</strong>: um pra cada promoter e, se possível, um cupom por canal.
            </li>
          </ul>
          <p>
            Se ainda não definiu o preço, comece por <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link>. Se ainda não tem onde vender, veja <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="calendario" title="Calendário de divulgação em 4 ondas">
        <Prose>
          <h3>Onda 1: anúncio (semana 1)</h3>
          <p>
            Anuncie data, local e o nome principal. Abra o primeiro lote no mesmo dia, mais barato e com quantidade pequena. Avise a sua base antes do público geral: quem já foi tem mais chance de comprar no primeiro dia.
          </p>
          <h3>Onda 2: revelações (semanas 2 e 3)</h3>
          <p>
            Revele o resto do line-up aos poucos, um nome por post. Mostre fotos e vídeos da última edição. Cada revelação é um motivo novo pra repostar o link.
          </p>
          <h3>Onda 3: viradas de lote</h3>
          <p>
            Dois ou três dias antes de cada virada, avise: &ldquo;o lote vira sexta&rdquo;. No dia da virada, mostre que o anterior esgotou. Essa urgência concentra as vendas.
          </p>
          <h3>Onda 4: reta final (última semana)</h3>
          <p>
            Contagem regressiva, lembrete de horário e local, aviso de que está acabando. É aqui que entra quem decide na última hora. Não pare de divulgar no dia da festa: tem gente que decide horas antes.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="canais" title="Os canais que mais vendem festa" wide>
        <FeatureGrid
          items={[
            { icon: "instagram", title: "Instagram da festa", text: "Feed pra line-up e fotos, stories pra urgência e link de compra fixado na bio." },
            { icon: "megaphone", title: "Promoters", text: "Cada um com link próprio e comissão. Eles levam o evento pra turmas que você não alcança." },
            { icon: "crown", title: "Lista VIP", text: "Entrada grátis até um horário, com link nos stories. Enche a casa cedo e gera foto." },
            { icon: "whatsapp", title: "Base no WhatsApp", text: "Campanha pra quem já comprou com você. Quem já foi conhece a festa e tende a responder melhor." },
            { icon: "mail", title: "E-mail", text: "Barato e direto. Bom pro anúncio e pra lembrar a virada de lote." },
            { icon: "music", title: "Artistas", text: "Peça aos DJs e artistas que postem o link. O público deles já confia neles." },
          ]}
        />
      </ContentSection>

      <ContentSection id="promoters" title="Promoters: a divulgação que se paga">
        <Prose>
          <p>
            Promoter bom tem turma. Ele vende pra amigos, colegas e seguidores que nunca veriam o seu post. Pague por resultado: comissão por ingresso vendido pelo link ou código dele.
          </p>
          <p>
            Na Nokta, cada <Link href="/solucoes/promoters">promoter</Link> recebe um link exclusivo e, se você quiser, um código de desconto pro público dele. O painel mostra cliques, pedidos pagos, conversão e comissão de cada um. Depois de um evento, você sabe quem trouxe gente e quem só prometeu.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="base" title="Sua base de compradores vale mais que seguidor">
        <Prose>
          <p>
            Seguidor vê o post se o algoritmo deixar. Comprador antigo recebe a sua mensagem. Cada pessoa que comprou ingresso ou retirou VIP é um contato que já mostrou interesse na sua festa.
          </p>
          <p>
            No CRM da Nokta, você filtra quem comprou em eventos anteriores, quem foi de fato, quem não aparece há mais de 90 dias e quem comprou um tipo de ingresso específico. Com esses públicos, manda campanha por e-mail ou WhatsApp, com estimativa de custo e agendamento. Respeite o descadastro e a LGPD: mande pra quem tem relação com a festa e facilite sair da lista.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="vip" title="Lista VIP pra encher a casa cedo">
        <Prose>
          <p>
            Festa cheia às onze vende mais bar e gera as fotos que divulgam a próxima edição. Uma <Link href="/solucoes/lista-vip">lista VIP</Link> com entrada grátis até um horário resolve isso. Na Nokta, a lista tem link próprio pros stories, quantidade limitada e horário limite pra retirar. O passo a passo está em <Link href="/guias/como-montar-lista-vip">como montar uma lista VIP</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="medir" title="Meça e corte o que não vende">
        <Prose>
          <p>Ao fim de cada evento, responda:</p>
          <ul>
            <li>quais promoters venderam mais e com qual conversão;</li>
            <li>em que dias as vendas aconteceram e o que você postou neles;</li>
            <li>quanto custou cada venda vinda de anúncio pago;</li>
            <li>quantas pessoas da lista VIP retiraram e quantas foram.</li>
          </ul>
          <p>
            Repita o que vendeu, corte o resto. Com dois ou três eventos de histórico, a divulgação fica mais barata e previsível. O checklist completo do evento está em <Link href="/guias/como-organizar-uma-festa">como organizar uma festa</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/promoters", "/guias/como-montar-lista-vip", "/guias/como-vender-ingressos-online", "/comparativos/nokta-vs-shotgun"]} />
      <CtaBand title="Divulgue com links que medem venda" text="Crie o evento, convide os promoters e mande campanha pra sua base. Sem mensalidade." />
    </>
  );
}
