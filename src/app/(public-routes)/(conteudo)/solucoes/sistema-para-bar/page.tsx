import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/sistema-para-bar";
const TITLE = "Sistema para bar com comanda digital e caixa";
const DESCRIPTION = "Sistema para bar com comanda digital por mesa, pessoa ou balcão, pedido direto pro preparo, caixa com sangria e fechamento e estoque. Sem mensalidade.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["sistema para bar", "comanda digital", "sistema para restaurante", "comanda eletrônica", "sistema de comandas", "PDV para bar"],
});

const FAQ = [
  { q: "O que um sistema para bar precisa ter?", a: "No mínimo: cardápio cadastrado, comandas por mesa ou por pessoa, envio do pedido pro preparo, recebimento com várias formas de pagamento e fechamento de caixa. Estoque e financeiro completam a gestão." },
  { q: "Como funciona a comanda digital na Nokta?", a: "A equipe abre uma comanda de mesa, individual ou de balcão, lança os itens pelo painel ou pela maquininha e o pedido vai direto pra estação de preparo. Na hora de pagar, a comanda mostra o total e o saldo restante." },
  { q: "Dá pra dividir o pagamento da mesa?", a: "Dá. A comanda aceita vários pagamentos, em formas diferentes, até zerar o saldo restante. O troco do dinheiro é registrado junto." },
  { q: "Quais formas de pagamento o sistema registra?", a: "Dinheiro, Pix, débito, crédito, voucher e outras. Cada pagamento entra no caixa da sessão e no financeiro." },
  { q: "Funciona na maquininha?", a: "Sim. O app Nokta POS é pareado a uma maquininha ou tablet com um código de 6 dígitos, e o garçom lança pedidos por ali. Você revoga o acesso do terminal na hora pelo painel." },
  { q: "Preciso de computador no caixa?", a: "Não. O painel funciona no navegador do celular, do tablet ou do computador. Use o que a casa já tem." },
  { q: "Quanto custa o sistema para bar da Nokta?", a: "Não tem mensalidade pra começar. Você cria a conta, cadastra o cardápio e abre a primeira comanda sem custo fixo." },
];

