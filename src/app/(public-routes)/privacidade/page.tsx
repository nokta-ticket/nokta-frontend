import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Nokta Tickets",
  description:
    "Saiba como a Nokta Tickets coleta, usa e protege seus dados pessoais.",
};

const LAST_UPDATED = "21 de fevereiro de 2026";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      {/* Header */}
      <div className="mb-10 border-b pb-8">
        <p className="mb-2 text-sm font-medium text-violet-600 uppercase tracking-wide">
          Nokta Tickets
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Última atualização: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-10 text-[15px] leading-7">
        <section>
          <p>
            A <strong>Nokta Tickets</strong> ("Nokta", "nós", "nosso") tem o compromisso
            de proteger a privacidade dos seus usuários. Esta Política de Privacidade
            descreve quais dados coletamos, como os utilizamos, com quem os compartilhamos
            e quais são os seus direitos.
          </p>
          <p className="mt-3">
            Ao usar nossa plataforma — disponível em{" "}
            <span className="font-medium">noktatickets.com.br</span> — você concorda
            com os termos desta política.
          </p>
        </section>

        <Section title="1. Dados que coletamos">
          <p>Coletamos informações quando você:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            <li>Cria uma conta (nome, e-mail, CPF, data de nascimento, gênero, telefone)</li>
            <li>Compra ingressos (dados do pedido, valor, ingressos adquiridos)</li>
            <li>Se registra como produtor (nome artístico, CPF/CNPJ, chave PIX)</li>
            <li>Faz login via Google ou Apple (e-mail, nome, foto de perfil conforme permissões)</li>
            <li>Navega na plataforma (endereço IP, dispositivo, navegador, páginas acessadas)</li>
          </ul>
        </Section>

        <Section title="2. Como usamos seus dados">
          <ul className="list-disc pl-6 space-y-1">
            <li>Processar compras e emitir ingressos</li>
            <li>Verificar sua identidade e prevenir fraudes</li>
            <li>Enviar confirmações, códigos de acesso e comunicações transacionais</li>
            <li>Permitir que produtores gerenciem seus eventos e recebam pagamentos</li>
            <li>Melhorar continuamente a plataforma com base em dados de uso agregados</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </Section>

        <Section title="3. Compartilhamento de dados">
          <p>Não vendemos seus dados. Compartilhamos informações apenas nas situações a seguir:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            <li>
              <strong>Produtores de eventos:</strong> seu nome e e-mail podem ser
              compartilhados com o produtor do evento adquirido para fins de gestão de
              lista de convidados e controle de acesso.
            </li>
            <li>
              <strong>Provedores de serviço:</strong> empresas que nos auxiliam na
              operação da plataforma (processamento de pagamentos, envio de e-mails,
              hospedagem em nuvem). Todos são contratualmente obrigados a proteger seus dados.
            </li>
            <li>
              <strong>Autoridades competentes:</strong> quando exigido por lei, ordem
              judicial ou para prevenir atividades ilegais.
            </li>
          </ul>
        </Section>

        <Section title="4. Retenção de dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa e pelo período mínimo
            exigido pela legislação brasileira (especialmente o Marco Civil da Internet e
            a Lei Geral de Proteção de Dados — LGPD). Dados de transações financeiras
            são mantidos por no mínimo 5 anos.
          </p>
        </Section>

        <Section title="5. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger suas informações:
            criptografia em trânsito (TLS/HTTPS), controle de acesso por funções,
            armazenamento seguro de senhas com hash, monitoramento de atividades suspeitas
            e revisão manual para ativações de contas de produtores pagos.
          </p>
        </Section>

        <Section title="6. Cookies e rastreamento">
          <p>
            Utilizamos cookies essenciais para manter sua sessão ativa e cookies analíticos
            (de forma agregada e anonimizada) para entender como a plataforma é usada.
            Você pode desativar cookies não essenciais nas configurações do seu navegador.
          </p>
        </Section>

        <Section title="7. Login social (Google e Apple)">
          <p>
            Ao usar o login com Google ou Apple, recebemos apenas as informações que você
            autoriza (geralmente nome e e-mail). Não acessamos sua senha nem outros dados
            das suas contas Google ou Apple. Você pode revogar o acesso a qualquer momento
            nas configurações do provedor.
          </p>
        </Section>

        <Section title="8. Seus direitos (LGPD)">
          <p>
            Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem
            direito a:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Revogar o consentimento para tratamento dos seus dados</li>
            <li>Portabilidade dos seus dados a outro fornecedor</li>
          </ul>
          <p className="mt-3">
            Para exercer esses direitos, entre em contato pelo e-mail{" "}
            <a
              href="mailto:privacidade@noktatickets.com.br"
              className="text-violet-600 hover:underline"
            >
              privacidade@noktatickets.com.br
            </a>
            .
          </p>
        </Section>

        <Section title="9. Transferência internacional de dados">
          <p>
            Nossos serviços de hospedagem e processamento podem estar localizados fora do
            Brasil. Nestes casos, garantimos que os provedores adotem nível adequado de
            proteção conforme a LGPD.
          </p>
        </Section>

        <Section title="10. Menores de idade">
          <p>
            Nossa plataforma é destinada a pessoas com 18 anos ou mais. Não coletamos
            intencionalmente dados de menores. Se identificarmos um cadastro de menor de
            idade sem autorização dos responsáveis, a conta será encerrada.
          </p>
        </Section>

        <Section title="11. Alterações nesta política">
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Quando houver
            alterações relevantes, notificaremos você por e-mail ou por aviso na plataforma.
            O uso continuado após a publicação das alterações constitui aceite das novas
            condições.
          </p>
        </Section>

        <Section title="12. Contato">
          <p>
            Dúvidas sobre privacidade e proteção de dados podem ser enviadas para:
          </p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm space-y-1">
            <p><strong>Nokta Tickets</strong></p>
            <p>Encarregado de Proteção de Dados (DPO)</p>
            <p>
              E-mail:{" "}
              <a
                href="mailto:privacidade@noktatickets.com.br"
                className="text-violet-600 hover:underline"
              >
                privacidade@noktatickets.com.br
              </a>
            </p>
          </div>
        </Section>
      </div>

      {/* Footer nav */}
      <div className="mt-16 border-t pt-8 flex flex-wrap gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-800">Página inicial</Link>
        <Link href="/termos" className="hover:text-gray-800">Termos de Serviço</Link>
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
