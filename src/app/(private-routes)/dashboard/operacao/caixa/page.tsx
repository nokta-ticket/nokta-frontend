import { RouteRedirect } from "../../_components/route-redirect";

/** Cobre também Pagamentos — não existe aba própria, pagamentos de comanda são registrados dentro de Caixa. */
export default function OperacaoCaixaPage() {
  return <RouteRedirect to="/dashboard/operacao?tab=caixa" />;
}
