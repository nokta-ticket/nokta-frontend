import Link from "next/link";
import type { Metadata } from "next";
import { LegalContact, LegalDocument } from "@/components/ui/legal-document";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description: `Leia os Termos de Serviço da ${COMPANY.tradeName} antes de usar nossa plataforma.`,
};

const LAST_UPDATED = "21 de fevereiro de 2026";

export default function TermosPage() {
  return (
    <LegalDocument
      title="Termos de Serviço"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          Bem-vindo à <strong>{COMPANY.tradeName}</strong>! Ao acessar ou usar nossa plataforma, disponível em <span className="font-medium">noktatickets.com.br</span>, você concorda com estes Termos de Serviço. Leia-os com atenção antes de prosseguir.
        </p>
      }
      related={[
        { label: "Página inicial", href: "/" },
        { label: "Política de Privacidade", href: "/privacidade" },
        { label: "Política de Cancelamento", href: "/politica-de-cancelamento" },
        { label: "Central de ajuda", href: "/ajuda" },
      ]}
      sections={[
        {
          id: "plataforma",
          title: "Sobre a plataforma",
          content: (
            <>
              <p>A {COMPANY.tradeName} é uma plataforma online de venda, distribuição e gerenciamento de ingressos para eventos. Conectamos produtores de eventos (pessoas físicas ou jurídicas) com compradores (público geral).</p>
              <p>A Nokta atua como intermediária tecnológica. O contrato de venda de ingressos é firmado diretamente entre o produtor do evento e o comprador. A Nokta não é responsável pelo conteúdo, realização, cancelamento ou qualidade dos eventos disponibilizados na plataforma.</p>
            </>
          ),
        },
        {
          id: "cadastro",
          title: "Cadastro e conta",
          content: (
            <ul>
              <li>O cadastro requer informações verdadeiras, precisas e atualizadas. Dados falsos podem resultar em suspensão imediata da conta.</li>
              <li>Você é responsável por manter a confidencialidade da sua senha.</li>
              <li>É permitida apenas uma conta por pessoa física. Contas duplicadas podem ser encerradas.</li>
              <li>Menores de 18 anos devem ter autorização de um responsável legal para utilizar a plataforma.</li>
            </ul>
          ),
        },
        {
          id: "compra",
          title: "Compra de ingressos",
          content: (
            <ul>
              <li>Toda compra é definitiva após a confirmação do pagamento. Reembolsos estão sujeitos à política de cancelamento de cada evento, definida pelo produtor.</li>
              <li>Em caso de cancelamento do evento pelo produtor, a Nokta facilitará o processo de reembolso conforme as regras aplicáveis.</li>
              <li>Ingressos não são transferíveis salvo quando a funcionalidade de transferência estiver disponível na plataforma.</li>
              <li>A revenda de ingressos por valores superiores ao face value (cambismo) é expressamente proibida.</li>
            </ul>
          ),
        },
        {
          id: "taxas",
          title: "Taxas e pagamentos",
          content: (
            <>
              <p>A Nokta cobra uma taxa de serviço sobre cada ingresso vendido. O valor da taxa é exibido claramente no momento da compra. Pagamentos são processados por provedores terceiros certificados e seguros.</p>
              <p>Para produtores: os repasses são realizados via PIX após o evento, descontadas as taxas vigentes. O prazo de repasse é de até 5 dias úteis após a data do evento, salvo disposição contratual distinta.</p>
            </>
          ),
        },
        {
          id: "produtor",
          title: "Contas de produtor",
          content: (
            <>
              <p>Para criar e publicar eventos na Nokta, é necessário ativar uma conta de produtor, sujeita às seguintes regras:</p>
              <ul>
                <li>
                  <strong>Nível 1 (N1):</strong> ativado automaticamente após preenchimento de nome artístico/empresa, telefone e aceite dos termos de produtor. Permite criar eventos gratuitos e rascunhos.
                </li>
                <li>
                  <strong>Nível 2 (N2):</strong> requer verificação de identidade (CPF/CNPJ e chave PIX vinculada) e aprovação pela equipe da Nokta. Permite publicar eventos com ingressos pagos e receber repasses.
                </li>
              </ul>
              <p>O produtor é integralmente responsável pelas informações dos eventos que publicar, pela realização do evento e pelo atendimento ao público.</p>
            </>
          ),
        },
        {
          id: "condutas",
          title: "Condutas proibidas",
          content: (
            <>
              <p>É expressamente proibido:</p>
              <ul>
                <li>Usar a plataforma para lavagem de dinheiro ou qualquer atividade ilícita</li>
                <li>Criar eventos falsos ou enganosos</li>
                <li>Burlar mecanismos de segurança ou verificação de identidade</li>
                <li>Realizar engenharia reversa, scraping ou automações não autorizadas</li>
                <li>Cadastrar dados de terceiros sem autorização</li>
                <li>Publicar conteúdo ofensivo, discriminatório ou que viole direitos de terceiros</li>
              </ul>
              <p>Violações podem resultar em suspensão ou encerramento permanente da conta, sem prejuízo de medidas legais cabíveis.</p>
            </>
          ),
        },
        {
          id: "propriedade",
          title: "Propriedade intelectual",
          content: (
            <>
              <p>Todo o conteúdo da plataforma {COMPANY.tradeName} — incluindo logotipo, design, código-fonte, textos e funcionalidades — é de propriedade da Nokta ou de seus licenciadores. É proibida a reprodução, modificação ou distribuição sem autorização prévia por escrito.</p>
              <p>O produtor garante que detém os direitos sobre o conteúdo que publica na plataforma (imagens, textos, nomes de eventos, etc.).</p>
            </>
          ),
        },
        {
          id: "responsabilidade",
          title: "Limitação de responsabilidade",
          content: (
            <>
              <p>A Nokta não se responsabiliza por:</p>
              <ul>
                <li>Cancelamento, adiamento ou alteração de eventos pelos produtores</li>
                <li>Qualidade, segurança ou organização dos eventos</li>
                <li>Perdas indiretas decorrentes do uso ou impossibilidade de uso da plataforma</li>
                <li>Falhas temporárias de serviço causadas por terceiros (provedores de nuvem, bancos, etc.)</li>
              </ul>
            </>
          ),
        },
        {
          id: "privacidade",
          title: "Privacidade",
          content: (
            <p>
              O tratamento dos seus dados pessoais é regido pela nossa <Link href="/privacidade">Política de Privacidade</Link>, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          ),
        },
        {
          id: "encerramento",
          title: "Suspensão e encerramento de conta",
          content: (
            <>
              <p>A Nokta reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem aviso prévio em casos graves (fraude, atividade ilícita). Em situações menos graves, você será notificado e terá oportunidade de corrigir a conduta.</p>
              <p>Você pode encerrar sua conta a qualquer momento através das configurações de conta. O encerramento não gera direito a reembolso de taxas já processadas.</p>
            </>
          ),
        },
        {
          id: "alteracoes",
          title: "Alterações nos termos",
          content: <p>Podemos revisar estes Termos periodicamente. Notificaremos você sobre alterações relevantes por e-mail ou por aviso em destaque na plataforma. O uso continuado após a publicação das alterações constitui aceite das novas condições.</p>,
        },
        {
          id: "foro",
          title: "Lei aplicável e foro",
          content: <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo — SP para dirimir eventuais conflitos oriundos deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>,
        },
        {
          id: "contato",
          title: "Contato",
          content: <LegalContact intro="Dúvidas sobre estes Termos podem ser enviadas para:" />,
        },
      ]}
    />
  );
}
