import { RouteRedirect } from "../_components/route-redirect";

/** Rota canônica de Operação — reaproveita /dashboard/venue/operacao (mesas, comandas, pedidos, caixa). */
export default function OperacaoPage() {
  return <RouteRedirect to="/dashboard/venue/operacao" />;
}
