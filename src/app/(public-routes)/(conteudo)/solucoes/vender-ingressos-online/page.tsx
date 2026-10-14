import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/vender-ingressos-online";
const TITLE = "Vender ingressos online: plataforma sem mensalidade";
const DESCRIPTION = "Plataforma de venda de ingressos online sem mensalidade: lotes que viram sozinhos, Pix e cartão em até 12x, QR no WhatsApp e saldo separado por evento.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["vender ingressos online", "plataforma de venda de ingressos", "venda de ingressos", "site para vender ingressos", "ingresso online"],
});

const FAQ = [
  { q: "Quanto custa vender ingressos online na Nokta?", a: "Não tem mensalidade nem custo pra criar o evento. A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você configura por evento." },
  { q: "Quais formas de pagamento o comprador pode usar?", a: "Pix e cartão de crédito em até 12x. O cartão passa por autenticação 3DS, que reduz compra com cartão de outra pessoa." },
  { q: "Como o comprador recebe o ingresso?", a: "O QR do ingresso chega pelo WhatsApp e também fica em Meus ingressos, na conta do comprador. Na porta, a equipe lê o código com o celular." },
  { q: "Consigo vender em lotes com virada automática?", a: "Sim. Cada lote tem preço, quantidade e, se você quiser, uma data limite. O próximo lote abre sozinho quando o anterior esgota ou vence." },
  { q: "Posso criar cupom de desconto?", a: "Pode. O cupom pode ser em porcentagem ou valor fixo, valer pro evento inteiro, para um lote ou um tipo de ingresso, com limite de usos e período de validade." },
  { q: "Quando recebo o dinheiro das vendas?", a: "O saldo fica separado por evento e mostra o que está liberado, o que está em custódia e o que já está em saque. O saque cai na conta bancária cadastrada no seu workspace." },
  { q: "E se o comprador não puder ir?", a: "Ele pode colocar o ingresso na revenda oficial da Nokta. O preço fica limitado ao que ele pagou, então ninguém lucra com cambismo dentro da plataforma." },
];

