import { RouteRedirect } from "../../_components/route-redirect";

/** Operação virou uma única tela unificada — não existe mais aba "Mesas" separada. */
export default function OperacaoMesasPage() {
  return <RouteRedirect to="/dashboard/operacao" />;
}
