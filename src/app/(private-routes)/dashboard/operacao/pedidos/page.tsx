import { RouteRedirect } from "../../_components/route-redirect";

/** Cobre também Preparo — não existe aba própria, o status de preparo é acompanhado dentro de Pedidos. */
export default function OperacaoPedidosPage() {
  return <RouteRedirect to="/dashboard/venue/operacao?tab=pedidos" />;
}
