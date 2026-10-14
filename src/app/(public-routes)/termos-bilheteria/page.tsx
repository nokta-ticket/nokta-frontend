import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/callout";
import { LegalContact, LegalDocument } from "@/components/ui/legal-document";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Termos de Bilheteria",
  description: `Termos específicos para produtores que operam venda de ingressos (bilheteria) na ${COMPANY.tradeName}.`,
};

export default function TermosBilheteriaPage() {
  return (
    <LegalDocument
      title="Termos de Bilheteria"
      intro={
        <Callout tone="warning" title="Página em construção">
          O conteúdo completo dos Termos de Bilheteria será publicado em breve.
        </Callout>
      }
      related={[
        { label: "Página inicial", href: "/" },
        { label: "Termos de Serviço", href: "/termos" },
        { label: "Política de Cancelamento", href: "/politica-de-cancelamento" },
      ]}
      sections={[
        {
          id: "escopo",
          title: "Escopo",
          content: (
            <p>
              Estes termos regem especificamente a operação de venda, distribuição e gestão de ingressos (bilheteria) por produtores na plataforma {COMPANY.tradeName}, complementando os <Link href="/termos">Termos de Serviço</Link> gerais da plataforma.
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
