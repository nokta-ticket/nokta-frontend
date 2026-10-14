import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/meia-entrada";
const TITLE = "Meia-entrada: quem tem direito, cota de 40% e documentos";
const DESCRIPTION = "Meia-entrada em eventos: quem tem direito pela Lei 12.933/2013, a cota de 40% dos ingressos, documentos aceitos e o desconto da pessoa idosa.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["meia-entrada", "lei da meia-entrada", "quem tem direito a meia-entrada", "cota de meia-entrada", "Lei 12.933", "Decreto 8.537", "ID Jovem meia-entrada"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Quem tem direito a meia-entrada?", a: "Pela Lei 12.933/2013, estudantes, pessoas com deficiência e o acompanhante quando necessário, e jovens de 15 a 29 anos de baixa renda com ID Jovem. A pessoa idosa, a partir de 60 anos, tem desconto de pelo menos 50% pelo Estatuto da Pessoa Idosa." },
  { q: "Qual é a cota de meia-entrada?", a: "A Lei 12.933/2013 assegura a meia-entrada em 40% do total de ingressos disponíveis pra cada evento. Esse é o mínimo que o produtor precisa oferecer aos beneficiários dessa lei." },
  { q: "A meia-entrada é metade de qual preço?", a: "A lei fala em metade do preço do ingresso efetivamente cobrado do público em geral. Em evento com lotes, a meia acompanha o preço do lote que está à venda." },
  { q: "Quais documentos o estudante precisa apresentar?", a: "A Carteira de Identificação Estudantil (CIE), no modelo nacional, emitida por entidades como ANPG, UNE, UBES, entidades estaduais e municipais e DCEs. Ela vale até 31 de março do ano seguinte ao da emissão." },
  { q: "O produtor pode pedir o documento na entrada?", a: "Pode. A lei prevê a apresentação do documento na compra e também na portaria ou na entrada do evento." },
  { q: "Festa e balada são obrigadas a ter meia-entrada?", a: "A lei cobre espetáculos musicais e eventos de lazer e entretenimento, o que inclui a maioria das festas com ingresso. Se tiver dúvida sobre o seu formato, consulte assessoria jurídica." },
  { q: "Idoso entra na cota de 40%?", a: "A cota de 40% está na Lei 12.933, que não trata da pessoa idosa. O desconto do idoso vem do Estatuto da Pessoa Idosa, que não prevê cota. Antes de limitar esse desconto, consulte assessoria jurídica." },
];

