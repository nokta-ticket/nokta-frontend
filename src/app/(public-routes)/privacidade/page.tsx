import type { Metadata } from "next";
import { LegalContact, LegalDocument } from "@/components/ui/legal-document";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Saiba como a ${COMPANY.tradeName} coleta, usa e protege seus dados pessoais.`,
};

const LAST_UPDATED = "21 de fevereiro de 2026";

export default function PrivacidadePage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      lastUpdated={LAST_UPDATED}
      intro={
        <>
          <p>
            A <strong>{COMPANY.tradeName}</strong> (&quot;Nokta&quot;, &quot;nós&quot;, &quot;nosso&quot;) tem o compromisso de proteger a privacidade dos seus usuários. Esta Política de Privacidade descreve quais dados coletamos, como os utilizamos, com quem os compartilhamos e quais são os seus direitos.
          </p>
          <p className="mt-3">
            Ao usar nossa plataforma — disponível em <span className="font-medium">noktatickets.com.br</span> — você concorda com os termos desta política.
          </p>
        </>
      }
      related={[
        { label: "Página inicial", href: "/" },
        { label: "Termos de Serviço", href: "/termos" },
        { label: "Política de Cancelamento", href: "/politica-de-cancelamento" },
        { label: "Central de ajuda", href: "/ajuda" },
      ]}
      sections={[
        {
          id: "coleta",
          title: "Dados que coletamos",
          content: (
            <>
              <p>Coletamos informações quando você:</p>
              <ul>
                <li>Cria uma conta (nome, e-mail, CPF, data de nascimento, gênero, telefone)</li>
                <li>Compra ingressos (dados do pedido, valor, ingressos adquiridos)</li>
                <li>Se registra como produtor (nome artístico, CPF/CNPJ, chave PIX)</li>
                <li>Faz login via Google ou Apple (e-mail, nome, foto de perfil conforme permissões)</li>
                <li>Navega na plataforma (endereço IP, dispositivo, navegador, páginas acessadas)</li>
              </ul>
            </>
          ),
        },
        {
          id: "uso",
          title: "Como usamos seus dados",
          content: (
            <ul>
              <li>Processar compras e emitir ingressos</li>
              <li>Verificar sua identidade e prevenir fraudes</li>
              <li>Enviar confirmações, códigos de acesso e comunicações transacionais</li>
              <li>Permitir que produtores gerenciem seus eventos e recebam pagamentos</li>
              <li>Melhorar continuamente a plataforma com base em dados de uso agregados</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          ),
        },
        {
          id: "compartilhamento",
          title: "Compartilhamento de dados",
          content: (
            <>
              <p>Não vendemos seus dados. Compartilhamos informações apenas nas situações a seguir:</p>
              <ul>
                <li>
                  <strong>Produtores de eventos:</strong> seu nome e e-mail podem ser compartilhados com o produtor do evento adquirido para fins de gestão de lista de convidados e controle de acesso.
                </li>
                <li>
                  <strong>Provedores de serviço:</strong> empresas que nos auxiliam na operação da plataforma (processamento de pagamentos, envio de e-mails, hospedagem em nuvem). Todos são contratualmente obrigados a proteger seus dados.
                </li>
                <li>
                  <strong>Autoridades competentes:</strong> quando exigido por lei, ordem judicial ou para prevenir atividades ilegais.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "retencao",
          title: "Retenção de dados",
          content: <p>Mantemos seus dados enquanto sua conta estiver ativa e pelo período mínimo exigido pela legislação brasileira (especialmente o Marco Civil da Internet e a Lei Geral de Proteção de Dados — LGPD). Dados de transações financeiras são mantidos por no mínimo 5 anos.</p>,
        },
        {
          id: "seguranca",
          title: "Segurança",
          content: <p>Adotamos medidas técnicas e organizacionais para proteger suas informações: criptografia em trânsito (TLS/HTTPS), controle de acesso por funções, armazenamento seguro de senhas com hash, monitoramento de atividades suspeitas e revisão manual para ativações de contas de produtores pagos.</p>,
        },
        {
          id: "cookies",
          title: "Cookies e rastreamento",
          content: <p>Utilizamos cookies essenciais para manter sua sessão ativa e cookies analíticos (de forma agregada e anonimizada) para entender como a plataforma é usada. Você pode desativar cookies não essenciais nas configurações do seu navegador.</p>,
        },
        {
          id: "login-social",
          title: "Login social (Google e Apple)",
          content: <p>Ao usar o login com Google ou Apple, recebemos apenas as informações que você autoriza (geralmente nome e e-mail). Não acessamos sua senha nem outros dados das suas contas Google ou Apple. Você pode revogar o acesso a qualquer momento nas configurações do provedor.</p>,
        },
        {
          id: "direitos",
          title: "Seus direitos (LGPD)",
          content: (
            <>
              <p>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
              <ul>
                <li>Confirmar a existência de tratamento dos seus dados</li>
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Revogar o consentimento para tratamento dos seus dados</li>
                <li>Portabilidade dos seus dados a outro fornecedor</li>
              </ul>
              <p>
                Para exercer esses direitos, entre em contato pelo e-mail <a href={`mailto:${COMPANY.emails.privacy}`}>{COMPANY.emails.privacy}</a>.
              </p>
            </>
          ),
        },
        {
          id: "transferencia",
          title: "Transferência internacional de dados",
          content: <p>Nossos serviços de hospedagem e processamento podem estar localizados fora do Brasil. Nestes casos, garantimos que os provedores adotem nível adequado de proteção conforme a LGPD.</p>,
        },
        {
          id: "menores",
          title: "Menores de idade",
          content: <p>Nossa plataforma é destinada a pessoas com 18 anos ou mais. Não coletamos intencionalmente dados de menores. Se identificarmos um cadastro de menor de idade sem autorização dos responsáveis, a conta será encerrada.</p>,
        },
        {
          id: "alteracoes",
          title: "Alterações nesta política",
          content: <p>Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos você por e-mail ou por aviso na plataforma. O uso continuado após a publicação das alterações constitui aceite das novas condições.</p>,
        },
        {
          id: "contato",
          title: "Contato",
          content: <LegalContact intro="Dúvidas sobre privacidade e proteção de dados podem ser enviadas ao Encarregado de Proteção de Dados (DPO):" />,
        },
      ]}
    />
  );
}
