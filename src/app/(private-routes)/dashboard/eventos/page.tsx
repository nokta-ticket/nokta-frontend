import Link from "next/link";
import {
  CalendarDays,
  PlusCircle,
  BarChart,
  QrCode,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";

// As telas do produtor continuam em /produtor/* (intactas). Eventos é um hub
// que linka para elas.
const tools = [
  { label: "Meus Eventos", href: "/produtor/eventos", icon: CalendarDays },
  { label: "Criar Evento", href: "/produtor/eventos/criar", icon: PlusCircle },
  { label: "Métricas", href: "/produtor/metricas", icon: BarChart },
  { label: "Validar Ingressos", href: "/produtor/validar", icon: QrCode },
  { label: "Financeiro do evento", href: "/produtor/financeiro", icon: DollarSign },
  { label: "Dados Financeiros", href: "/produtor/dados-financeiros", icon: CreditCard },
];

export default function TicketsEventosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Eventos"
        description="Gestão de eventos e ingressos. As telas atuais do produtor abrem aqui."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 transition hover:border-violet-400 hover:shadow-sm"
          >
            <Icon className="text-violet-600" size={22} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
