import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-vender-ingressos-online";
const TITLE = "Como vender ingressos online: passo a passo";
const DESCRIPTION = "Como vender ingressos online do zero: escolher a plataforma, definir lotes e preço, montar a página do evento, divulgar e organizar a portaria com QR code.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como vender ingressos online", "vender ingresso online", "venda de ingressos pela internet", "como vender ingresso de festa"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Qual a melhor forma de vender ingressos online?", a: "Use uma plataforma de venda de ingressos com Pix, cartão parcelado e QR code na entrada. Ela cuida do pagamento, entrega o ingresso e controla a portaria, e você foca em divulgar." },
  { q: "Preciso de CNPJ pra vender ingressos online?", a: "Depende da plataforma e do volume. Muitas aceitam pessoa física pra começar. Converse com um contador sobre a forma certa de declarar a receita do evento." },
  { q: "Quanto custa vender ingressos online?", a: "Varia entre plataformas. Na Nokta não tem mensalidade: a taxa de serviço aparece pro comprador no checkout, com padrão de 10%, configurável por evento." },
  { q: "Com quanto tempo de antecedência devo abrir a venda?", a: "Pra festas, de três a seis semanas costuma dar tempo de girar pelo menos dois lotes. Eventos maiores, como shows e festivais, costumam abrir com meses de antecedência." },
  { q: "Como evitar ingresso falso?", a: "Venda só por uma plataforma que gera um QR único por ingresso e valide na porta com leitura online. Ofereça revenda oficial pra quem desistir, assim ninguém precisa comprar de desconhecido." },
  { q: "Posso vender ingresso pelo WhatsApp?", a: "Pode divulgar pelo WhatsApp, mas faça a venda pelo link da plataforma. Assim o pagamento é confirmado sozinho, o ingresso chega com QR e você não precisa conferir comprovante." },
];

