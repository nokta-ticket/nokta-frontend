import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/reservas-de-mesa";
const TITLE = "Sistema de reservas para restaurante e bar";
const DESCRIPTION = "Sistema de reservas para restaurante e bar: agenda do dia por status, mesas livres no horário, fila de espera e no-show registrado. Sem mensalidade.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["sistema de reservas para restaurante", "reserva de mesa", "sistema de reservas", "fila de espera restaurante", "agenda de reservas", "reservas para bar"],
});

const FAQ = [
  { q: "Como funciona o sistema de reservas da Nokta?", a: "A equipe registra a reserva com nome, telefone, número de pessoas, data e horário. A Nokta mostra as mesas livres naquele horário, você escolhe uma ou mais e a reserva entra na agenda do dia." },
  { q: "O cliente consegue reservar sozinho pela internet?", a: "Hoje as reservas são registradas pela equipe no painel. Você marca de onde a reserva veio, como telefone, WhatsApp, Instagram ou site, pra saber qual canal traz mais cliente." },
  { q: "Dá pra juntar mesas pra um grupo grande?", a: "Dá. Se nenhuma mesa sozinha comporta o grupo, você seleciona mais de uma e marca qual é a principal." },
  { q: "Como funciona a fila de espera?", a: "Quem chega sem reserva entra na fila com nome, telefone, número de pessoas e previsão de espera. Quando a mesa libera, você acomoda o cliente direto da fila. O painel mostra a espera média do dia." },
  { q: "O sistema registra no-show?", a: "Registra. Você marca a reserva como no-show, e o resumo do dia mostra quantas pessoas não vieram. Cancelamentos ficam com o motivo anotado." },
  { q: "Posso ter uma lista de convidados na reserva?", a: "Pode. Aniversário ou confraternização ganham uma lista de nomes na reserva, e a equipe marca quem já chegou, sem os convidados precisarem de conta." },
];

export default function ReservasDeMesaPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: sistema de reservas para restaurante", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Reservas de mesa", path: PATH },
        ]}
        title="Sistema de reservas para restaurante"
        lede="A agenda do dia separada em confirmadas, pendentes e quem já chegou. Mesas livres no horário pedido, fila de espera em ordem e no-show anotado, no mesmo painel das comandas."
        updated="2026-10-14"
      />

      <ContentSection id="caderno" title="Do caderno de reservas pro painel">
        <Prose>
          <p>
            Muita casa ainda controla reserva num caderno no balcão ou num grupo de WhatsApp. Funciona até a sexta-feira cheia. Aí aparecem duas reservas pra mesma mesa, o grupo de doze chega e ninguém separou espaço, e o cliente da fila desiste porque ninguém soube dizer quanto tempo faltava.
          </p>
          <p>
            Um sistema de reservas para restaurante resolve isso com três coisas: saber quais mesas estão livres no horário, ver a agenda do dia num relance e organizar quem chega sem reserva. É isso que a Nokta faz.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que vem no sistema de reservas" wide>
        <FeatureGrid
          items={[
            { icon: "calendar-check", title: "Agenda do dia", text: "Reservas do dia com quem já chegou, confirmadas e pendentes. Troque a data pra ver outro dia." },
            { icon: "chair", title: "Mesas livres no horário", text: "Informe pessoas, data e horário e veja as mesas disponíveis. Junte mesas quando o grupo for grande." },
            { icon: "users", title: "Fila de espera", text: "Nome, telefone, pessoas e previsão. Acomode da fila direto na mesa e acompanhe a espera média." },
            { icon: "eye-slash", title: "No-show e cancelamento", text: "Marque quem não veio e registre o motivo de cada cancelamento." },
            { icon: "compass", title: "Origem da reserva", text: "Telefone, WhatsApp, Instagram, site: saiba de onde vêm as suas reservas." },
            { icon: "lock", title: "Observação interna", text: "Anote o que só a equipe precisa saber, separado da observação que o cliente pediu." },
          ]}
        />
      </ContentSection>

      <ContentSection id="como-funciona" title="Como registrar uma reserva">
        <Prose>
          <ol>
            <li>
              <strong>Dados do cliente.</strong> Nome, telefone, e-mail se quiser, número de pessoas, data, horário e duração. Marque a origem e a área preferida, como salão ou varanda.
            </li>
            <li>
              <strong>Mesa.</strong> A Nokta consulta a disponibilidade e mostra as mesas livres no horário. Escolha uma ou mais.
            </li>
            <li>
              <strong>Observações.</strong> Pedido do cliente, como cadeira de bebê ou aniversário, e notas internas pra equipe.
            </li>
            <li>
              <strong>No dia.</strong> A reserva aparece na agenda. Quando o cliente chega, a equipe acomoda e a reserva sai de &ldquo;a chegar&rdquo;. Se não vier, vira no-show.
            </li>
          </ol>
        </Prose>
      </ContentSection>

      <ContentSection id="regras" title="Regras da casa configuráveis">
        <Prose>
          <p>Cada casa tem o seu ritmo. Nas configurações de reservas você define:</p>
          <ul>
            <li>
              <strong>Duração padrão</strong> de cada reserva, que libera a mesa pro próximo horário;
            </li>
            <li>
              <strong>Antecedência mínima</strong> pra aceitar uma reserva;
            </li>
            <li>
              <strong>Tolerância de atraso</strong>, o tempo que a mesa fica guardada depois do horário marcado.
            </li>
          </ul>
          <p>
            Com isso, a equipe toma a mesma decisão em todo turno, sem depender de quem está no balcão.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="fila" title="Fila de espera sem papelzinho">
        <Prose>
          <p>
            Sexta à noite, a fila é inevitável. O que dá pra controlar é a ordem e a expectativa. Na Nokta, quem chega entra na fila com nome, telefone, número de pessoas, área preferida e uma previsão de espera. A lista fica em ordem de chegada.
          </p>
          <p>
            Quando uma mesa libera, você acomoda o próximo direto da fila. Se o cliente desistir, registre a desistência. O resumo do dia mostra quantas pessoas estão esperando e a espera média, um número útil pra decidir se vale abrir mais uma área.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="integrado" title="Reserva, comanda e cardápio juntos">
        <Prose>
          <p>
            As reservas usam as mesmas áreas e mesas do salão que aparecem na operação. O cliente senta, o garçom abre a comanda da mesa no <Link href="/solucoes/sistema-para-bar">sistema para bar</Link> e lança os pedidos do <Link href="/solucoes/cardapio-digital">cardápio digital</Link>. No fim, tudo cai no caixa e no financeiro.
          </p>
          <p>
            Em reservas de aniversário e confraternização, a área de convidados guarda a lista de nomes da reserva, e a equipe marca quem já chegou. Os convidados não precisam ter conta.
          </p>
          <p>
            Se a casa também faz noites com ingresso, a <Link href="/solucoes/vender-ingressos-online">venda de ingressos</Link> fica na mesma conta, com saldo separado.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/sistema-para-bar", "/solucoes/cardapio-digital", "/solucoes/controle-de-estoque-bar", "/comparativos/nokta-vs-consumer"]} />
      <CtaBand title="Organize as reservas da sua casa" text="Cadastre as mesas, registre a primeira reserva e acompanhe a fila no celular. Sem mensalidade pra começar." />
    </>
  );
}