export default function SistemaParaBarPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: sistema para bar e restaurante", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Sistema para bar", path: PATH },
        ]}
        title="Sistema para bar com comanda digital"
        lede="Comandas por mesa, por pessoa ou no balcão, pedido indo direto pro bar e pra cozinha, e um caixa que fecha batendo. Tudo no mesmo cadastro do cardápio, no celular da equipe."
        updated="2026-10-14"
      />

      <ContentSection id="dia-a-dia" title="O que muda no dia a dia do bar">
        <Prose>
          <p>
            Sem sistema, a noite do bar depende de papel e memória. O garçom anota na comanda de papel, leva até o balcão, alguém digita no caixa e, no fim, a soma não bate com a gaveta. Um item esquecido é prejuízo. Uma comanda perdida é briga com cliente.
          </p>
          <p>
            Com a comanda digital, o pedido é lançado uma vez e segue sozinho. Vai pra estação de preparo certa, entra no total da mesa, dá baixa no estoque e aparece no caixa quando o cliente paga. O dono vê a operação da noite em tempo real, de onde estiver.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que vem no sistema para bar da Nokta" wide>
        <FeatureGrid
          items={[
            { icon: "receipt", title: "Comandas de 3 tipos", text: "Mesa, individual e balcão. Abra a do jeito que a casa atende e transfira a mesa quando o grupo muda de lugar." },
            { icon: "fire", title: "Pedido direto pro preparo", text: "Cada item cai na estação certa, Bar ou Cozinha, numa fila de Novos, Em preparo, Prontos e Entregues." },
            { icon: "tablet", title: "Maquininha e tablet", text: "O app Nokta POS é pareado com um código de 6 dígitos. O garçom lança o pedido de onde estiver." },
            { icon: "wallet", title: "Pagamento dividido", text: "Vários pagamentos na mesma comanda, em formas diferentes, até zerar o saldo. Troco registrado." },
            { icon: "money", title: "Caixa com sessão", text: "Abertura, suprimento, sangria e fechamento com o valor esperado e o contado lado a lado." },
            { icon: "chair", title: "Salão por áreas", text: "Mesas organizadas por área, com o histórico de atendimentos de cada uma." },
          ]}
        />
      </ContentSection>

      <ContentSection id="comanda" title="Como funciona a comanda digital">
        <Prose>
          <ol>
            <li>
              <strong>Abrir.</strong> O garçom abre a comanda da mesa, uma comanda individual pra quem consome sozinho ou uma venda de balcão.
            </li>
            <li>
              <strong>Lançar.</strong> Escolhe os itens no cardápio, com variações e adicionais. O pedido sai da tela e vai pra estação de preparo.
            </li>
            <li>
              <strong>Preparar.</strong> No bar e na cozinha, a equipe move o pedido de Novo pra Em preparo, Pronto e Entregue.
            </li>
            <li>
              <strong>Receber.</strong> A comanda mostra o total, os pagamentos já feitos e o restante. O cliente paga em uma ou várias formas.
            </li>
            <li>
              <strong>Fechar.</strong> Com o saldo zerado e os itens entregues, a comanda fecha e a mesa fica livre.
            </li>
          </ol>
          <p>
            Errou um item? Dá pra cancelar o item ou a comanda. Se a venda já foi paga e precisa ser desfeita, cada pagamento vira um estorno pendente até você confirmar que devolveu o dinheiro. O registro fica limpo pra conferência.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="caixa" title="Caixa que fecha batendo">
        <Prose>
          <p>
            O caixa trabalha por sessão. Você abre com o fundo de troco, registra suprimentos, sangrias e despesas ao longo da noite e fecha contando a gaveta. A Nokta mostra o valor esperado ao lado do contado, e a diferença aparece na hora.
          </p>
          <p>
            As sessões fechadas ficam no histórico, com abertura, esperado e contado. No <strong>financeiro</strong>, as vendas do bar se juntam às contas a pagar, às outras receitas e à conciliação, que compara o líquido esperado com o que caiu de fato na conta.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="integrado" title="Cardápio, estoque e reservas no mesmo lugar">
        <Prose>
          <p>O sistema para bar da Nokta divide o cadastro com as outras partes da operação:</p>
          <ul>
            <li>
              O <Link href="/solucoes/cardapio-digital">cardápio digital com QR code</Link> usa os mesmos produtos que o garçom lança na comanda. Marcou como esgotado, some a dúvida na mesa.
            </li>
            <li>
              O <Link href="/solucoes/controle-de-estoque-bar">controle de estoque</Link> dá baixa pela ficha técnica a cada venda e avisa o que está abaixo do mínimo.
            </li>
            <li>
              As <Link href="/solucoes/reservas-de-mesa">reservas de mesa</Link> e a fila de espera ficam na mesma conta, com a agenda do dia separada por status.
            </li>
          </ul>
          <p>
            Se a casa também faz festa com ingresso, a <Link href="/solucoes/vender-ingressos-online">venda de ingressos</Link> está na mesma conta. O dinheiro de cada parte fica separado: ingressos com saldo por evento, bar com vendas e caixa.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="equipe" title="Cada pessoa vê o que precisa">
        <Prose>
          <p>
            Garçom lança pedido, bar e cozinha veem a fila de preparo, o gerente fecha o caixa e o dono acompanha o financeiro. As permissões são por papel na equipe, então ninguém mexe no que não deve. Quem tem mais de uma unidade escolhe a unidade no topo da operação.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/cardapio-digital", "/solucoes/controle-de-estoque-bar", "/solucoes/reservas-de-mesa", "/comparativos/nokta-vs-consumer"]} />
      <CtaBand title="Abra a primeira comanda hoje" text="Cadastre o cardápio, convide a equipe e comece a operar. Sem mensalidade pra começar." />
    </>
  );
}
