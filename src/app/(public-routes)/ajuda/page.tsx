import { Metadata } from "next";
import CentralDeAjuda from "./_components/central-de-ajuda";

export const metadata: Metadata = {
  title: "Central de Ajuda | Nokta Tickets",
  description:
    "Encontre respostas para as dúvidas mais comuns sobre ingressos, eventos, pagamento e conta, ou fale com a nossa equipe.",
};

export default function AjudaPage() {
  return <CentralDeAjuda />;
}
