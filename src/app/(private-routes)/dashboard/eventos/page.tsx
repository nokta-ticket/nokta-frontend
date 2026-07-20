import { RouteRedirect } from "../_components/route-redirect";

/**
 * Rota canônica de Eventos. Reaproveita a implementação existente em
 * /dashboard/tickets/eventos (mesmo motivo do Financeiro/Insights — ver
 * docs/platform/unified-navigation.md). Cobre também Tipos de ingresso,
 * Lotes, Check-in e Convidados, que ainda não têm tela própria no
 * dashboard multi-tenant.
 */
export default function EventosPage() {
  return <RouteRedirect to="/dashboard/tickets/eventos" />;
}