export default function ComoVenderIngressosOnlinePage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Como vender ingressos online", path: PATH },
        ]}
        title="Como vender ingressos online"
        lede="Pra vender ingressos online você precisa de uma plataforma que receba o pagamento e entregue um ingresso com QR, uma página de evento clara e um plano de lotes e divulgação. O passo a passo abaixo cobre cada parte, do cadastro à portaria."
        updated="2026-10-14"
      />

      <ContentSection id="plataforma" title="1. Escolha uma plataforma de venda de ingressos">
        <Prose>
          <p>
            Vender por Pix direto na sua conta parece mais simples, mas cria trabalho: conferir comprovante, montar lista, mandar ingresso um por um e controlar quem já pagou. Uma plataforma faz isso sozinha. Antes de escolher, confira:
          </p>
          <ul>
            <li>
              <strong>Formas de pagamento.</strong> Pix e cartão parcelado são o mínimo pra festa no Brasil. Autenticação 3DS no cartão reduz fraude.
            </li>
            <li>
              <strong>Custo.</strong> Existe mensalidade? A taxa é cobrada de você ou do comprador? Ela aparece claramente no checkout?
            </li>
            <li>
              <strong>Entrega do ingresso.</strong> O comprador recebe o QR onde? WhatsApp tem menos chance de se perder do que e-mail.
            </li>
            <li>
              <strong>Portaria.</strong> Dá pra validar com o celular da equipe ou precisa de equipamento?
            </li>
            <li>
              <strong>Repasse.</strong> Quando o dinheiro fica disponível e como você acompanha o saldo de cada evento.
            </li>
          </ul>
          <p>
            A Nokta foi feita pra festa e casa noturna e atende esses pontos sem mensalidade. Veja os detalhes em <Link href="/solucoes/vender-ingressos-online">vender ingressos online com a Nokta</Link>. Se você já usa outra plataforma, os <Link href="/comparativos/alternativas-sympla">comparativos</Link> ajudam a decidir.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="preco" title="2. Defina o preço e os lotes">
        <Prose>
          <p>
            O preço começa pelos custos. Some tudo o que o evento custa (local, som, luz, artistas, equipe, divulgação) e divida pela margem que sobra por ingresso. Esse é o seu ponto de equilíbrio: a quantidade mínima de ingressos pra não ter prejuízo. O guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> mostra a conta com números.
          </p>
          <p>
            Depois, divida a venda em lotes. O primeiro lote é mais barato e recompensa quem compra cedo. Cada virada cria urgência: &ldquo;o lote vira sexta&rdquo; é um dos melhores argumentos de venda que existe. Três ou quatro lotes costumam bastar pra uma festa.
          </p>
          <p>
            Se o evento tem meia-entrada, planeje desde já. A lei garante meia a alguns públicos, com cota mínima de 40% dos ingressos. As regras estão no guia de <Link href="/guias/meia-entrada">meia-entrada</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="pagina" title="3. Monte uma página de evento que vende">
        <Prose>
          <p>A página do evento é o que converte o clique em compra. Ela precisa responder, sem a pessoa rolar muito:</p>
          <ul>
            <li>o que é, quem toca e qual o clima da festa;</li>
            <li>data, horário de abertura e local, com endereço;</li>
            <li>preço do lote atual e quando ele vira;</li>
            <li>classificação etária, política de meia e o que pode ou não levar.</li>
          </ul>
          <p>
            Use uma imagem de capa legível no celular, sem texto miúdo. Pense no celular primeiro: o link chega pelo Instagram e pelo WhatsApp, e é ali que a pessoa decide se compra.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="checklist" title="O que configurar antes de publicar" wide>
        <FeatureGrid
          items={[
            { icon: "layers", title: "Lotes com data e quantidade", text: "Crie todos os lotes antes. Assim a virada acontece sozinha quando um esgota ou vence." },
            { icon: "percent", title: "Taxa de serviço", text: "Confira o valor que o comprador vai ver no checkout e se o total final faz sentido." },
            { icon: "tag", title: "Cupons", text: "Prepare um cupom pra parceiros ou pra base antiga, com limite de usos e prazo." },
            { icon: "crown", title: "Lista VIP", text: "Se quiser encher a casa cedo, crie uma lista VIP com quantidade e horário limite." },
            { icon: "megaphone", title: "Promoters", text: "Convide os promoters e defina a comissão antes da divulgação começar." },
            { icon: "users", title: "Equipe da portaria", text: "Adicione quem vai validar ingressos e faça um teste de leitura de QR." },
          ]}
        />
      </ContentSection>

      <ContentSection id="divulgar" title="4. Divulgue em ondas">
        <Prose>
          <p>
            Ingresso de festa vende em picos: no anúncio, perto de cada virada de lote e nos últimos dias. Planeje a divulgação em ondas, não um post solto. Anuncie o line-up, revele atrações aos poucos, lembre a virada de lote e mostre quando estiver acabando.
          </p>
          <p>
            Use os canais que já têm público: o Instagram da festa, os <Link href="/solucoes/promoters">promoters com link próprio</Link> e a sua base de compradores antigos, por e-mail e WhatsApp. O guia <Link href="/guias/como-divulgar-uma-festa">como divulgar uma festa</Link> traz um calendário pronto.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="acompanhar" title="5. Acompanhe as vendas e ajuste">
        <Prose>
          <p>
            Olhe o painel todo dia. Se o primeiro lote esgotou em horas, o preço pode estar baixo pros próximos. Se está parado, reforce a divulgação, ative um promoter novo ou crie um cupom com prazo curto. Mexer cedo custa menos do que correr na última semana.
          </p>
          <p>Algumas perguntas pra fazer ao painel:</p>
          <ul>
            <li>quantos ingressos faltam pro ponto de equilíbrio;</li>
            <li>qual promoter converte mais clique em compra;</li>
            <li>quanto do saldo já está liberado e quanto está em custódia.</li>
          </ul>
        </Prose>
      </ContentSection>

      <ContentSection id="portaria" title="6. Organize a portaria">
        <Prose>
          <p>
            No dia, o ingresso precisa entrar rápido. Com QR code, a equipe lê o ingresso com o celular e vê na hora se é válido. Teste a leitura antes de abrir a porta, confira o sinal de internet no ponto exato da entrada e separe a fila de quem já tem ingresso. Veja como funciona o <Link href="/solucoes/check-in-de-eventos">check-in pelo celular</Link>.
          </p>
          <p>
            Depois da festa, o trabalho continua: cada comprador entra na sua base, e o próximo evento começa a vender pra quem já foi. O checklist completo está em <Link href="/guias/como-organizar-uma-festa">como organizar uma festa</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/vender-ingressos-online", "/guias/como-calcular-preco-do-ingresso", "/guias/como-divulgar-uma-festa", "/comparativos/alternativas-sympla"]} />
      <CtaBand title="Venda o seu primeiro ingresso" text="Crie a conta, monte os lotes e publique o evento hoje. Sem mensalidade." />
    </>
  );
}
