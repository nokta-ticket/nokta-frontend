import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | Nokta Tickets",
  description:
    "Leia os Termos de Serviço da Nokta Tickets antes de usar nossa plataforma.",
};

const LAST_UPDATED = "21 de fevereiro de 2026";

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      {/* Header */}
      <div className="mb-10 border-b pb-8">
        <p className="mb-2 text-sm font-medium text-violet-600 uppercase tracking-wide">
          Nokta Tickets
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Termos de Serviço
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Última atualização: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-10 text-[15px] leading-7">
        <section>
          <p>
            Bem-vindo à <strong>Nokta Tickets</strong>! Ao acessar ou usar nossa
            plataforma, disponível em{" "}
            <span className="font-medium">noktatickets.com.br</span>, você concorda
            com estes Termos de Serviço. Leia-os com atenção antes de prosseguir.
          </p>
        </section>

        <Section title="1. Sobre a plataforma">
          <p>
            A Nokta Tickets é uma plataforma online de venda, distribuição e gerenciamento
            de ingressos para eventos. Conectamos produtores de eventos (pessoas físicas ou
            jurídicas) com compradores (público geral).
          </p>
          <p className="mt-3">
            A Nokta atua como intermediária tecnológica. O contrato de venda de ingressos
            é firmado diretamente entre o produtor do evento e o comprador. A Nokta não é
            responsável pelo conteúdo, realização, cancelamento ou qualidade dos eventos
            disponibilizados na plataforma.
          </p>
        </Section>

        <Section title="2. Cadastro e conta">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              O cadastro requer informações verdadeiras, precisas e atualizadas. Dados
              falsos podem resultar em suspensão imediata da conta.
            </li>
            <li>Você é responsável por manter a confidencialidade da sua senha.</li>
            <li>
              É permitida apenas uma conta por pessoa física. Contas duplicadas podem
              ser encerradas.
            </li>
            <li>
              Menores de 18 anos devem ter autorização de um responsável legal para
              utilizar a plataforma.
            </li>
          </ul>
        </Section>

        <Section title="3. Compra de ingressos">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Toda compra é definitiva após a confirmação do pagamento. Reembolsos estão
              sujeitos à política de cancelamento de cada evento, definida pelo produtor.
            </li>
            <li>
              Em caso de cancelamento do evento pelo produtor, a Nokta facilitará o
              processo de reembolso conforme as regras aplicáveis.
            </li>
            <li>
              Ingressos não são transferíveis salvo quando a funcionalidade de
              transferência estiver disponível na plataforma.
            </li>
            <li>
              A revenda de ingressos por valores superiores ao face value (cambismo)
              é expressamente proibida.
            </li>
          </ul>
        </Section>

        <Section title="4. Taxas e pagamentos">
          <p>
            A Nokta cobra uma taxa de serviço sobre cada ingresso vendido. O valor da
            taxa é exibido claramente no momento da compra. Pagamentos são processados
            por provedores terceiros certificados e seguros.
          </p>
          <p className="mt-3">
            Para produtores: os repasses são realizados via PIX após o evento, descontadas
            as taxas vigentes. O prazo de repasse é de até 5 dias úteis após a data do
            evento, salvo disposição contratual distinta.
          </p>
        </Section>

        <Section title="5. Contas de produtor">
          <p>
            Para criar e publicar eventos na Nokta, é necessário ativar uma conta de
            produtor, sujeita às seguintes regras:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              <strong>Nível 1 (N1):</strong> ativado automaticamente após preenchimento
              de nome artístico/empresa, telefone e aceite dos termos de produtor. Permite
              criar eventos gratuitos e rascunhos.
            </li>
            <li>
              <strong>Nível 2 (N2):</strong> requer verificação de identidade (CPF/CNPJ
              e chave PIX vinculada) e aprovação pela equipe da Nokta. Permite publicar
              eventos com ingressos pagos e receber repasses.
            </li>
          </ul>
          <p className="mt-3">
            O produtor é integralmente responsável pelas informações dos eventos que
            publicar, pela realização do evento e pelo atendimento ao público.
          </p>
        </Section>

        <Section title="6. Condutas proibidas">
          <p>É expressamente proibido:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            <li>Usar a plataforma para lavagem de dinheiro ou qualquer atividade ilícita</li>
            <li>Criar eventos falsos ou enganosos</li>
            <li>Burlar mecanismos de segurança ou verificação de identidade</li>
            <li>Realizar engenharia reversa, scraping ou automações não autorizadas</li>
            <li>Cadastrar dados de terceiros sem autorização</li>
            <li>Publicar conteúdo ofensivo, discriminatório ou que viole direitos de terceiros</li>
          </ul>
          <p className="mt-3">
            Violações podem resultar em suspensão ou encerramento permanente da conta,
            sem prejuízo de medidas legais cabíveis.
          </p>
        </Section>

        <Section title="7. Propriedade intelectual">
          <p>
            Todo o conteúdo da plataforma Nokta Tickets — incluindo logotipo, design,
            código-fonte, textos e funcionalidades — é de propriedade da Nokta ou de
            seus licenciadores. É proibida a reprodução, modificação ou distribuição sem
            autorização prévia por escrito.
          </p>
          <p className="mt-3">
            O produtor garante que detém os direitos sobre o conteúdo que publica na
            plataforma (imagens, textos, nomes de eventos, etc.).
          </p>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            A Nokta não se responsabiliza por:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            <li>Cancelamento, adiamento ou alteração de eventos pelos produtores</li>
            <li>Qualidade, segurança ou organização dos eventos</li>
            <li>Perdas indiretas decorrentes do uso ou impossibilidade de uso da plataforma</li>
            <li>Falhas temporárias de serviço causadas por terceiros (provedores de nuvem, bancos, etc.)</li>
          </ul>
        </Section>

        <Section title="9. Privacidade">
          <p>
            O tratamento dos seus dados pessoais é regido pela nossa{" "}
            <Link href="/privacidade" className="text-violet-600 hover:underline">
              Política de Privacidade
            </Link>
            , em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei
            nº 13.709/2018).
          </p>
        </Section>

        <Section title="10. Suspensão e encerramento de conta">
          <p>
            A Nokta reserva-se o direito de suspender ou encerrar contas que violem estes
            Termos, sem aviso prévio em casos graves (fraude, atividade ilícita). Em
            situações menos graves, você será notificado e terá oportunidade de corrigir
            a conduta.
          </p>
          <p className="mt-3">
            Você pode encerrar sua conta a qualquer momento através das configurações de
            conta. O encerramento não gera direito a reembolso de taxas já processadas.
          </p>
        </Section>

        <Section title="11. Alterações nos termos">
          <p>
            Podemos revisar estes Termos periodicamente. Notificaremos você sobre
            alterações relevantes por e-mail ou por aviso em destaque na plataforma.
            O uso continuado após a publicação das alterações constitui aceite das novas
            condições.
          </p>
        </Section>

        <Section title="12. Lei aplicável e foro">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
            eleito o foro da comarca de São Paulo — SP para dirimir eventuais conflitos
            oriundos deste instrumento, com renúncia expressa a qualquer outro, por mais
            privilegiado que seja.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>Dúvidas sobre estes Termos podem ser enviadas para:</p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm space-y-1">
            <p><strong>Nokta Tickets</strong></p>
            <p>
              E-mail:{" "}
              <a
                href="mailto:suporte@noktatickets.com.br"
                className="text-violet-600 hover:underline"
              >
                suporte@noktatickets.com.br
              </a>
            </p>
          </div>
        </Section>
      </div>

      {/* Footer nav */}
      <div className="mt-16 border-t pt-8 flex flex-wrap gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-800">Página inicial</Link>
        <Link href="/privacidade" className="hover:text-gray-800">Política de Privacidade</Link>
        <a href="mailto:suporte@noktatickets.com.br" className="hover:text-gray-800">
          Contato
        </a>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
