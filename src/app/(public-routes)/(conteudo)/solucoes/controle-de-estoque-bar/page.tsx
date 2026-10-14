import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/controle-de-estoque-bar";
const TITLE = "Controle de estoque para bar com ficha técnica";
const DESCRIPTION = "Controle de estoque para bar: baixa pela ficha técnica a cada venda, alerta de mínimo, compras com custo médio, inventário e transferências.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["controle de estoque para bar", "estoque de bar", "ficha técnica de drinks", "controle de estoque restaurante", "inventário de bar", "custo médio"],
});

const FAQ = [
  { q: "Como fazer controle de estoque de bar?", a: "Cadastre os insumos com unidade e estoque mínimo, ligue cada produto do cardápio à sua ficha técnica e registre as compras quando chegam. Com isso, cada venda dá baixa sozinha e a contagem periódica mostra as diferenças." },
  { q: "O estoque baixa sozinho quando vendo um drink?", a: "Baixa. Quando o produto tem ficha técnica, cada venda gera uma movimentação de consumo com as quantidades de cada insumo. Se a venda é cancelada, o estoque é estornado." },
  { q: "O que é ficha técnica no bar?", a: "É a receita de cada produto em quantidades exatas, como 50 ml de gin, 150 ml de tônica e uma rodela de limão. Ela permite calcular custo, padronizar o preparo e dar baixa certa no estoque." },
  { q: "O sistema avisa quando um item está acabando?", a: "Avisa. Cada item tem uma quantidade mínima, e o que fica abaixo dela aparece como estoque baixo no painel, antes de faltar no meio da noite." },
  { q: "Como o sistema calcula o custo dos insumos?", a: "Pelo custo médio. Quando uma compra é recebida, os itens entram no estoque e o custo médio de cada um é recalculado. O painel mostra também o valor parado em estoque." },
  { q: "Tenho duas casas. Dá pra transferir estoque entre elas?", a: "Dá. As transferências entre unidades têm envio e recebimento, e o saldo de cada unidade é atualizado nas duas pontas." },
];

export default function ControleDeEstoqueBarPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: controle de estoque para bar", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Controle de estoque", path: PATH },
        ]}
        title="Controle de estoque para bar"
        lede="Cada drink vendido desconta os insumos da ficha técnica. O painel avisa o que está abaixo do mínimo, mostra o custo médio e o valor parado, e a contagem de inventário ajusta as diferenças."
        updated="2026-10-14"
      />

      <ContentSection id="por-que" title="Por que o estoque do bar some">
        <Prose>
          <p>
            Bar perde dinheiro no estoque de formas que não aparecem no caixa. A dose sai mais generosa que o combinado. A garrafa quebra e ninguém anota. A compra chega com menos caixas que a nota. E a cerveja mais pedida acaba às onze da noite de sábado porque ninguém viu que estava no fim.
          </p>
          <p>
            Controlar estoque é comparar o que deveria ter com o que tem de fato. Pra isso você precisa de três números: o que entrou (compras), o que saiu (vendas, perdas, transferências) e o que está na prateleira (contagem). Um controle de estoque para bar junta os três sem planilha.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que vem no controle de estoque da Nokta" wide>
        <FeatureGrid
          items={[
            { icon: "clipboard-list", title: "Ficha técnica", text: "Ligue cada variação do cardápio aos insumos e quantidades. Adicionais também podem consumir estoque." },
            { icon: "refresh", title: "Baixa automática", text: "Cada venda gera o consumo dos insumos. Venda cancelada volta pro estoque." },
            { icon: "bell", title: "Alerta de mínimo", text: "Defina a quantidade mínima de cada item. Abaixo dela, o painel marca como estoque baixo." },
            { icon: "cart", title: "Compras e fornecedores", text: "Registre a compra, receba e veja os itens entrarem no estoque com o custo médio recalculado." },
            { icon: "clipboard-check", title: "Inventário", text: "Conte o estoque físico e deixe o sistema ajustar as diferenças com movimentação registrada." },
            { icon: "truck", title: "Transferência entre unidades", text: "Envio e recebimento entre casas, com o saldo atualizado nas duas pontas." },
          ]}
        />
      </ContentSection>

      <ContentSection id="ficha-tecnica" title="Ficha técnica: o coração do estoque do bar">
        <Prose>
          <p>
            A ficha técnica diz quanto de cada insumo vai em cada produto. Um gin tônica, por exemplo, pode levar 50 ml de gin, 150 ml de tônica e uma rodela de limão. Com a ficha cadastrada, a Nokta sabe que cada gin tônica vendido tira essas quantidades do estoque.
          </p>
          <p>Na prática, isso traz três ganhos:</p>
          <ul>
            <li>
              <strong>Custo real do drink.</strong> Com o custo médio de cada insumo, você sabe quanto custa cada dose e se o preço do cardápio cobre.
            </li>
            <li>
              <strong>Padrão de preparo.</strong> Todo bartender serve a mesma receita, e a diferença entre o esperado e o contado vira um número, não uma desconfiança.
            </li>
            <li>
              <strong>Baixa certa.</strong> O estoque desconta o que foi vendido sem ninguém lançar nada à mão.
            </li>
          </ul>
          <p>
            Produtos simples, como uma long neck, ligam direto a um item do estoque. Adicionais, como uma dose extra, também podem ter consumo próprio.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="rotina" title="Rotina de estoque que funciona">
        <Prose>
          <ol>
            <li>
              <strong>Cadastre os itens.</strong> Organize em categorias como Bebidas, Insumos e Descartáveis. Escolha a unidade-base de cada um, como ml, grama ou unidade, e a quantidade mínima.
            </li>
            <li>
              <strong>Ligue o cardápio.</strong> Para cada produto do <Link href="/solucoes/cardapio-digital">cardápio</Link>, cadastre a ficha técnica ou o item direto.
            </li>
            <li>
              <strong>Registre as compras.</strong> A compra começa como rascunho e, quando a mercadoria chega e é conferida, você marca como recebida. Só então os itens entram no estoque.
            </li>
            <li>
              <strong>Lance as perdas.</strong> Quebra, vencimento e desperdício entram como perda, com o motivo anotado.
            </li>
            <li>
              <strong>Conte com frequência.</strong> Um inventário semanal dos itens mais caros e mensal do resto já mostra onde está a diferença.
            </li>
          </ol>
        </Prose>
      </ContentSection>

      <ContentSection id="numeros" title="Os números que o painel mostra">
        <Prose>
          <p>
            Cada item mostra o saldo atual, o mínimo, o custo médio por unidade e o valor parado em estoque. A visão geral aponta o que está abaixo do mínimo, e o histórico de movimentações mostra cada entrada e saída: compra recebida, consumo por venda, estorno, ajuste de inventário, transferência e lançamento manual.
          </p>
          <p>
            Com o valor parado à vista, fica fácil ver dinheiro preso em garrafa que gira pouco. No <strong>financeiro</strong>, as compras se juntam às contas a pagar e à conciliação.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="integrado" title="Estoque ligado à operação">
        <Prose>
          <p>
            O estoque da Nokta não é um sistema à parte. Ele usa os mesmos produtos que o garçom lança na comanda do <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>. A venda acontece na comanda, a baixa acontece no estoque, e você não precisa exportar nada de um lado pro outro.
          </p>
          <p>
            Quem faz festa com ingresso e bar no mesmo evento usa a mesma conta pra <Link href="/solucoes/vender-ingressos-online">vender ingressos</Link>, com o dinheiro de cada parte separado.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/sistema-para-bar", "/solucoes/cardapio-digital", "/guias/como-criar-cardapio-digital", "/comparativos/nokta-vs-consumer"]} />
      <CtaBand title="Pare de perder estoque" text="Cadastre os insumos, ligue a ficha técnica e deixe cada venda dar baixa sozinha. Sem mensalidade pra começar." />
    </>
  );
}
