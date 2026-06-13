import {
  BarChart2,
  ClipboardCheck,
  LayoutList,
  ScrollText,
  Star,
  Ticket,
  Users
} from "lucide-react";
import { ReactNode } from "react";

export type SidebarLink = {
  label: string;
  icon: ReactNode;
  href: string;
};

export const sidebarLinks: SidebarLink[] = [
  {
    label: "Dashboard",
    icon: <BarChart2 size={16} />,
    href: "/admin/dashboard",
  },
  {
    label: "Usuários",
    icon: <Users size={16} />,
    href: "/admin/usuarios",
  },
  {
    label: "Ingressos",
    icon: <Ticket size={16} />,
    href: "/admin/ingressos",
  },
  {
    label: "Eventos",
    icon: <LayoutList size={16} />,
    href: "/admin/eventos",
  },
  {
    label: "Pedidos de Produtor",
    icon: <ClipboardCheck size={16} />,
    href: "/admin/pedidos-produtor",
  },
  {
    label: "Eventos em Destaque",
    icon: <Star size={16} />,
    href: "/admin/eventos/destaques",
  },
  {
    label: "Auditoria",
    icon: <ScrollText size={16} />,
    href: "/admin/auditoria",
  },
];
