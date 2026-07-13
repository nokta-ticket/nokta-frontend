import Link from "next/link";
import {
  CalendarDays,
  PlusCircle,
  BarChart,
  QrCode,
  DollarSign,
  CreditCard,
} from "lucide-react";

// Opção A: as telas do produtor continuam onde estão (/produtor/*).
// Tickets é um hub que linka para elas — nada do painel do produtor foi movido.
const tools = [
  { label: "Meus Eventos", href: "/produtor/eventos", icon: CalendarDays },
  { label: "Criar Evento", href: "/produtor/eventos/criar", icon: PlusCircle },
  { label: "Métricas", href: "/produtor/metricas", icon: BarChart },
  { label: "Validar Ingressos", href: "/produtor/validar", icon: QrCode },
  { label: "Financeiro do evento", href: "/produtor/financeiro", icon: DollarSign },
  { label: "Dados Financeiros", href: "/produtor/dados-financeiros", icon: CreditCard },
];

export default function TicketsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <p className="mt-2 text-black/60">
        Ferramentas de ingressos. Por enquanto abrem as telas atuais do produtor.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
