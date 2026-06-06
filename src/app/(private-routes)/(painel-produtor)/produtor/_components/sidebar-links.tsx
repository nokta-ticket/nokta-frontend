import { BarChart, Briefcase, Home, Users, DollarSign, CreditCard } from "lucide-react";
import { ReactNode } from "react";

export type SidebarLink = {
  label: string;
  icon: ReactNode;
  href: string;
};

export const sidebarLinks: SidebarLink[] = [
  {
    label: "Métricas",
    icon: <BarChart size={16} />,
    href: "/produtor/metricas",
  },
  {
    label: "Meus Eventos",
    icon: <Home size={16} />,
    href: "/produtor/eventos",
  },
  {
    label: "Criar Evento",
    icon: <Users size={16} />,
    href: "/produtor/eventos/criar",
  },
  {
    label: "Validar Ingressos",
    icon: <Briefcase size={16} />,
    href: "/produtor/validar",
  },
  {
    label: "Financeiro",
    icon: <DollarSign size={16} />,
    href: "/produtor/financeiro",
  },
  {
    label: "Dados Financeiros",
    icon: <CreditCard size={16} />,
    href: "/produtor/dados-financeiros",
  },
];
