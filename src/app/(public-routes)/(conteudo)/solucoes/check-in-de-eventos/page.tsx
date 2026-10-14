import Link from "next/link";
import { ContentHero, ContentSection, CtaBand, FaqSection, FeatureGrid, Prose, RelatedLinks } from "@/components/marketing/content";
import { JsonLd, softwareApplicationLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

const PATH = "/solucoes/check-in-de-eventos";
const TITLE = "Check-in de eventos com QR code pelo celular";
const DESCRIPTION = "Check-in de eventos e controle de entrada com QR code: a equipe valida ingressos pela câmera do celular, sem leitor dedicado e sem lista impressa na porta.";

export const metadata = buildMetadata({
  site: "marketing",
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["check-in de eventos", "controle de entrada com QR code", "validar ingresso QR code", "app de check-in", "controle de acesso evento"],
});

const FAQ = [
  { q: "Preciso de leitor de QR code pra fazer check-in?", a: "Não. A validação usa a câmera do celular da equipe, direto no navegador. Qualquer celular com câmera e acesso à conta serve." },
  { q: "Quem pode validar ingressos na portaria?", a: "As pessoas que você adiciona na equipe do evento. Cada uma entra com a própria conta e só valida ingressos daquele evento." },
  { q: "O que acontece se o QR estiver ilegível ou o celular do cliente sem bateria?", a: "A equipe pode digitar o código do ingresso no campo da tela de check-in. A validação é a mesma do QR." },
  { q: "O mesmo ingresso pode entrar duas vezes?", a: "A validação acontece no servidor da Nokta. Um ingresso já usado volta como inválido, com a mensagem do motivo na tela." },
  { q: "Ingresso de lista VIP e cortesia passam pelo mesmo check-in?", a: "Sim. VIP da lista e cortesia viram ingressos com QR e são lidos na mesma tela que os ingressos pagos." },
  { q: "Quanto custa o check-in da Nokta?", a: "O check-in vem junto com a venda de ingressos, sem mensalidade e sem aluguel de equipamento." },
];

export default function CheckInDeEventosPage() {
  return (
    <>
      <JsonLd data={softwareApplicationLd({ name: "Nokta: check-in de eventos", description: DESCRIPTION, path: PATH })} />
      <ContentHero
        crumbs={[
          { name: "Soluções", path: "/solucoes" },
          { name: "Check-in de eventos", path: PATH },
        ]}
        title="Check-in de eventos com QR code"
        lede="A equipe da portaria valida os ingressos com a câmera do próprio celular. Sem leitor dedicado, sem lista impressa e com o resultado na tela em segundos."
        updated="2026-10-14"
      />

      <ContentSection id="por-que" title="Por que o controle de entrada com QR code funciona">
        <Prose>
          <p>
            Cada ingresso vendido na Nokta tem um QR único. Na porta, a equipe aponta o celular, a Nokta confere se o ingresso existe, é daquele evento e ainda não foi usado, e mostra na tela &ldquo;Ingresso válido&rdquo; ou &ldquo;Ingresso inválido&rdquo; com o motivo.
          </p>
          <p>
            Isso resolve os três problemas clássicos de portaria. Print de ingresso repassado pra várias pessoas para de funcionar depois da primeira leitura. Ninguém precisa procurar nome em folha. E você sabe quantas pessoas entraram de fato, não só quantas compraram.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="recursos" title="O que a portaria tem na mão" wide>
        <FeatureGrid
          items={[
            { icon: "camera", title: "Câmera do celular", text: "A tela de check-in abre a câmera e lê o QR. Não precisa instalar app nem comprar leitor." },
            { icon: "barcode", title: "Código digitado", text: "QR rachado ou celular sem bateria? A equipe digita o código do ingresso e valida do mesmo jeito." },
            { icon: "check-circle", title: "Resultado na hora", text: "Válido em verde, inválido em vermelho, com a mensagem do motivo pra equipe saber o que dizer." },
            { icon: "list", title: "Histórico da sessão", text: "A tela guarda as leituras da sessão e um contador de entradas, pra conferir quem acabou de passar." },
            { icon: "user-shield", title: "Equipe por evento", text: "Você adiciona quem trabalha na porta. Cada pessoa valida com a própria conta, só no evento em que foi colocada." },
            { icon: "crown", title: "VIP e cortesia na mesma tela", text: "Ingresso pago, VIP da lista e cortesia passam pelo mesmo QR. Uma fila só pra quem já tem ingresso." },
          ]}
        />
      </ContentSection>

      <ContentSection id="passo-a-passo" title="Como montar o check-in do seu evento">
        <Prose>
          <ol>
            <li>
              <strong>Adicione a equipe.</strong> No evento, abra a equipe e inclua quem vai validar ingressos. Cada pessoa precisa de uma conta na Nokta.
            </li>
            <li>
              <strong>Teste antes de abrir a porta.</strong> Compre ou emita um ingresso de teste, como uma cortesia, e leia o QR com cada celular que vai trabalhar na noite.
            </li>
            <li>
              <strong>Defina as filas.</strong> Separe quem já tem ingresso de quem vai comprar na hora. Se houver lista VIP com horário limite, avise a equipe do horário.
            </li>
            <li>
              <strong>Garanta a conexão.</strong> A validação acontece no servidor, então teste o sinal no ponto exato da porta. Se o 4G for fraco no local, combine com a casa um Wi-Fi exclusivo pra equipe.
            </li>
            <li>
              <strong>Tenha um plano B.</strong> Carregador portátil por celular e uma pessoa responsável por resolver casos fora da fila, como ingresso inválido ou dúvida de meia-entrada.
            </li>
          </ol>
          <p>
            Organizar a portaria é só uma parte da noite. O guia <Link href="/guias/como-organizar-uma-festa">como organizar uma festa</Link> traz o checklist completo, do local ao pós-evento.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="ingresso-chega" title="O ingresso chega pronto pra porta">
        <Prose>
          <p>
            Um check-in rápido começa na compra. Na Nokta, o QR do ingresso chega pelo WhatsApp do comprador e também fica salvo em Meus ingressos, na conta dele. Ninguém chega na porta procurando PDF no e-mail.
          </p>
          <p>
            O mesmo vale pros convidados. A <Link href="/solucoes/lista-vip">lista VIP</Link> entrega um ingresso com QR pra cada pessoa que retira pelo link, e as cortesias da área de convidados mostram se a pessoa compareceu.
          </p>
          <p>
            Quando alguém desiste de ir, a revenda oficial suspende o QR enquanto o ingresso está anunciado e passa o ingresso pro novo comprador quando vende. Isso evita duas pessoas na porta com o mesmo ingresso.
          </p>
        </Prose>
      </ContentSection>

      <ContentSection id="meia" title="Meia-entrada na portaria">
        <Prose>
          <p>
            A lei de meia-entrada permite exigir o documento de quem comprou meia também na entrada do evento. Se o seu evento vende meia, combine com a equipe quais documentos aceitar e o que fazer quando a pessoa não apresentar. O guia de <Link href="/guias/meia-entrada">meia-entrada</Link> resume quem tem direito e quais documentos valem.
          </p>
        </Prose>
      </ContentSection>

      <FaqSection items={FAQ} />
      <RelatedLinks currentPath={PATH} paths={["/solucoes/vender-ingressos-online", "/solucoes/lista-vip", "/guias/como-organizar-uma-festa", "/comparativos/nokta-vs-eventbrite"]} />
      <CtaBand title="Portaria rápida desde a primeira festa" text="Venda pela Nokta e valide os ingressos com o celular da equipe. Sem mensalidade e sem equipamento." />
    </>
  );
}
