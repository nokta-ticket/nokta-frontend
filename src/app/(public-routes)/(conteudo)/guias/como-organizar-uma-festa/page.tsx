import Link from "next/link";
import { Checklist } from "@/components/marketing/checklist";
import { ContentHero, ContentSection, CtaBand, FaqSection, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/guias/como-organizar-uma-festa";
const TITLE = "Como organizar uma festa: checklist completo";
const DESCRIPTION = "Como organizar uma festa com ingresso: checklist do orçamento ao pós-evento, com local, autorizações, atrações, lotes, divulgação, bar e portaria.";
const PUBLISHED = "2026-10-14";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["como organizar uma festa", "checklist de festa", "organizar evento", "como produzir uma festa", "planejamento de evento"],
  type: "article",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
});

const FAQ = [
  { q: "Com quanto tempo de antecedência devo organizar uma festa?", a: "Pra uma festa com ingresso, comece pelo menos dois meses antes. Isso dá tempo de fechar local e atrações, conseguir as autorizações e ter de três a seis semanas de venda." },
  { q: "Quais autorizações uma festa precisa?", a: "Depende da cidade, do local e do porte. Em geral, o local precisa estar regular com a prefeitura e o Corpo de Bombeiros, e eventos com música podem ter que recolher direitos autorais ao ECAD. Confirme com a prefeitura e com o dono do espaço." },
  { q: "Quanto custa organizar uma festa?", a: "Some local, som e luz, atrações, equipe, segurança, divulgação e custos por pessoa. O preço do ingresso vem dessa conta, dividida pela margem de cada ingresso." },
  { q: "Quantas pessoas de segurança preciso numa festa?", a: "Depende da capacidade, do local e das exigências da prefeitura e do Corpo de Bombeiros. Converse com a empresa de segurança e com o dono do espaço antes de fechar o número." },
  { q: "O que fazer depois da festa?", a: "Feche o caixa do bar, pague fornecedores e promoters, confira o saldo dos ingressos e anote o que funcionou. Em seguida, use a base de compradores pra anunciar a próxima edição." },
  { q: "Preciso de uma plataforma pra vender os ingressos?", a: "Não é obrigatório, mas facilita. A plataforma recebe o pagamento, entrega o ingresso com QR, controla lotes e permite o check-in pelo celular." },
];

