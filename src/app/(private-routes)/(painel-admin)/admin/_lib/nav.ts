import type { IconName } from "@/components/ui/icon";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: IconName;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

/** Menu do painel administrativo, agrupado por assunto. Fonte única do título da topbar também. */
export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "Visão geral", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "chart-line" }] },
  {
    title: "Pessoas",
    items: [
      { label: "Usuários", href: "/admin/usuarios", icon: "users" },
      { label: "Equipe", href: "/admin/equipe", icon: "user-shield" },
      { label: "Contas excluídas", href: "/admin/contas-excluidas", icon: "history" },
    ],
  },
  {
    title: "Operação",
    items: [
      { label: "Workspaces", href: "/admin/workspaces", icon: "building" },
      { label: "Eventos", href: "/admin/eventos", icon: "calendar" },
      { label: "Eventos em destaque", href: "/admin/eventos/destaques", icon: "star" },
      { label: "Ingressos", href: "/admin/ingressos", icon: "ticket" },
      { label: "Pedidos de produtor", href: "/admin/pedidos-produtor", icon: "clipboard-check" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Jurídico e financeiro", href: "/admin/juridico-financeiro", icon: "scale" },
      { label: "Taxas do gateway", href: "/admin/taxas-gateway", icon: "percent" },
      { label: "Adquirentes", href: "/admin/adquirentes", icon: "credit-card" },
    ],
  },
  {
    title: "Segurança",
    items: [
      { label: "Auditoria", href: "/admin/auditoria", icon: "file-lines" },
      { label: "Nokta Protect", href: "/admin/evidencias", icon: "shield" },
      { label: "Segurança", href: "/admin/seguranca", icon: "lock" },
    ],
  },
];

const ALL_ITEMS = ADMIN_NAV.flatMap((g) => g.items);

/** Item ativo = o de href mais longo que prefixa o caminho ("/admin/eventos/destaques" não acende "Eventos"). */
export function activeNavItem(pathname: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;
  for (const item of ALL_ITEMS) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }
  return best;
}