export default function VenderIngressosOnlinePage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: venda de ingressos online", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Vender ingressos online", path: PATH },
        ]}
        title="Vender ingressos online sem mensalidade"
        lede="A Nokta é uma plataforma de venda de ingressos feita pra festa, balada e evento de casa noturna. Você cria o evento, monta os lotes e começa a vender no mesmo dia, pagando só quando vende."
        updated="2026-10-14"
      />

      <ContentSection id="como-funciona" title="Como funciona a venda de ingressos na Nokta">
        <Prose>
          <p>
            Você cria a conta, cadastra o evento com data, local, descrição e imagem, e define os ingressos. Cada ingresso pertence a um lote, com preço e quantidade. Quando o evento é publicado, ele ganha uma página própria na bilheteria da Nokta, com link pra você colocar na bio, nos stories e nos grupos.
          </p>
          <p>
            O comprador escolhe o ingresso, entra na conta e paga com Pix ou cartão. Durante o pagamento, os ingressos ficam reservados por alguns minutos, com um contador na tela, pra ninguém perder a vaga no meio do Pix. Pagou, o QR chega pelo WhatsApp.
          </p>
          <p>
            Do seu lado, o painel mostra vendas, lotes, cupons e o saldo do evento. Na noite da festa, a equipe faz o <Link href="/solucoes/check-in-de-eventos">check-in pelo celular</Link>, lendo o QR na porta.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que você tem pra vender ingressos online" wide>
        <FeatureGrid
          items={[
            { icon: "layers", title: "Lotes que viram sozinhos", text: "Defina preço, quantidade e data limite de cada lote. O próximo abre quando o anterior esgota ou vence, inclusive de madrugada." },
            { icon: "pix", title: "Pix na hora", text: "QR e copia e cola na tela. A confirmação aparece sozinha, sem o comprador mandar comprovante." },
            { icon: "credit-card", title: "Cartão em até 12x", text: "Parcelamento com autenticação 3DS. As condições de parcela aparecem antes do comprador confirmar." },
            { icon: "whatsapp", title: "QR pelo WhatsApp", text: "O ingresso chega no WhatsApp e fica salvo na conta do comprador. Sem PDF perdido no e-mail." },
            { icon: "tag", title: "Cupons com regra", text: "Porcentagem ou valor fixo, compra mínima, limite total e por pessoa, válido pro evento, um lote ou um tipo de ingresso." },
            { icon: "transfer", title: "Revenda oficial", text: "Quem não pode ir anuncia pelo valor que pagou, no máximo. Enquanto está anunciado, o QR fica suspenso. Vendeu, o ingresso passa pro comprador." },
          ]}
        />
      </ContentSection>

      <ContentSection id="taxas" title="Taxa de serviço às claras">
        <Prose>
          <p>
            A Nokta não cobra mensalidade, plano nem adesão. A plataforma se paga com a <strong>taxa de serviço</strong>, mostrada ao comprador no checkout antes de ele pagar. O padrão é 10% e pode ser configurado por evento.
          </p>
          <p>
            O resumo do pedido mostra o valor do ingresso e cada taxa em linha separada. O comprador sabe exatamente o que está pagando, e você evita a reclamação de &ldquo;taxa escondida&rdquo; nos comentários do post.
          </p>
          <p>
            Na hora de definir o preço, pense no total que o comprador vê na tela. O guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> mostra a conta com custos, lotes e ponto de equilíbrio.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="tipos" title="Tipos de ingresso: pago, gratuito, meia e VIP">
        <Prose>
          <p>Cada lote tem um tipo. Os tipos disponíveis são:</p>
          <ul>
            <li>
              <strong>Pago</strong> e <strong>inteira</strong>, para a venda normal.
            </li>
            <li>
              <strong>Meia-entrada</strong>, com um campo pra você escrever a política de meia do evento. As regras legais estão no guia de <Link href="/guias/meia-entrada">meia-entrada</Link>.
            </li>
            <li>
              <strong>Gratuito</strong>, para eventos com inscrição sem custo.
            </li>
            <li>
              <strong>VIP</strong>, que vira uma <Link href="/solucoes/lista-vip">lista VIP com link próprio</Link>, quantidade limitada e horário limite pra retirar.
            </li>
          </ul>
          <p>Um mesmo lote pode ter mais de um ingresso, como pista e camarote, cada um com preço e quantidade próprios. Dá pra criar todos os lotes com antecedência e deixar a virada por conta da plataforma.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="divulgacao" title="Vender mais com promoters e CRM">
        <Prose>
          <p>
            Ingresso de festa vende muito por indicação. Na Nokta, cada <Link href="/solucoes/promoters">promoter</Link> recebe um link exclusivo e, se você quiser, um código próprio de desconto. A comissão pode ser porcentagem do valor líquido ou um valor fixo por ingresso. O painel mostra cliques, pedidos pagos, conversão e comissão de cada um.
          </p>
          <p>
            Cada compra também alimenta o seu CRM. Você filtra quem comprou em eventos anteriores, quem foi de fato e quem está sumido há meses, e manda campanha por e-mail ou WhatsApp quando abrir o próximo lote. As ideias práticas estão em <Link href="/guias/como-divulgar-uma-festa">como divulgar uma festa</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="dinheiro" title="Saldo separado por evento">
        <Prose>
          <p>
            Cada evento tem o seu saldo, dividido em três partes: o que já está <strong>liberado</strong>, o que está em <strong>custódia</strong> e o que está em <strong>saque</strong>. Se você produz duas festas no mesmo mês, o dinheiro de uma nunca se mistura com o da outra.
          </p>
          <p>
            Quando o valor fica disponível, você pede o saque e ele cai na conta bancária cadastrada no workspace. Quem divide a produção com sócios consegue ver, evento por evento, quanto entrou e quanto ainda falta liberar.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="primeiro-evento" title="Do cadastro à primeira venda">
        <Prose>
          <ol>
            <li>Crie a conta de produtor. É grátis e não pede cartão.</li>
            <li>Cadastre o evento: nome, data, horário, local, descrição e imagem de capa.</li>
            <li>Monte os lotes com preço, quantidade e data limite. Ligue a lista VIP se fizer sentido.</li>
            <li>Configure a taxa de serviço do evento ou mantenha o padrão de 10%.</li>
            <li>Publique e compartilhe o link. Convide os promoters pra receberem os links deles.</li>
          </ol>
          <p>
            Se é a sua primeira vez, o guia <Link href="/guias/como-vender-ingressos-online">como vender ingressos online</Link> detalha cada etapa, do preço à portaria.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-vender-ingressos-online", "/guias/como-calcular-preco-do-ingresso", "/solucoes/check-in-de-eventos", "/comparativos/alternativas-sympla"]} />
      <CtaBand title="Publique o seu evento hoje" text="Crie a conta, monte os lotes e compartilhe o link. Sem mensalidade: você paga só quando vende." />
    </>
  );
}
