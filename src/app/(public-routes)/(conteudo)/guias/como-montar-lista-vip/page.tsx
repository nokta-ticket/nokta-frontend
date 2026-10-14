import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-montar-lista-vip";
const TITLE = "Como montar uma lista VIP para festa";
const DESCRIPTION = "Como montar uma lista VIP para festa: quantos nomes liberar, horário limite, regras de entrada, divulgação e portaria sem fila nem nome falso.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como montar lista VIP", "lista VIP para festa", "lista de nomes para festa", "como fazer lista VIP", "nome na lista"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Como fazer uma lista VIP para festa?", a: "Defina quantos VIPs vai liberar, até que horas eles valem e quais as regras de entrada. Crie a lista numa plataforma que gere um link de inscrição e um QR por pessoa, divulgue nos stories e combine com a portaria como validar." },
  { q: "Quantos nomes colocar na lista VIP?", a: "Depende da capacidade, do preço do ingresso e do quanto o bar fatura por pessoa. Um ponto de partida é liberar uma parte pequena da capacidade e ajustar pelo histórico de quantos inscritos aparecem de fato." },
  { q: "Até que horas a lista VIP deve valer?", a: "O horário em que a casa costuma começar a encher. O objetivo é antecipar a chegada, então o VIP vale até um pouco antes do pico." },
  { q: "Lista VIP dá prejuízo?", a: "Pode dar, se ocupar lugar de quem pagaria ingresso. Por isso a lista deve ter quantidade limitada e horário limite, e o produtor deve conferir se o consumo no bar compensa a entrada grátis." },
  { q: "Como evitar nome falso na lista?", a: "Peça inscrição com conta e documento, e entregue um QR por pessoa. Na Nokta, cada VIP é retirado com a conta e o CPF de quem vai entrar." },
  { q: "Qual a diferença entre lista VIP e cortesia?", a: "A lista VIP é aberta: qualquer pessoa com o link retira enquanto houver vaga. A cortesia é nominal, enviada pelo produtor pra pessoas escolhidas, como artistas e parceiros." },
];