export default function MeiaEntradaPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Meia-entrada", path: PATH },
        ]}
        title="Meia-entrada: o guia pra produtores"
        lede="A meia-entrada é garantida por lei a estudantes, pessoas com deficiência e jovens de baixa renda, com cota mínima de 40% dos ingressos de cada evento. A pessoa idosa tem desconto próprio, por outra lei. Veja quem tem direito, quais documentos valem e como planejar o preço."
        updated="2026-10-14"
      />

      <ContentSection id="aviso" className="pb-0 lg:pb-0">
        <Prose>
          <p className="rounded-card border border-border bg-surface p-5 text-body shadow-card">
            Este guia resume a <strong>Lei 12.933/2013</strong>, o <strong>Decreto 8.537/2015</strong> e o <strong>Estatuto da Pessoa Idosa</strong> (Lei 10.741/2003) como estavam em outubro de 2026. Leis e regulamentos mudam, e estados e municípios podem ter regras próprias. Confira o texto atualizado no portal da legislação federal e, em caso de dúvida, fale com uma assessoria jurídica. Este conteúdo é informativo e não substitui orientação jurídica.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="quem-tem-direito" title="Quem tem direito à meia-entrada">
        <Prose>
          <p>A Lei 12.933/2013, regulamentada pelo Decreto 8.537/2015, garante meia-entrada a três grupos:</p>
          <ul>
            <li>
              <strong>Estudantes</strong> matriculados na educação básica ou superior, com a carteira estudantil válida.
            </li>
            <li>
              <strong>Pessoas com deficiência</strong>, e também o <strong>acompanhante</strong>, quando necessário.
            </li>
            <li>
              <strong>Jovens de 15 a 29 anos de baixa renda</strong>, inscritos no Cadastro Único (CadÚnico) do governo federal, com renda familiar mensal de até dois salários mínimos.
            </li>
          </ul>
          <p>
            A <strong>pessoa idosa</strong>, a partir de 60 anos, tem direito a desconto de pelo menos 50% em eventos artísticos, culturais, esportivos e de lazer, além de acesso preferencial. Esse direito vem do Estatuto da Pessoa Idosa (art. 23 da Lei 10.741/2003), não da Lei 12.933.
          </p>
          <p>
            Alguns estados e municípios têm leis que estendem o benefício a outros grupos, como professores da rede pública em alguns lugares. Confira as regras do lugar onde o evento acontece.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="documentos" title="Documentos aceitos">
        <FeatureGrid
          columns={2}
          items={[
            { icon: "graduation-cap", title: "Estudantes", text: "Carteira de Identificação Estudantil (CIE) no modelo nacional, emitida por ANPG, UNE, UBES, entidades estaduais e municipais filiadas, DCEs ou centros acadêmicos. Vale até 31 de março do ano seguinte." },
            { icon: "id-card", title: "Jovens de baixa renda", text: "Identidade Jovem (ID Jovem), emitida pelo governo federal pra quem está no CadÚnico e cumpre os critérios de idade e renda, junto com documento com foto." },
            { icon: "user-shield", title: "Pessoas com deficiência", text: "O decreto prevê o cartão do Benefício de Prestação Continuada (BPC) ou documento do INSS que ateste a aposentadoria da pessoa com deficiência. Confira se normas mais recentes ampliaram essa lista." },
            { icon: "users", title: "Pessoa idosa", text: "Documento de identidade oficial com foto que comprove 60 anos ou mais." },
          ]}
        />
        <Prose className="mt-6">
          <p>
            A lei prevê que o documento seja apresentado na compra e também na portaria ou na entrada do evento. Na venda online, isso significa que o produtor pode conferir o documento na porta. Defina antes, na política do evento, o que acontece quando a pessoa não apresentar o documento, e confirme com assessoria jurídica se a regra está de acordo com a lei e com o Código de Defesa do Consumidor.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="cota" title="A cota de 40% dos ingressos">
        <Prose>
          <p>
            A Lei 12.933 assegura o benefício em <strong>40% do total de ingressos disponíveis</strong> pra cada evento. Na prática, o produtor precisa reservar pelo menos essa parte dos ingressos para os beneficiários da lei (estudantes, pessoas com deficiência e jovens de baixa renda). Quando a cota é atingida, a obrigação de vender meia a esses públicos está cumprida.
          </p>
          <p>
            Exemplo: num evento com 1.000 ingressos à venda, pelo menos 400 precisam estar disponíveis como meia pra esses grupos.
          </p>
          <p>
            O decreto também traz regras de transparência, como informar ao público quantos ingressos de meia estão disponíveis. Deixe a quantidade e as condições claras na página do evento.
          </p>
          <p>
            A cota não se aplica de forma automática à pessoa idosa. O Estatuto não prevê limite pro desconto do idoso, e a Lei 12.933 não trata desse público. Antes de limitar o desconto do idoso aos 40%, consulte assessoria jurídica.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="eventos" title="Em quais eventos a meia-entrada vale">
        <Prose>
          <p>
            A lei fala em espetáculos artístico-culturais e esportivos, incluindo salas de cinema, cineclubes, teatros, espetáculos musicais e circenses e eventos educativos, esportivos, de lazer e de entretenimento, em estabelecimentos públicos ou privados.
          </p>
          <p>
            Isso cobre a maioria das festas, shows e baladas com venda de ingresso. Se o seu formato for diferente, como um evento corporativo fechado ou um curso, confirme com assessoria jurídica.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="preco" title="Como planejar o preço com meia-entrada">
        <Prose>
          <p>
            A meia é metade do preço cobrado do público em geral. Se o ingresso inteiro custa R$ 60, a meia custa R$ 30. Em eventos com lotes, a meia acompanha o lote em vigor.
          </p>
          <p>
            Isso afeta o seu ponto de equilíbrio. Se 40% do público comprar meia, o ticket médio de um ingresso de R$ 60 cai pra R$ 48. O guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> mostra a conta completa com esse cenário.
          </p>
          <p>
            Não suba o preço da inteira só pra compensar a meia sem olhar o mercado. Compare com festas parecidas na sua cidade e reveja custos antes.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="na-nokta" title="Meia-entrada na Nokta">
        <Prose>
          <p>
            Na Nokta, a meia-entrada é um tipo de ingresso próprio. Você cria os ingressos de meia dentro de cada lote, com a quantidade que cumpre a cota, e escreve a política de meia do evento no campo de detalhes: quem tem direito, quais documentos a portaria vai pedir e o que acontece se a pessoa não apresentar.
          </p>
          <p>
            A conferência do documento acontece na entrada. Combine isso com a equipe do <Link href="/solucoes/check-in-de-eventos">check-in</Link> antes de abrir a porta. Pra montar o resto da venda, veja <Link href="/solucoes/vender-ingressos-online">vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-calcular-preco-do-ingresso", "/guias/como-vender-ingressos-online", "/solucoes/check-in-de-eventos", "/solucoes/vender-ingressos-online"]} />
      <CtaBand title="Venda inteira e meia no mesmo evento" text="Crie os tipos de ingresso, escreva a política de meia e publique. Sem mensalidade." />
    </>
  );
}
