import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/cardapio-digital";
const TITLE = "Cardápio digital QR code para bar e restaurante";
const DESCRIPTION = "Cardápio digital com QR code: um QR por casa pras mesas e um link pra bio, com fotos, variações, adicionais e item esgotado atualizado na hora. Sem mensalidade.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["cardápio digital QR code", "cardápio digital", "cardápio QR code", "menu digital", "cardápio online para restaurante", "cardápio digital para bar"],
});

const FAQ = [
  { q: "Como funciona o cardápio digital com QR code?", a: "Você cadastra os produtos no painel e a Nokta gera um endereço público pro cardápio. O cliente aponta a câmera pro QR na mesa e abre o cardápio no navegador, sem instalar app." },
  { q: "Preciso imprimir um QR novo cada vez que mudo o cardápio?", a: "Não. O QR aponta pro endereço do cardápio, e o conteúdo atualiza na hora. Só troque o QR se mudar o endereço público, porque isso quebra os QRs já impressos." },
  { q: "Consigo marcar um item como esgotado?", a: "Sim. Um toque marca o produto como esgotado e ele aparece assim no cardápio público na hora, sem precisar esconder do cardápio." },
  { q: "O cliente consegue fazer o pedido pelo cardápio digital?", a: "Hoje o cardápio público da Nokta é de consulta. O pedido é lançado pela equipe na comanda, no painel ou na maquininha do garçom, e vai direto pra estação de preparo." },
  { q: "Posso ter cardápios diferentes, como almoço e noite?", a: "Pode. Você cria mais de um cardápio e define preço por variação em cada um. O link e o QR público são sempre do cardápio principal." },
  { q: "Quanto custa o cardápio digital da Nokta?", a: "Não tem mensalidade pra começar. Você cria a conta, monta o cardápio e baixa o QR sem custo fixo." },
];

export default function CardapioDigitalPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: cardápio digital com QR code", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Cardápio digital", path: PATH },
        ]}
        title="Cardápio digital com QR code"
        lede="Um QR só pras mesas e um link pra bio do Instagram. O cliente vê fotos, preços e o que acabou, e você muda o cardápio no painel sem reimprimir nada."
        updated="2026-10-14"
      />

      <ContentSection id="o-que-e" title="O que é um cardápio digital com QR code">
        <Prose>
          <p>
            É o cardápio da casa publicado numa página na internet. Cada mesa tem um QR impresso que leva até essa página. O cliente aponta a câmera do celular e o cardápio abre no navegador, sem baixar aplicativo.
          </p>
          <p>
            A vantagem pra quem opera é o controle. Preço muda, prato novo entra, cerveja acaba no meio da noite: você ajusta no painel e o cardápio público reflete na hora. Acabou a folha plastificada com preço riscado à caneta.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que vem no cardápio digital da Nokta" wide>
        <FeatureGrid
          items={[
            { icon: "qr", title: "Um QR por casa", text: "Baixe o cartaz com o QR, o nome da casa e a instrução de uso, pronto pra imprimir e colocar nas mesas." },
            { icon: "link", title: "Link pra bio", text: "O mesmo cardápio num endereço público que você escolhe, pra colocar no Instagram e no Google." },
            { icon: "ban", title: "Esgotado na hora", text: "Marque o item como esgotado e ele aparece assim pro cliente, sem sumir do cardápio." },
            { icon: "image", title: "Fotos dos produtos", text: "Foto em cada item, logo e banner da casa no topo do cardápio." },
            { icon: "layers", title: "Variações e adicionais", text: "Tamanhos e versões com preço próprio, e grupos de adicionais como bacon, cheddar ou sem cebola." },
            { icon: "utensils", title: "Vários cardápios", text: "Almoço, noite, evento: crie cardápios diferentes com preço por variação em cada um." },
          ]}
        />
      </ContentSection>

      <ContentSection id="mesmo-cadastro" title="O cardápio é o cadastro da operação">
        <Prose>
          <p>
            Na Nokta, o cardápio digital não é uma página solta. Os mesmos produtos que o cliente vê no QR são os que o garçom lança na comanda, os que vão pra estação de preparo e os que dão baixa no estoque.
          </p>
          <ul>
            <li>
              <strong>Categorias</strong> como Cervejas, Drinks e Porções organizam o cardápio público e a tela do garçom.
            </li>
            <li>
              <strong>Estações de preparo</strong>, como Bar e Cozinha, recebem cada pedido no lugar certo.
            </li>
            <li>
              <strong>Ficha técnica</strong> liga cada variação aos insumos, pra o <Link href="/solucoes/controle-de-estoque-bar">controle de estoque</Link> descontar o que foi vendido.
            </li>
          </ul>
          <p>
            Você cadastra uma vez e usa em todo lugar. Quem quer só o cardápio começa por ele e liga o <Link href="/solucoes/sistema-para-bar">sistema de comandas</Link> quando fizer sentido.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="pedidos" title="E o pedido?">
        <Prose>
          <p>
            O cardápio público da Nokta é de consulta. O cliente escolhe pelo QR e chama o garçom, que lança o pedido na comanda pelo painel ou pela maquininha. O pedido cai direto na estação de preparo, sem comanda de papel indo até a cozinha.
          </p>
          <p>
            Pra muita casa, esse modelo é o que funciona: o atendimento continua na mão da equipe, e o cliente ganha um cardápio com foto e preço atualizado.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="qr-impresso" title="Um QR que continua funcionando">
        <Prose>
          <p>
            O QR da Nokta aponta pro endereço público do cardápio, não pra um arquivo. Por isso, você imprime uma vez e continua mudando preço, foto e item à vontade. O cuidado é com o endereço: escolha antes de imprimir, porque mudar o endereço quebra os QRs que já estão nas mesas.
          </p>
          <p>
            O cartaz que a Nokta gera já sai com o nome da casa, a instrução &ldquo;Aponte a câmera para ver o cardápio&rdquo; e uma margem branca em volta do código, que ajuda a leitura com pouca luz. Teste com celulares diferentes no salão, à noite, antes de imprimir em quantidade.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="como-comecar" title="Como colocar o cardápio digital no ar">
        <Prose>
          <ol>
            <li>Crie a conta e o workspace da casa.</li>
            <li>Crie o cardápio principal e as categorias. Dá pra cadastrar várias categorias e produtos de uma vez.</li>
            <li>Cadastre os produtos com foto, descrição, preço e variações. Vincule os grupos de adicionais.</li>
            <li>Defina o endereço público, o horário de funcionamento, o logo e o banner.</li>
            <li>Baixe o cartaz com o QR, imprima e coloque nas mesas. Cole o link na bio.</li>
          </ol>
          <p>
            O guia <Link href="/guias/como-criar-cardapio-digital">como criar um cardápio digital</Link> traz dicas de foto, descrição, preço e impressão do QR.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-criar-cardapio-digital", "/solucoes/sistema-para-bar", "/solucoes/controle-de-estoque-bar", "/comparativos/nokta-vs-goomer"]} />
      <CtaBand title="Monte o seu cardápio digital" text="Cadastre os produtos, baixe o QR e coloque nas mesas hoje. Sem mensalidade pra começar." />
    </>
  );
}