export default function ComoOrganizarUmaFestaPage() {
  return (
    <>
      <JsonLd data={articleLd({ title: TITLE, description: DESCRIPTION, path: PATH, published: PUBLISHED })} />
      <ContentHero
        crumbs={[
          { name: "Guias", path: "/guias" },
          { name: "Como organizar uma festa", path: PATH },
        ]}
        title="Como organizar uma festa"
        lede="Organizar uma festa com ingresso é seguir uma ordem: orçamento e local primeiro, depois atrações e preço, venda e divulgação, operação do dia e fechamento. Use o checklist abaixo, dividido por fase, e marque o que já está resolvido."
        updated="2026-10-14"
      />

      <ContentSection id="conceito" title="8 semanas antes: conceito, orçamento e local">
        <Prose className="mb-5">
          <p>
            Tudo começa pelo conceito e pelo dinheiro. Uma festa sem orçamento fechado vira uma sequência de decisões caras na última hora.
          </p>
        </Prose>
        <Checklist
          items={[
            { title: "Defina o conceito", text: "Estilo musical, público, faixa de preço e o que vai fazer a festa ser diferente das outras da cidade." },
            { title: "Escolha a data", text: "Confira feriados, eventos concorrentes na mesma noite e a agenda das atrações que você quer." },
            { title: "Feche o local", text: "Capacidade, estrutura de som, banheiros, saídas de emergência, acessibilidade e se o bar é seu ou da casa." },
            { title: "Monte o orçamento", text: "Liste custos fixos e por pessoa. Inclua uma reserva pra imprevistos." },
            { title: "Cheque as autorizações", text: "Regularidade do local com a prefeitura e o Corpo de Bombeiros e direitos autorais de música junto ao ECAD, quando se aplicar." },
          ]}
        />
      </ContentSection>

      <ContentSection id="atracoes" title="6 semanas antes: atrações, preço e venda">
        <Prose className="mb-5">
          <p>
            Com local e data fechados, defina quem toca e quanto vai cobrar. O preço sai do orçamento: o guia <Link href="/guias/como-calcular-preco-do-ingresso">como calcular o preço do ingresso</Link> mostra a conta do ponto de equilíbrio.
          </p>
        </Prose>
        <Checklist
          items={[
            { title: "Feche as atrações por escrito", text: "Cachê, horário de apresentação, rider técnico e o que o artista vai postar na divulgação." },
            { title: "Calcule o preço e os lotes", text: "Ponto de equilíbrio, número de lotes, quantidade e data de virada de cada um." },
            { title: "Planeje a meia-entrada", text: "Cota mínima de 40% pros beneficiários da lei e política clara de documentos." },
            { title: "Crie o evento na plataforma", text: "Página com descrição, imagem, local e classificação etária. Lotes criados com antecedência." },
            { title: "Convide os promoters", text: "Link e comissão definidos antes de começar a divulgar." },
          ]}
        />
        <Prose className="mt-5">
          <p>
            As regras de meia estão no guia de <Link href="/guias/meia-entrada">meia-entrada</Link>, e a configuração da venda em <Link href="/solucoes/vender-ingressos-online">vender ingressos online</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="divulgacao" title="5 a 1 semana antes: divulgação e fornecedores">
        <Checklist
          items={[
            { title: "Siga o calendário de divulgação", text: "Anúncio, revelações do line-up, viradas de lote e reta final." },
            { title: "Abra a lista VIP, se fizer sentido", text: "Quantidade limitada e horário limite pra encher a casa cedo." },
            { title: "Feche os fornecedores do bar", text: "Bebidas, gelo, copos e insumos. Faça a ficha técnica dos drinks pra saber o custo de cada um." },
            { title: "Contrate segurança e limpeza", text: "Número de pessoas combinado com o local e com as exigências da prefeitura." },
            { title: "Monte a equipe da noite", text: "Portaria, bar, caixa, produção e um responsável por resolver problemas." },
            { title: "Acompanhe as vendas todo dia", text: "Se estiver parado, reforce a divulgação ou ative um promoter novo antes da última semana." },
          ]}
        />
        <Prose className="mt-5">
          <p>
            O calendário completo está em <Link href="/guias/como-divulgar-uma-festa">como divulgar uma festa</Link>, e a lista VIP em <Link href="/guias/como-montar-lista-vip">como montar uma lista VIP</Link>.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="vespera" title="Na véspera: teste tudo">
        <Checklist
          items={[
            { title: "Passe o som e a luz", text: "Com os técnicos e, se possível, com as atrações." },
            { title: "Teste o check-in", text: "Leia um ingresso de teste com cada celular da portaria, no ponto exato da entrada, e confira o sinal de internet." },
            { title: "Confira o estoque do bar", text: "Conte o que chegou contra o pedido e deixe o caixa com fundo de troco." },
            { title: "Faça a reunião com a equipe", text: "Horários, funções, regras de entrada, política de meia e o que fazer em emergência." },
            { title: "Prepare o plano B", text: "Carregadores, contatos de fornecedores e um caminho pra resolver ingresso com problema fora da fila." },
          ]}
        />
      </ContentSection>

      <ContentSection id="dia" title="No dia: portaria, bar e caixa">
        <Prose>
          <p>
            No dia, o produtor resolve problema, não executa tarefa. Se você está lendo QR na porta, ninguém está olhando o resto. Distribua as funções e fique livre pra circular.
          </p>
          <ul>
            <li>
              <strong>Portaria:</strong> fila separada pra quem já tem ingresso, leitura do QR pelo celular e alguém pra casos fora do padrão. Veja o <Link href="/solucoes/check-in-de-eventos">check-in de eventos</Link>.
            </li>
            <li>
              <strong>Bar:</strong> pedidos lançados na comanda, indo direto pro preparo. Caixa aberto com fundo de troco e sangrias registradas. Veja o <Link href="/solucoes/sistema-para-bar">sistema para bar</Link>.
            </li>
            <li>
              <strong>Público:</strong> acompanhe quantas pessoas entraram e a lotação do espaço.
            </li>
          </ul>
        </Prose>
      </ContentSection>

      <ContentSection id="depois" title="Depois da festa: fechamento e próxima edição">
        <Checklist
          items={[
            { title: "Feche o caixa do bar", text: "Compare o esperado com o contado e anote a diferença." },
            { title: "Pague fornecedores, equipe e promoters", text: "Use o relatório de comissões pra acertar com cada promoter." },
            { title: "Confira o saldo dos ingressos", text: "Quanto está liberado, em custódia e em saque." },
            { title: "Faça o balanço", text: "Receita de ingressos e bar contra o orçamento. O que estourou e por quê." },
            { title: "Anote o que funcionou", text: "Quais promoters venderam, quais posts trouxeram venda, a que horas a casa encheu." },
            { title: "Anuncie a próxima", text: "Mande pra quem foi enquanto a festa ainda está fresca na memória." },
          ]}
        />
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-vender-ingressos-online", "/guias/como-calcular-preco-do-ingresso", "/guias/como-divulgar-uma-festa", "/solucoes/check-in-de-eventos"]} />
      <CtaBand title="Organize a próxima festa numa conta só" text="Ingressos, lista VIP, promoters, portaria e bar no mesmo painel. Sem mensalidade." />
    </>
  );
}