export default function ComoMontarListaVipPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Como montar lista VIP", path: PATH },
        ]}
        title="Como montar uma lista VIP"
        lede="Uma boa lista VIP tem três coisas: quantidade limitada, horário limite e uma forma de conferir cada pessoa na porta sem procurar nome em folha. Veja como definir cada uma e divulgar sem perder o controle."
        updated="2026-10-14"
      />

      <ContentSection id="objetivo" title="Defina pra que serve a sua lista VIP">
        <Prose>
          <p>A lista VIP é uma ferramenta, não um costume. Antes de montar, decida o objetivo:</p>
          <ul>
            <li>
              <strong>Encher a casa cedo.</strong> Entrada grátis até um horário pra antecipar a chegada e aquecer o bar.
            </li>
            <li>
              <strong>Lançar uma festa nova.</strong> Criar público pra primeira edição e gerar fotos de casa cheia.
            </li>
            <li>
              <strong>Agradar um grupo.</strong> Aniversariantes, turma de uma faculdade, parceiros de uma marca.
            </li>
          </ul>
          <p>O objetivo define quantos nomes liberar, até que horas e onde divulgar.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="quantidade" title="Quantos nomes liberar">
        <Prose>
          <p>
            A lista VIP compete com o ingresso pago. Cada VIP que entra ocupa um lugar que poderia ser vendido. Por isso, a quantidade precisa caber na conta do evento.
          </p>
          <p>Três perguntas ajudam:</p>
          <ol>
            <li>
              <strong>Qual a capacidade e quanto você espera vender?</strong> Se a festa costuma lotar com venda, a lista precisa ser pequena. Se sobra espaço, ela pode ser maior.
            </li>
            <li>
              <strong>Quanto o bar fatura por pessoa?</strong> Se o consumo médio cobre o custo de quem entra grátis, o VIP se paga.
            </li>
            <li>
              <strong>Quantos inscritos aparecem de fato?</strong> Nem todo mundo que pega o VIP vai. Use o histórico das últimas festas pra calibrar.
            </li>
          </ol>
          <p>
            Comece pequeno. É mais fácil abrir uma segunda lista se a primeira esgotar rápido do que explicar pra fila que a casa lotou. O guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> ajuda a ver quanto espaço sobra depois do ponto de equilíbrio.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="horario" title="Horário limite e regras de entrada">
        <Prose>
          <p>
            O horário limite é o que faz a lista VIP funcionar. Escolha um pouco antes do momento em que a casa costuma encher. Divulgue esse horário em todo post: &ldquo;VIP até 23h&rdquo;.
          </p>
          <p>Escreva as regras e deixe claras na divulgação:</p>
          <ul>
            <li>até quando o VIP pode ser retirado e até que horas ele vale na porta;</li>
            <li>se a entrada exige documento com foto;</li>
            <li>a classificação etária do evento;</li>
            <li>o que acontece se a pessoa chegar depois do horário (paga o lote vigente, por exemplo).</li>
          </ul>
          <p>
            Regra clara evita discussão na porta. A equipe aplica o que está escrito, e ninguém precisa decidir na hora.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="passo-a-passo" title="Passo a passo na Nokta" wide>
        <FeatureGrid
          items={[
            { icon: "plus-circle", title: "1. Crie a lista", text: "No evento, crie uma lista VIP com um nome como “VIP até 23h” e a quantidade de VIPs." },
            { icon: "clock", title: "2. Defina o prazo", text: "Escolha data e hora, no horário de Brasília, até quando o VIP pode ser retirado." },
            { icon: "link", title: "3. Copie o link", text: "A lista ganha um link separado da página de venda. Copie no painel." },
            { icon: "instagram", title: "4. Divulgue", text: "Cole nos stories, na bio, no grupo. Só quem tem o link vê a lista." },
            { icon: "id-card", title: "5. Inscrição com conta", text: "Quem retira entra na conta, informa o CPF se precisar e recebe um ingresso gratuito com QR." },
            { icon: "qr", title: "6. Valide na porta", text: "A portaria lê o QR do VIP no check-in pelo celular, como qualquer ingresso." },
          ]}
        />
        <Prose className="mt-6 max-w-3xl">
          <p>
            Você pode criar mais de uma lista no mesmo evento e pausar cada uma quando quiser. Quando a quantidade acaba, a lista aparece como esgotada. Quando o prazo passa, ela aparece como encerrada, e quem já retirou entra normalmente. Veja todos os detalhes em <Link href="/solucoes/lista-vip">lista VIP para festas</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="divulgar" title="Como divulgar a lista VIP">
        <Prose>
          <p>
            Divulgue a lista onde está o público que você quer antecipar: stories da festa, stories dos DJs, grupos de WhatsApp. Como o link não aparece na página de venda, você controla quem fica sabendo.
          </p>
          <p>
            Use a escassez a seu favor. &ldquo;Últimos 50 VIPs&rdquo; e &ldquo;lista fecha às 18h&rdquo; aceleram a inscrição. Quando esgotar, avise e aponte pro lote pago: parte de quem perdeu o VIP acaba comprando o ingresso. Pra montar o resto do calendário de posts, veja <Link href="/guias/como-divulgar-uma-festa">como divulgar uma festa</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="portaria" title="Na portaria: sem folha, sem fila">
        <Prose>
          <p>
            O ponto fraco da lista de nomes tradicional é a porta. Procurar nome numa folha trava a fila, e nome repetido ou inventado passa. Com um QR por pessoa, a equipe lê o código no celular e vê na hora se é válido.
          </p>
          <p>
            Avise a equipe do horário limite e combine o que fazer com quem chegar depois. Se possível, separe uma fila pra quem já tem ingresso ou VIP e outra pra quem vai comprar. Como funciona o <Link href="/solucoes/check-in-de-eventos">check-in de eventos</Link> com QR.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="depois" title="Depois da festa">
        <Prose>
          <p>
            Compare quantos VIPs foram retirados com quantos entraram. Essa taxa de comparecimento é o número mais útil pra calibrar a próxima lista. E cada pessoa que retirou um VIP passa a fazer parte da sua base, pronta pra receber o anúncio da próxima edição.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/lista-vip", "/guias/como-divulgar-uma-festa", "/solucoes/check-in-de-eventos", "/guias/como-organizar-uma-festa"]} />
      <CtaBand title="Monte a sua lista VIP agora" text="Crie a lista, defina quantidade e prazo e copie o link pros stories. Sem mensalidade." />
    </>
  );
}
