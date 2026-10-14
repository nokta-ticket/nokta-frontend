import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-calcular-preco-do-ingresso";
const TITLE = "Como calcular o preço do ingresso de uma festa";
const DESCRIPTION = "Como calcular o preço do ingresso: some os custos, ache o ponto de equilíbrio, monte os lotes e veja o efeito da meia-entrada e da taxa de serviço.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como calcular preço do ingresso", "preço de ingresso", "ponto de equilíbrio evento", "lotes de ingresso", "quanto cobrar pelo ingresso", "taxa de ingresso"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Como calcular o preço de um ingresso?", a: "Some os custos fixos do evento, subtraia o custo variável por pessoa do preço pretendido e divida os custos fixos por essa margem. O resultado é quantos ingressos você precisa vender pra empatar. Se esse número for maior que a capacidade ou que o público realista, o preço ou os custos precisam mudar." },
  { q: "O que é ponto de equilíbrio de um evento?", a: "É a quantidade de ingressos em que a receita cobre todos os custos. Abaixo dela o evento dá prejuízo. Acima, cada ingresso vendido vira lucro." },
  { q: "Quantos lotes de ingresso devo ter?", a: "Pra uma festa, três ou quatro lotes costumam bastar. Mais que isso confunde o público e dilui a urgência de cada virada." },
  { q: "A meia-entrada entra no cálculo do preço?", a: "Entra. A lei garante meia a alguns públicos, com cota mínima de 40% dos ingressos. Se uma parte grande do público comprar meia, o ticket médio cai e o ponto de equilíbrio sobe." },
  { q: "A taxa de serviço entra no preço do ingresso?", a: "Na Nokta, a taxa de serviço é paga pelo comprador e aparece separada no checkout. Ela não reduz o valor do seu ingresso, mas aumenta o total que o comprador vê. Defina o preço pensando nesse total." },
  { q: "Quanto da bilheteria deve ir pra artista?", a: "Não há regra fixa. Depende do cachê, do público que o artista traz e do formato do acordo. O importante é colocar o cachê nos custos fixos antes de definir o preço." },
];

export default function ComoCalcularPrecoDoIngressoPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Preço do ingresso", path: PATH },
        ]}
        title="Como calcular o preço do ingresso"
        lede="O preço do ingresso sai de uma conta simples: custos fixos divididos pela margem de cada ingresso dão quantos ingressos você precisa vender pra não ter prejuízo. Abaixo, a conta passo a passo com um exemplo de festa, lotes, meia-entrada e taxa de serviço."
        updated="2026-10-14"
      />

      <ContentSection id="custos" title="1. Liste todos os custos">
        <Prose>
          <p>Separe os custos em dois grupos.</p>
          <p>
            <strong>Custos fixos</strong> não mudam com o número de pessoas: aluguel do local, som e luz, cachês, equipe, segurança, decoração, divulgação paga, licenças e taxas de autorização. Você paga o mesmo valor com 100 ou 500 pessoas.
          </p>
          <p>
            <strong>Custos variáveis</strong> crescem a cada pessoa que entra: pulseira, copo, brinde, limpeza extra. Some e divida por pessoa.
          </p>
          <p>
            Esqueça aqui o bar. Ele tem receita e custo próprios. Misturar o lucro esperado do bar no preço do ingresso é a forma mais comum de errar a conta.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="exemplo" title="2. Um exemplo com números">
        <Prose>
          <p>Uma festa para 500 pessoas, com estes custos fixos:</p>
          <ul>
            <li>local: R$ 5.000;</li>
            <li>som e luz: R$ 4.000;</li>
            <li>DJs: R$ 5.000;</li>
            <li>equipe e segurança: R$ 3.000;</li>
            <li>divulgação paga: R$ 1.000.</li>
          </ul>
          <p>
            Total de custos fixos: <strong>R$ 18.000</strong>. O custo variável é de <strong>R$ 5 por pessoa</strong> (pulseira, copo e limpeza).
          </p>
          <h3>Ponto de equilíbrio com preço único</h3>
          <p>Com ingresso a R$ 60, cada ingresso deixa R$ 55 depois do custo variável (R$ 60 menos R$ 5). A conta do ponto de equilíbrio é:</p>
          <p>
            <strong>R$ 18.000 ÷ R$ 55 = 327,3</strong>. Arredondando pra cima, você precisa vender <strong>328 ingressos</strong> pra empatar. Numa casa de 500 lugares, isso é cerca de 66% da capacidade.
          </p>
          <p>
            Se o ponto de equilíbrio passar de 80% da capacidade, o risco é alto. Qualquer chuva ou evento concorrente na mesma noite vira prejuízo. Aí vale rever custos ou preço.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="lotes" title="3. Monte os lotes">
        <Prose>
          <p>Agora divida os mesmos 500 ingressos em três lotes:</p>
          <ul>
            <li>
              1º lote: 150 ingressos a R$ 50 = R$ 7.500;
            </li>
            <li>
              2º lote: 200 ingressos a R$ 60 = R$ 12.000;
            </li>
            <li>
              3º lote: 150 ingressos a R$ 70 = R$ 10.500.
            </li>
          </ul>
          <p>
            Receita com tudo vendido: <strong>R$ 30.000</strong>, com ticket médio de R$ 60. Custo total: R$ 18.000 fixos mais R$ 2.500 variáveis (500 × R$ 5) = R$ 20.500. Resultado: <strong>R$ 9.500 de lucro</strong>.
          </p>
          <h3>Quando os lotes empatam</h3>
          <p>Calcule a margem acumulada lote a lote:</p>
          <ul>
            <li>1º lote: 150 × R$ 45 = R$ 6.750;</li>
            <li>2º lote: 200 × R$ 55 = R$ 11.000. Acumulado: R$ 17.750;</li>
            <li>faltam R$ 250, e cada ingresso do 3º lote deixa R$ 65. R$ 250 ÷ R$ 65 = 3,8, ou seja, 4 ingressos.</li>
          </ul>
          <p>
            O empate chega no <strong>354º ingresso</strong> (150 + 200 + 4), não no 328º. O primeiro lote é mais barato, então você precisa vender mais pra empatar. Os lotes aceleram a venda, mas empurram o ponto de equilíbrio pra frente. Considere isso antes de deixar o primeiro lote grande demais.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="meia" title="4. Considere a meia-entrada">
        <Prose>
          <p>
            A Lei 12.933/2013 garante meia-entrada a estudantes, pessoas com deficiência e jovens de baixa renda, com cota mínima de 40% dos ingressos. A meia é metade do preço cobrado do público em geral. Os detalhes estão no guia de <Link href="/guias/meia-entrada">meia-entrada</Link>.
          </p>
          <p>
            No exemplo do preço único de R$ 60, imagine o cenário em que 40% do público compra meia a R$ 30. O ticket médio cai pra <strong>R$ 48</strong> (60% × R$ 60 + 40% × R$ 30). A margem por ingresso vira R$ 43, e o ponto de equilíbrio sobe pra <strong>419 ingressos</strong> (R$ 18.000 ÷ R$ 43 = 418,6).
          </p>
          <p>
            A proporção real de meia depende do público. Use o histórico dos seus eventos anteriores, se tiver, e trabalhe com um cenário conservador.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="taxa" title="5. Some a taxa de serviço e as comissões">
        <Prose>
          <p>
            Na Nokta, a taxa de serviço é paga pelo comprador e aparece separada no checkout. O padrão é 10% e você configura por evento. Com ingresso de R$ 60 e taxa de 10%, o comprador vê R$ 6 de taxa e paga R$ 66 no total. Pra quem compra, o preço é R$ 66. Pense nisso quando comparar com outras festas da cidade.
          </p>
          <p>
            No exemplo, consideramos que os R$ 60 do ingresso chegam a você. Se a sua plataforma desconta alguma taxa do produtor, use o valor líquido no lugar do preço.
          </p>
          <p>
            Se você trabalha com <Link href="/solucoes/promoters">promoters</Link>, a comissão entra como custo variável dos ingressos que eles vendem. Uma comissão de R$ 5 por ingresso reduz a margem desses ingressos de R$ 55 pra R$ 50. Cupons de desconto funcionam do mesmo jeito: reduzem a margem do ingresso em que são usados.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="resumo" title="A conta em quatro números" wide>
        <FeatureGrid
          columns={2}
          items={[
            { icon: "receipt", title: "Custos fixos", text: "Tudo que você paga independente do público. No exemplo, R$ 18.000." },
            { icon: "users", title: "Custo variável por pessoa", text: "Pulseira, copo, limpeza, comissão. No exemplo, R$ 5." },
            { icon: "tag", title: "Preço líquido médio", text: "O que chega pra você por ingresso, já com lotes, meia e cupons. No exemplo, entre R$ 48 e R$ 60." },
            { icon: "scale", title: "Ponto de equilíbrio", text: "Custos fixos ÷ (preço líquido médio − custo variável). No exemplo, de 328 a 419 ingressos." },
          ]}
        />
      </ContentSection>

      <ContentSection id="checagem" title="6. Confira o preço contra o mercado">
        <Prose>
          <p>
            A conta mostra o mínimo. O teto vem do público. Olhe quanto festas parecidas cobram na sua cidade, no mesmo dia da semana, com atrações do mesmo porte. Se o seu preço ficou bem acima, procure onde cortar custo antes de subir o ingresso.
          </p>
          <p>
            Com o preço definido, monte os lotes na plataforma e deixe a virada automática. Veja como funciona a <Link href="/solucoes/vender-ingressos-online">venda de ingressos com lotes</Link> e o passo a passo em <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/meia-entrada", "/guias/como-vender-ingressos-online", "/solucoes/vender-ingressos-online", "/guias/como-organizar-uma-festa"]} />
      <CtaBand title="Coloque os lotes no ar" text="Crie o evento, monte os lotes com virada automática e acompanhe as vendas de cada lote no painel." />
    </>
  );
}
