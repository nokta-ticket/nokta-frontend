import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/promoters";
const TITLE = "Promoters para eventos: link, código e comissão";
const DESCRIPTION = "Gestão de promoters para eventos: link exclusivo, código de desconto e comissão em porcentagem ou valor fixo, com as vendas de cada um no painel.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["promoters para eventos", "comissão de promoter", "promoter de festa", "link de promoter", "cupom de promoter", "gestão de promoters"],
});

const FAQ = [
  { q: "Como funciona a comissão de promoter na Nokta?", a: "Você escolhe, por evento, entre uma porcentagem do valor líquido da venda ou um valor fixo por ingresso. Cada venda atribuída ao promoter gera comissão, que aparece como pendente, disponível ou acertada." },
  { q: "Qual a comissão de promoter mais comum?", a: "Não existe um valor padrão no mercado. Ela depende do preço do ingresso, da sua margem e do volume que o promoter traz. Faça a conta pelo seu ponto de equilíbrio antes de prometer qualquer porcentagem." },
  { q: "Como a Nokta sabe que a venda veio do promoter?", a: "Pelo link exclusivo dele, que leva um identificador, ou pelo código que o comprador digita no checkout. Você define uma janela de atribuição em dias pra quem clicou no link e comprou depois." },
  { q: "Posso dar desconto pra quem compra com o código do promoter?", a: "Pode. O desconto pode ser em porcentagem ou valor fixo, com limite total de usos, limite por cliente, pedido mínimo e período de validade." },
  { q: "Como eu pago o promoter?", a: "No painel você cria um acerto com as comissões disponíveis. O pagamento em si é feito por você, por Pix ou transferência, e fica registrado no acerto pra conferência dos dois lados." },
  { q: "O promoter vê as próprias vendas?", a: "Vê. Ele tem um painel de promoter com resumo, links e vendas e acertos de cada organização com que trabalha." },
  { q: "Como convido um promoter?", a: "Pelo e-mail. A pessoa recebe o convite, entra ou cria a conta com aquele e-mail e passa a aparecer como ativa na sua lista de promoters." },
];

export default function PromotersPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: gestão de promoters para eventos", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Promoters", path: PATH },
        ]}
        title="Promoters para eventos com comissão automática"
        lede="Cada promoter recebe um link exclusivo e, se você quiser, um código de desconto. A Nokta atribui as vendas, calcula a comissão e mostra os números de cada um no painel."
        updated="2026-10-14"
      />

      <ContentSection id="por-que" title="Por que organizar promoters numa plataforma">
        <Prose>
          <p>
            Promoter é o canal de venda mais antigo da noite. Quem tem uma turma grande enche a pista e merece receber por isso. O problema é medir. Quando a venda passa pelo direct do promoter, alguém precisa somar no fim da noite quantos ingressos foram de cada um, e a conta quase nunca bate.
          </p>
          <p>
            Com link e código rastreados, a venda já nasce com o nome de quem trouxe. A comissão é calculada pela regra que você definiu antes do evento, e o promoter vê os mesmos números que você. A discussão sobre quem vendeu quanto termina.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que você configura pra cada promoter" wide>
        <FeatureGrid
          items={[
            { icon: "link", title: "Link exclusivo", text: "Um link de venda com o identificador do promoter. Ele compartilha nos stories e grupos dele." },
            { icon: "tag", title: "Código próprio", text: "Um código como JOAO10 que o comprador digita no checkout. Funciona sozinho ou junto com o link." },
            { icon: "percent", title: "Desconto pra quem compra", text: "Porcentagem ou valor fixo, com limite de usos, limite por cliente, pedido mínimo e período de validade." },
            { icon: "hand-dollar", title: "Comissão do seu jeito", text: "Porcentagem do valor líquido ou valor fixo por ingresso, definida por evento." },
            { icon: "layers", title: "Lotes específicos", text: "Restrinja o vínculo a alguns lotes, se quiser que o promoter venda só pista ou só o primeiro lote." },
            { icon: "calendar", title: "Vigência e atribuição", text: "Datas de início e fim do vínculo e uma janela em dias pra contar quem clicou no link e comprou depois." },
          ]}
        />
      </ContentSection>

      <ContentSection id="comissao" title="Como definir a comissão de promoter">
        <Prose>
          <p>Antes de fechar porcentagem com alguém, responda três perguntas:</p>
          <ol>
            <li>
              <strong>Quanto sobra por ingresso depois dos custos?</strong> Se a sua margem por ingresso é pequena, uma comissão alta transforma venda em prejuízo. O guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> mostra como chegar nesse número.
            </li>
            <li>
              <strong>Porcentagem ou valor fixo?</strong> A porcentagem acompanha o preço: o promoter ganha mais no último lote, que é mais caro. O valor fixo por ingresso é mais simples de explicar e não muda com a virada de lote.
            </li>
            <li>
              <strong>O desconto sai de quem?</strong> Se o código dá desconto pro comprador e a comissão é sobre o valor líquido, o desconto reduz a base da comissão. Combine isso com o promoter antes.
            </li>
          </ol>
          <p>
            Uma prática comum é testar uma regra num evento, olhar a conversão de cada promoter e ajustar no próximo. Na Nokta, a regra é definida por evento, então dá pra mudar sem refazer o cadastro.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="numeros" title="Vendas de cada promoter no painel">
        <Prose>
          <p>A aba de vendas mostra, por promoter e por evento:</p>
          <ul>
            <li>cliques únicos no link;</li>
            <li>pedidos pagos e taxa de conversão;</li>
            <li>valor líquido vendido e quanto foi dado em desconto;</li>
            <li>comissão pendente, disponível e já acertada.</li>
          </ul>
          <p>
            Com esses números você sabe quem traz público de verdade e quem só gera clique. Na hora de pagar, cria um acerto com as comissões disponíveis, faz o Pix ou a transferência e registra o pagamento. Se precisar, cancela o acerto e as comissões voltam a ficar disponíveis.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="promoter" title="O que o promoter vê">
        <Prose>
          <p>
            O promoter tem o próprio painel na Nokta, com resumo, as organizações com que trabalha, os links e as vendas de cada evento e os acertos recebidos. Ele não precisa pedir print pra saber quanto vendeu.
          </p>
          <p>
            O convite é feito por e-mail. A pessoa aceita, entra ou cria a conta com aquele e-mail e fica ativa. Se a parceria acabar, você suspende ou remove o promoter pelo painel.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="divulgacao" title="Promoters dentro do plano de divulgação">
        <Prose>
          <p>
            Promoter funciona melhor quando o evento já tem uma página boa e uma <Link href="/solucoes/vender-ingressos-online">venda online com lotes</Link> bem definidos. O promoter leva gente até o link. Quem converte é a página, o preço e a urgência do lote. Pra montar o resto da divulgação, veja <Link href="/guias/como-divulgar-uma-festa">como divulgar uma festa</Link>.
          </p>
          <p>
            A <Link href="/solucoes/lista-vip">lista VIP</Link> é outra ferramenta: ela usa um link do evento, sem comissão. Use quando o objetivo for encher a casa cedo, não remunerar quem vende.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-divulgar-uma-festa", "/solucoes/vender-ingressos-online", "/guias/como-calcular-preco-do-ingresso", "/comparativos/nokta-vs-shotgun"]} />
      <CtaBand title="Coloque os seus promoters pra vender" text="Convide pelo e-mail, defina a comissão e acompanhe as vendas de cada um. Sem mensalidade." />
    </>
  );
}
