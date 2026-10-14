import type { Metadata } from "next";
import CentralDeAjuda from "./_components/central-de-ajuda";

export const metadata: Metadata = {
  title: "Central de ajuda",
  description: "Respostas pras dúvidas mais comuns sobre ingressos, pagamento, conta e produção de eventos — ou fala com a nossa equipe.",
};

export default function AjudaPage() {
  return <CentralDeAjuda />;
}
