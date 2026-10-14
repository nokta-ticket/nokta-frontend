import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { ResponsiveComparison } from "@/components/marketing/comparison-responsive";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import type { IconName } from "@/components/ui/icon";
import { NOTA_COMPARATIVO, PUBLICADO, comparativoMetadata, crumbsFor } from "../_comum/comparativo";

const PATH = "/comparativos/alternativas-sympla";
const TITLE = "Alternativas ao Sympla para festas e baladas";
const DESCRIPTION = "Procurando alternativas ao Sympla para festas? Veja os tipos de plataforma de ingressos, o que comparar antes de trocar e quando a Nokta é a melhor escolha.";

export const metadata = comparativoMetadata({ path: PATH, title: TITLE, description: DESCRIPTION });

const TIPOS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "ticket",
    title: "Plataformas brasileiras de ingressos",
    text: "Vendem ingressos para eventos de tipos e portes diferentes. O Sympla e a Ingresse são exemplos conhecidos. Boas pra quem faz eventos variados.",
  },
  {
    icon: "globe",
    title: "Plataformas globais de eventos",
    text: "Operam em muitos países, como o Eventbrite. Fazem sentido pra quem vende pra público de fora ou organiza eventos em mais de um país.",
  },
  {
    icon: "music",
    title: "Plataformas de nicho da noite",
    text: "Focadas numa cena, como o Shotgun na música eletrônica. Ajudam quando o público já está dentro daquela comunidade.",
  },
  {
    icon: "layers",
    title: "Plataformas de festa com operação da casa",
    text: "Juntam venda de ingressos, portaria, promoters e a operação do bar numa conta só. É onde a Nokta se encaixa.",
  },
];

const CRITERIOS: { icon: IconName; title: string; text: string }[] = [
  { icon: "percent", title: "Como a taxa aparece", text: "Veja se a taxa é mostrada pro comprador antes de pagar e se você pode ajustar por evento." },
  { icon: "credit-card", title: "Formas de pagamento", text: "Pix e cartão parcelado pesam muito na conversão de festa no Brasil." },
  { icon: "wallet", title: "Repasse e saldo", text: "Entenda quando o dinheiro fica disponível e se dá pra ver o saldo de cada evento separado." },
  { icon: "qr", title: "Portaria", text: "Check-in no celular, entrega do QR e o que acontece quando a internet do local oscila." },
  { icon: "megaphone", title: "Venda por indicação", text: "Promoters com link próprio, comissão e lista VIP sem planilha." },
  { icon: "store", title: "Operação do bar", text: "Se você tem casa, veja se o bar pode ficar na mesma conta dos ingressos." },
];

const FAQ = [
  {
    q: "Qual a melhor alternativa ao Sympla para festas?",
    a: "Depende do seu evento. Para festa, balada e casa noturna, vale olhar plataformas com promoters, lista VIP, check-in no celular e revenda oficial. A Nokta reúne esses recursos e ainda coloca o bar na mesma conta.",
  },
  {
    q: "Por que produtores procuram alternativas ao Sympla?",
    a: "Os motivos variam: buscar recursos específicos de festa, juntar ingressos e bar num painel só ou testar outra forma de cobrança. Compare com calma e confira as condições atuais no site de cada plataforma.",
  },
  {
    q: "A Nokta cobra mensalidade?",
    a: "Não. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você configura por evento.",
  },
  {
    q: "Posso testar uma alternativa sem largar a plataforma atual?",
    a: "Pode. Comece com um evento na nova plataforma e compare a experiência de venda, portaria e repasse antes de migrar tudo.",
  },
  {
    q: "O que perguntar antes de trocar de plataforma de ingressos?",
    a: "Como a taxa aparece pro comprador, quais formas de pagamento são aceitas, quando o dinheiro fica disponível, como funciona a portaria e se há revenda oficial.",
  },
];

