import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/lista-vip";
const TITLE = "Lista VIP para festas: link próprio e QR na entrada";
const DESCRIPTION = "Lista VIP para festas sem planilha: um link pros stories, quantidade limitada, horário limite pra retirar e um QR por pessoa lido na porta pelo celular.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["lista VIP para festas", "lista VIP", "lista de nomes", "lista de nomes para festa", "nome na lista", "lista amiga"],
});

const FAQ = [
  { q: "Como funciona a lista VIP na Nokta?", a: "Você cria a lista no evento com nome, quantidade e horário limite. A Nokta gera um link pra divulgar. Quem entra pelo link pega o VIP e recebe um ingresso gratuito com QR, lido na porta como qualquer outro ingresso." },
  { q: "Lista VIP e lista de nomes são a mesma coisa?", a: "Na prática, sim: as duas dão entrada grátis ou com condição especial pra quem se inscreve antes. A diferença é o controle. Na lista de nomes a portaria procura o nome numa folha. Na lista VIP da Nokta cada pessoa tem um QR próprio." },
  { q: "Dá pra limitar a quantidade de nomes na lista?", a: "Dá. Você define quantos VIPs a lista entrega. Quando acaba, a lista aparece como esgotada e o link para de entregar." },
  { q: "Posso definir um horário limite pra lista VIP?", a: "Pode. Você escolhe a data e a hora, no horário de Brasília, até quando o VIP pode ser retirado. Depois disso o link para de entregar, e quem já retirou entra normalmente." },
  { q: "A pessoa precisa ter conta pra entrar na lista?", a: "Precisa. Ela entra ou cria a conta e informa o CPF, se ainda não tiver cadastrado. Isso garante um VIP por pessoa e evita nome falso na lista." },
  { q: "A lista VIP aparece na página do evento?", a: "Não. O link da lista VIP é separado da página de venda, pensado pra stories, grupos e mensagens diretas. Quem chega pela página do evento vê só os ingressos à venda." },
  { q: "Quanto custa usar a lista VIP?", a: "A lista VIP vem junto com a venda de ingressos e não tem mensalidade. Os ingressos da lista são gratuitos pro convidado." },
];

