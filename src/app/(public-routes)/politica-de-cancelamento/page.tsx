import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cancelamento e Reembolso | Nokta Tickets",
  description:
    "Entenda as regras de cancelamento e reembolso de ingressos comprados na Nokta Tickets.",
};

const LAST_UPDATED = "22 de julho de 2026";

export default function PoliticaDeCancelamentoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      <div className="mb-10 border-b pb-8">
        <p className="mb-2 text-sm font-medium text-violet-600 uppercase tracking-wide">
          Nokta Tickets
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Política de Cancelamento e Reembolso
        </h1>
        <p className="mt-3 text-sm text-gray-500">Última atualização: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-10 text-[15px] leading-7">
        <section>
          <p>
            Esta política explica quando você pode cancelar uma compra de ingresso e
            receber reembolso, e o que acontece quando um evento é cancelado pelo
            produtor. Ela é aplicada a toda compra feita na Nokta Tickets.
          </p>
        </section>

        <Section title="1. Composição do preço">
          <p>
            O valor que você paga em uma compra é formado por três partes:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li><strong>Valor do ingresso</strong> — definido pelo produtor do evento.</li>
            <li><strong>Taxa Nokta (10%)</strong> — pela intermediação e tecnologia da plataforma.</li>
            <li><strong>Taxa de processamento</strong> — cobrada pelo meio de pagamento (cartão ou Pix).</li>
          </ul>
        </Section>

        <Section title="2. Arrependimento em até 7 dias corridos">
          <p>
            Você pode cancelar sua compra e pedir reembolso <strong>até 7 dias corridos</strong>{" "}
            após a confirmação do pagamento, sem precisar justificar o motivo — desde que
            o ingresso ainda não tenha sido utilizado, transferido ou revendido.
          </p>
          <p className="mt-3">
            Nesse caso, você recebe de volta o valor total pago: o valor do ingresso, a
            taxa Nokta e a taxa de processamento. O prazo é contado a partir da data e
            hora exatas da confirmação do pagamento — essa informação fica disponível na
            tela de detalhes do seu pedido.
          </p>
        </Section>

        <Section title="3. Depois de 7 dias, sem cancelamento do evento">
          <p>
            Passado o prazo de 7 dias, <strong>não há cancelamento ou reembolso por
            desistência pessoal</strong>. Você ainda pode:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Utilizar o ingresso normalmente no evento;</li>
            <li>Transferir o ingresso para outra pessoa, quando essa opção estiver disponível;</li>
            <li>Revender o ingresso pela revenda oficial da Nokta, quando disponível para o evento.</li>
          </ul>
        </Section>

        <Section title="4. Evento cancelado ou erro do produtor">
          <p>
            Se o evento for cancelado ou ocorrer um erro atribuível ao produtor (por
            exemplo, cobrança duplicada), você recebe de volta o valor total pago: valor
            do ingresso, taxa Nokta e taxa de processamento — independentemente do prazo
            de 7 dias.
          </p>
        </Section>

        <Section title="5. Como solicitar">
          <p>
            Acesse a tela de detalhes do seu pedido em{" "}
            <span className="font-medium">Meus Ingressos</span> e selecione os ingressos
            que deseja cancelar. Você verá o valor exato a ser devolvido antes de
            confirmar o pedido de cancelamento.
          </p>
        </Section>

        <Section title="6. Contato">
          <div className="rounded-lg bg-gray-50 p-4">
            <p><strong>Nokta Tickets</strong></p>
            <p>
              E-mail:{" "}
              <a href="mailto:suporte@noktatickets.com.br" className="text-violet-600 hover:underline">
                suporte@noktatickets.com.br
              </a>
            </p>
          </div>
        </Section>
      </div>

      <div className="mt-16 border-t pt-8 flex flex-wrap gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-800">Página inicial</Link>
        <Link href="/termos" className="hover:text-gray-800">Termos de Serviço</Link>
        <Link href="/privacidade" className="hover:text-gray-800">Política de Privacidade</Link>
        <a href="mailto:suporte@noktatickets.com.br" className="hover:text-gray-800">Contato</a>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