export default function AlternativasSymplaPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLICADO })} />
      <ContentHero
        crumbs={crumbsFor("Alternativas ao Sympla", PATH)}
        title="Alternativas ao Sympla para festas"
        lede="Existem bons caminhos além do Sympla pra vender ingresso de festa. Eles se dividem em quatro tipos de plataforma, e o melhor depende do seu evento."
        updated={PUBLICADO}
      />

      <ContentSection id="resumo" title="Resumo rápido">
        <Prose>
          <p>
            O Sympla é uma plataforma brasileira muito conhecida e funciona bem pra muitos formatos de evento. Quem produz festa, balada ou evento de casa noturna costuma precisar de recursos próprios da noite: promoters, lista VIP, portaria rápida e, muitas vezes, o bar.
          </p>
          <p>
            Se o seu evento é variado e o público já conhece a marca, uma plataforma generalista atende. Se você faz festa e quer ingressos e bar no mesmo painel, a Nokta tende a servir melhor.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tipos" title="Os quatro tipos de alternativa" wide>
        <FeatureGrid items={TIPOS} columns={2} />
        <Prose className="mt-6 max-w-3xl">
          <p>
            Para ver cada uma em detalhe, leia <Link href="/comparativos/nokta-vs-sympla">Nokta vs Sympla</Link>, <Link href="/comparativos/nokta-vs-ingresse">Nokta vs Ingresse</Link>, <Link href="/comparativos/nokta-vs-eventbrite">Nokta vs Eventbrite</Link> e <Link href="/comparativos/nokta-vs-shotgun">Nokta vs Shotgun</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="criterios" title="O que comparar antes de trocar" wide>
        <Prose className="mb-6 max-w-3xl">
          <p>
            Preço importa, mas não é o único ponto. Uma portaria que trava ou um promoter que não sabe quanto vendeu custam caro numa noite cheia. Use esta lista pra comparar qualquer plataforma, inclusive a Nokta.
          </p>
        </Prose>
        <FeatureGrid items={CRITERIOS} />
      </ContentSection>

      <ContentSection id="tabela" title="Como a Nokta responde a esses critérios" wide>
        <ResponsiveComparison
          columns={["Nokta", "Pergunte às outras"]}
          caption="Critérios de escolha de plataforma de ingressos e como a Nokta atende cada um"
          rows={[
            { label: "Taxa", cells: ["Mostrada ao comprador no checkout (padrão 10%, configurável por evento)", "A taxa aparece antes do pagamento? Dá pra ajustar por evento?"] },
            { label: "Mensalidade", cells: ["Sem mensalidade", "Existe plano mensal ou custo fixo?"] },
            { label: "Pagamento", cells: ["Pix e cartão em até 12x, com 3DS", "Aceita Pix? Parcela no cartão?"] },
            { label: "Saldo", cells: ["Separado por evento: liberado, em custódia e em saque", "Quando o dinheiro fica disponível?"] },
            { label: "Portaria", cells: ["QR pelo WhatsApp e check-in no celular, pensado pra internet instável", "Como o QR chega? E se a internet cair?"] },
            { label: "Revenda", cells: ["Revenda oficial, com QR suspenso enquanto anunciado", "Tem revenda oficial?"] },
            { label: "Promoters e lista VIP", cells: ["Link e código por promoter, comissão e lista VIP com link", "Promoter tem link próprio e comissão?"] },
            { label: "Bar e restaurante", cells: ["Cardápio digital, comandas, reservas, estoque e financeiro na mesma conta", "O bar pode ficar na mesma conta?"] },
          ]}
          note={NOTA_COMPARATIVO}
        />
      </ContentSection>

      <ContentSection id="por-que-nokta" title="Por que considerar a Nokta">
        <Prose>
          <p>
            A Nokta nasceu pra festa. A venda tem lotes com virada, Pix e cartão em até 12x. O ingresso chega no WhatsApp e a portaria lê o QR com o celular. Cada promoter tem link e código, a lista VIP sai de um link e quem compra entra no seu CRM, pronto pra campanha por e-mail ou WhatsApp.
          </p>
          <p>
            O diferencial central é a conta única. Se você tem casa noturna, bar ou restaurante, liga o módulo de operação ao lado dos ingressos: <Link href="/solucoes/cardapio-digital">cardápio digital</Link>, comandas, reservas, estoque e caixa. Veja também <Link href="/solucoes/vender-ingressos-online">vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="quando-ficar" title="Quando continuar no Sympla pode fazer mais sentido">
        <Prose>
          <ul>
            <li>os seus eventos são cursos, palestras ou congressos, e não festas;</li>
            <li>o seu público confia na marca e compra por lá com facilidade;</li>
            <li>a sua operação está redonda e a troca não traria ganho claro agora.</li>
          </ul>
        </Prose>
      </ContentSection>

      <ContentSection id="migrar" title="Como migrar pra Nokta">
        <Prose>
          <ol>
            <li>
              <strong>Crie a conta</strong> de produtor, grátis e sem mensalidade.
            </li>
            <li>
              <strong>Cadastre um evento</strong> com arte, data, local e lotes.
            </li>
            <li>
              <strong>Configure o recebimento</strong> com a conta bancária pro saque.
            </li>
            <li>
              <strong>Divulgue o link</strong> com promoters, lista VIP e cupons.
            </li>
          </ol>
          <p>
            Passo a passo em <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />

      <RelatedLinks currentPath={PATH} paths={["/comparativos/nokta-vs-sympla", "/comparativos/nokta-vs-shotgun", "/solucoes/vender-ingressos-online", "/guias/como-vender-ingressos-online"]} />
      <CtaBand title="Teste a Nokta na próxima festa" text="Crie a conta, cadastre o evento e compartilhe o link. Sem mensalidade." />
    </>
  );
}
