import type { Metadata } from "next";
import { LegalContact, LegalDocument } from "@/components/ui/legal-document";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Política de Cancelamento e Reembolso",
  description: `Entenda as regras de cancelamento e reembolso de ingressos comprados na ${COMPANY.tradeName}.`,
};

const LAST_UPDATED = "22 de julho de 2026";

export default function PoliticaDeCancelamentoPage() {
  return (
    <LegalDocument
      title="Política de Cancelamento e Reembolso"
      lastUpdated={LAST_UPDATED}
      intro={<p>Esta política explica quando você pode cancelar uma compra de ingresso e receber reembolso, e o que acontece quando um evento é cancelado pelo produtor. Ela é aplicada a toda compra feita na {COMPANY.tradeName}.</p>}
      related={[
        { label: "Página inicial", href: "/" },
        { label: "Termos de Serviço", href: "/termos" },
        { label: "Política de Privacidade", href: "/privacidade" },
        { label: "Central de ajuda", href: "/ajuda" },
      ]}
      sections={[
        {
          id: "preco",
          title: "Composição do preço",
          content: (
            <>
              <p>O valor que você paga em uma compra é formado por três partes:</p>
              <ul>
                <li>
                  <strong>Valor do ingresso</strong> — definido pelo produtor do evento.
                </li>
                <li>
                  <strong>Taxa Nokta (10%)</strong> — pela intermediação e tecnologia da plataforma.
                </li>
                <li>
                  <strong>Taxa de processamento</strong> — cobrada pelo meio de pagamento (cartão ou Pix).
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "arrependimento",
          title: "Arrependimento em até 7 dias corridos",
          content: (
            <>
              <p>
                Você pode cancelar sua compra e pedir reembolso <strong>até 7 dias corridos</strong> após a confirmação do pagamento, sem precisar justificar o motivo — desde que o ingresso ainda não tenha sido utilizado, transferido ou revendido.
              </p>
              <p>Nesse caso, você recebe de volta o valor total pago: o valor do ingresso, a taxa Nokta e a taxa de processamento. O prazo é contado a partir da data e hora exatas da confirmação do pagamento — essa informação fica disponível na tela de detalhes do seu pedido.</p>
            </>
          ),
        },
        {
          id: "apos-7-dias",
          title: "Depois de 7 dias, sem cancelamento do evento",
          content: (
            <>
              <p>
                Passado o prazo de 7 dias, <strong>não há cancelamento ou reembolso por desistência pessoal</strong>. Você ainda pode:
              </p>
              <ul>
                <li>Utilizar o ingresso normalmente no evento;</li>
                <li>Transferir o ingresso para outra pessoa, quando essa opção estiver disponível;</li>
                <li>Revender o ingresso pela revenda oficial da Nokta, quando disponível para o evento.</li>
              </ul>
            </>
          ),
        },
        {
          id: "evento-cancelado",
          title: "Evento cancelado ou erro do produtor",
          content: <p>Se o evento for cancelado ou ocorrer um erro atribuível ao produtor (por exemplo, cobrança duplicada), você recebe de volta o valor total pago: valor do ingresso, taxa Nokta e taxa de processamento — independentemente do prazo de 7 dias.</p>,
        },
        {
          id: "como-solicitar",
          title: "Como solicitar",
          content: (
            <p>
              Acesse a tela de detalhes do seu pedido em <span className="font-medium">Meus Ingressos</span> e selecione os ingressos que deseja cancelar. Você verá o valor exato a ser devolvido antes de confirmar o pedido de cancelamento.
            </p>
          ),
        },
        {
          id: "contato",
          title: "Contato",
          content: <LegalContact />,
        },
      ]}
    />
  );
}
