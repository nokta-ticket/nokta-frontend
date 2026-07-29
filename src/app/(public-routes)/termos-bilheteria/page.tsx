import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Bilheteria | Nokta Tickets",
  description:
    "Termos específicos para produtores que operam venda de ingressos (bilheteria) na Nokta Tickets.",
};

export default function TermosBilheteriaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-700">
      <div className="mb-10 border-b pb-8">
        <p className="mb-2 text-sm font-medium text-violet-600 uppercase tracking-wide">
          Nokta Tickets
        </p>
        <h1 className="text-4xl font-extrabold text-gray-900">
          Termos de Bilheteria
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Esta página está em construção. O conteúdo completo dos Termos de Bilheteria será publicado em breve.
        </p>
      </div>

      <div className="space-y-10 text-[15px] leading-7">
        <p>
          Estes termos regem especificamente a operação de venda, distribuição e gestão de
          ingressos (bilheteria) por produtores na plataforma Nokta Tickets, complementando os{" "}
          <Link href="/termos" className="font-medium text-violet-700 underline">
            Termos de Serviço
          </Link>{" "}
          gerais da plataforma.
        </p>
      </div>

      <div className="mt-16 border-t pt-8 flex flex-wrap gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-800">Página inicial</Link>
        <Link href="/termos" className="hover:text-gray-800">Termos de Serviço</Link>
        <Link href="/politica-de-cancelamento" className="hover:text-gray-800">Política de Cancelamentos</Link>
        <a href="mailto:suporte@noktatickets.com.br" className="hover:text-gray-800">
          Contato
        </a>
      </div>
    </main>
  );
}