export default function ListaVipPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: lista VIP para festas", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Lista VIP", path: PATH },
        ]}
        title="Lista VIP para festas com link e QR"
        lede="Troque a lista de nomes no papel por um link. Quem se inscreve recebe um ingresso gratuito com QR, a lista fecha sozinha no horário que você escolher e a portaria lê tudo pelo celular."
        updated="2026-10-14"
      />

      <ContentSection id="problema" title="O problema da lista de nomes">
        <Prose>
          <p>
            A lista de nomes resolve uma coisa importante: enche a casa cedo. O produtor anuncia &ldquo;nome na lista até meia-noite&rdquo;, as pessoas mandam mensagem e chegam antes do horário. O problema começa na organização.
          </p>
          <p>
            Os nomes chegam por direct, por WhatsApp, por comentário. Alguém copia tudo numa planilha, imprime e entrega pra portaria. Na porta, a fila trava enquanto a equipe procura &ldquo;Ana&rdquo; entre quinze Anas. Gente coloca o nome de quem não vai, ou o mesmo nome entra duas vezes. No fim, você não sabe quantas pessoas da lista vieram de fato.
          </p>
          <p>A lista VIP da Nokta mantém o efeito da lista de nomes e tira o trabalho manual.</p>
        </Prose>
      </ContentSection>

      <ContentSection id="como-funciona" title="Como funciona a lista VIP na Nokta">
        <Prose>
          <ol>
            <li>
              No evento, você cria uma lista VIP com um nome, por exemplo &ldquo;VIP até 23h&rdquo;, a quantidade de VIPs e até quando eles podem ser retirados.
            </li>
            <li>A Nokta gera o link da lista. Ele não aparece na página de venda, então você decide onde divulgar: stories, grupo, bio, direct.</li>
            <li>Quem abre o link entra na conta (ou cria uma), informa o CPF se precisar e toca em &ldquo;Pegar VIP&rdquo;.</li>
            <li>Na hora, a pessoa recebe um ingresso gratuito com QR, que fica salvo em Meus ingressos.</li>
            <li>
              Na noite, a portaria lê o QR no <Link href="/solucoes/check-in-de-eventos">check-in pelo celular</Link>, igual a um ingresso pago.
            </li>
          </ol>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="Controle da lista sem planilha" wide>
        <FeatureGrid
          items={[
            { icon: "link", title: "Link próprio", text: "Um endereço só da lista VIP, separado da página de venda. Copie no painel e cole onde quiser." },
            { icon: "users", title: "Quantidade limitada", text: "Você define quantos VIPs a lista entrega. Acabou, a lista mostra que esgotou." },
            { icon: "clock", title: "Horário limite", text: "Data e hora, no horário de Brasília, até quando o VIP pode ser retirado. Depois disso o link para de entregar." },
            { icon: "id-card", title: "Um VIP por pessoa", text: "Cada pessoa retira com a própria conta e CPF. Acaba o nome repetido e o nome inventado." },
            { icon: "qr", title: "QR na porta", text: "Cada VIP é um ingresso com QR. A portaria não procura nome em folha impressa." },
            { icon: "sliders", title: "Pausar quando quiser", text: "Um botão abre e pausa a lista. Útil quando a casa enche antes do previsto." },
          ]}
        />
      </ContentSection>

      <ContentSection id="estrategias" title="Formas de usar a lista VIP">
        <Prose>
          <p>Você pode criar mais de uma lista no mesmo evento, cada uma com quantidade e prazo próprios. Algumas combinações comuns:</p>
          <ul>
            <li>
              <strong>VIP por horário.</strong> Entrada grátis pra quem retira até as 23h. Enche a pista cedo e aquece o bar.
            </li>
            <li>
              <strong>VIP para aniversariantes.</strong> Uma lista pequena, divulgada só pra quem pediu, com quantidade baixa.
            </li>
            <li>
              <strong>VIP de lançamento.</strong> Os primeiros nomes da noite de abertura de uma festa nova, pra criar fila e foto.
            </li>
          </ul>
          <p>
            A lista VIP convive com a venda normal. Os ingressos pagos seguem na página do evento, em <Link href="/solucoes/vender-ingressos-online">lotes com virada automática</Link>, e o VIP fica no link à parte. O guia <Link href="/guias/como-montar-lista-vip">como montar uma lista VIP</Link> traz o passo a passo e os cuidados com quantidade e horário.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="convidados" title="Cortesias para convidados">
        <Prose>
          <p>
            Além da lista VIP aberta, o painel tem a área de <strong>convidados</strong>. Ali você manda cortesia pra e-mails específicos de quem já tem conta na Nokta, como artistas, imprensa e parceiros. Cada convite mostra se o QR foi enviado e se a pessoa compareceu.
          </p>
          <p>
            A diferença é o alcance. A lista VIP é pra divulgar e qualquer pessoa com o link pode retirar enquanto houver vaga. A cortesia vai nominal pra quem você escolheu.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="dados" title="A lista vira base de público">
        <Prose>
          <p>
            Cada VIP retirado é uma pessoa identificada na sua base, com conta e histórico. Isso alimenta o CRM da Nokta, onde você filtra quem já foi às suas festas e manda campanha por e-mail ou WhatsApp quando abrir o próximo evento. Lista de nomes em papel não deixa esse rastro.
          </p>
          <p>
            Se quem divulga a festa são <Link href="/solucoes/promoters">promoters</Link>, eles trabalham com link de venda próprio e comissão. A lista VIP fica com você.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/guias/como-montar-lista-vip", "/solucoes/check-in-de-eventos", "/solucoes/promoters", "/comparativos/nokta-vs-shotgun"]} />
      <CtaBand title="Crie a sua lista VIP" text="Monte a lista no evento, copie o link e divulgue nos stories. Sem mensalidade." />
    </>
  );
}
