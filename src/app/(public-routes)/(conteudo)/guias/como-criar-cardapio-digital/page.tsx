import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-criar-cardapio-digital";
const TITLE = "Como criar um cardápio digital com QR code";
const DESCRIPTION = "Como criar um cardápio digital com QR code: categorias, descrições, fotos, preços e variações, e como imprimir o QR das mesas do jeito certo.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como criar cardápio digital", "cardápio digital QR code", "como fazer cardápio digital", "QR code para cardápio", "cardápio online grátis"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Como fazer um cardápio digital com QR code?", a: "Cadastre categorias e produtos numa plataforma de cardápio digital, defina o endereço público, baixe o QR code e imprima pras mesas. O QR leva o cliente até o cardápio no navegador, sem instalar app." },
  { q: "Dá pra criar um cardápio digital de graça?", a: "Dá. Na Nokta não tem mensalidade pra começar: você cria a conta, monta o cardápio e baixa o QR sem custo fixo." },
  { q: "Qual o tamanho ideal do QR code na mesa?", a: "Grande o bastante pra ler de onde o cliente está sentado. Imprima e teste com celulares diferentes antes de produzir em quantidade, e mantenha uma margem branca em volta do código." },
  { q: "Preciso trocar o QR quando mudar o preço?", a: "Não. O QR aponta pro endereço do cardápio, e o conteúdo muda na hora em que você edita. Só mude o endereço público se for realmente necessário, porque isso quebra os QRs já impressos." },
  { q: "Cardápio digital precisa ter foto?", a: "Não é obrigatório, mas foto ajuda o cliente a decidir, principalmente em pratos e drinks autorais. Se não puder fotografar tudo, comece pelos itens mais vendidos e pelos de maior margem." },
  { q: "Ainda preciso de cardápio impresso?", a: "Vale ter alguns. Nem todo cliente quer usar o celular, e a lei de defesa do consumidor exige informação clara de preços. Confira as regras do seu município sobre cardápio físico." },
];

export default function ComoCriarCardapioDigitalPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Como criar cardápio digital", path: PATH },
        ]}
        title="Como criar um cardápio digital"
        lede="Pra criar um cardápio digital com QR code, você organiza as categorias, cadastra os produtos com descrição, preço e foto, define o endereço público e imprime o QR pras mesas. Veja como fazer cada etapa bem feita."
        updated="2026-10-14"
      />

      <ContentSection id="categorias" title="1. Organize as categorias">
        <Prose>
          <p>
            O cliente lê o cardápio no celular, rolando com o dedão. Categorias claras e curtas fazem ele achar o que quer sem desistir. Use os nomes que o cliente usaria: Cervejas, Drinks, Sem álcool, Porções, Pratos, Sobremesas.
          </p>
          <ul>
            <li>Coloque primeiro o que mais vende. Num bar, bebidas antes de comida.</li>
            <li>Evite categorias com um item só. Junte com outra parecida.</li>
            <li>Separe as opções sem álcool. Quem procura, procura rápido.</li>
          </ul>
        </Prose>
      </ContentSection>

      <ContentSection id="descricoes" title="2. Escreva descrições que vendem">
        <Prose>
          <p>Uma boa descrição responde o que tem no prato ou no copo, em uma ou duas linhas:</p>
          <ul>
            <li>
              <strong>Ingredientes principais</strong>, na ordem em que aparecem no sabor. &ldquo;Gin, tônica, limão-siciliano e alecrim&rdquo; diz mais que &ldquo;drink refrescante&rdquo;.
            </li>
            <li>
              <strong>Tamanho ou porção</strong>: ml da bebida, quantas pessoas a porção serve.
            </li>
            <li>
              <strong>Alergênicos e restrições</strong> importantes, como glúten, lactose e amendoim.
            </li>
          </ul>
          <p>Corte adjetivo vazio. &ldquo;Delicioso&rdquo; e &ldquo;especial&rdquo; não ajudam ninguém a escolher.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="fotos" title="3. Fotos que funcionam no celular">
        <Prose>
          <p>
            Foto vende, mas foto ruim atrapalha. Você não precisa de fotógrafo pra começar. Precisa de luz natural, fundo limpo e o produto ocupando a maior parte da imagem.
          </p>
          <ul>
            <li>Fotografe perto da janela, de dia, sem flash.</li>
            <li>Use o mesmo fundo e o mesmo ângulo pra todos os itens de uma categoria.</li>
            <li>Comece pelos itens mais vendidos e pelos de maior margem.</li>
            <li>Atualize a foto quando a apresentação mudar. Foto que não bate com o prato gera reclamação.</li>
          </ul>
        </Prose>
      </ContentSection>

      <ContentSection id="precos" title="4. Preços, variações e adicionais">
        <Prose>
          <p>
            Cadastre cada tamanho ou versão como <strong>variação</strong> do mesmo produto, com preço próprio: chope 300 ml e 500 ml, porção inteira e meia. Fica mais limpo do que um produto pra cada tamanho.
          </p>
          <p>
            Use <strong>adicionais</strong> pra personalizações: bacon, cheddar, dose extra, sem cebola. Agrupe os adicionais (por exemplo, &ldquo;Extras do burger&rdquo;) e vincule o grupo aos produtos certos.
          </p>
          <p>
            Antes de definir o preço, calcule o custo do item. A ficha técnica, com a quantidade exata de cada insumo, mostra quanto custa cada drink e ajuda a manter a margem. Veja como no <Link href="/solucoes/controle-de-estoque-bar">controle de estoque para bar</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="qr" title="5. Imprima o QR code do jeito certo">
        <Prose>
          <p>O QR é a porta do cardápio. Alguns cuidados evitam o cliente apontando o celular sem sucesso:</p>
          <ul>
            <li>
              <strong>Escolha o endereço público antes de imprimir.</strong> Mudar o endereço depois quebra os QRs já impressos.
            </li>
            <li>
              <strong>Deixe margem branca</strong> em volta do código. Sem ela, alguns leitores falham.
            </li>
            <li>
              <strong>Escreva o que fazer</strong> junto do QR, como &ldquo;Aponte a câmera para ver o cardápio&rdquo;, e o nome da casa.
            </li>
            <li>
              <strong>Proteja da umidade.</strong> Mesa de bar molha. Use acrílico ou plastificação.
            </li>
            <li>
              <strong>Teste</strong> com celulares diferentes, na luz real do salão à noite.
            </li>
          </ul>
          <p>Use o mesmo endereço como link na bio do Instagram. Quem pesquisa a casa antes de sair já vê o cardápio.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="na-nokta" title="Criando o cardápio digital na Nokta" wide>
        <FeatureGrid
          items={[
            { icon: "tags", title: "Categorias em lote", text: "Crie várias categorias e produtos de uma vez e reordene como quiser." },
            { icon: "image", title: "Foto, logo e banner", text: "Foto em cada produto e a identidade da casa no topo do cardápio." },
            { icon: "layers", title: "Variações e adicionais", text: "Tamanhos com preço próprio e grupos de adicionais vinculados aos produtos." },
            { icon: "qr", title: "Cartaz com QR", text: "Baixe o QR com o nome da casa e a instrução de uso, pronto pra imprimir." },
            { icon: "ban", title: "Esgotado na hora", text: "Acabou no meio da noite? Marque como esgotado e o cliente vê na hora." },
            { icon: "clock", title: "Horário de funcionamento", text: "Informe os horários da casa junto do cardápio." },
          ]}
        />
        <Prose className="mt-6 max-w-3xl">
          <p>
            Na Nokta, o cardápio também é o cadastro da operação: os mesmos produtos vão pra comanda do garçom, pra estação de preparo e pro estoque. Veja o <Link href="/solucoes/cardapio-digital">cardápio digital com QR code</Link> e o <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="manter" title="6. Mantenha o cardápio vivo">
        <Prose>
          <p>
            A grande vantagem do digital é atualizar sem custo. Use isso. Marque como esgotado o que acabou, em vez de deixar o garçom explicar mesa por mesa. Tire do cardápio o que não vende há meses. Teste um drink novo por algumas semanas e veja se ele entra entre os mais pedidos.
          </p>
          <p>
            Revise preços quando o custo dos insumos mudar. Com a ficha técnica e o custo médio atualizados a cada compra, você sabe quando a margem de um item caiu.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/cardapio-digital", "/solucoes/sistema-para-bar", "/solucoes/controle-de-estoque-bar", "/comparativos/nokta-vs-goomer"]} />
      <CtaBand title="Crie o seu cardápio digital hoje" text="Cadastre os produtos, baixe o QR e coloque nas mesas. Sem mensalidade pra começar." />
    </>
  );
}
