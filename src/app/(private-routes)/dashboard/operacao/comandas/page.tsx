import { RouteRedirect } from "../../_components/route-redirect";

/** Operação virou uma única tela unificada — não existe mais aba "Comandas" separada. */
export default function OperacaoComandasPage() {
  return <RouteRedirect to="/dashboard/operacao" />;
}
