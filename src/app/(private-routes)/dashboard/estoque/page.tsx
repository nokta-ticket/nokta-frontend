import { RouteRedirect } from "../_components/route-redirect";

/** Cobre também Compras e Fornecedores — abas dentro de Estoque, não páginas próprias. */
export default function EstoquePage() {
  return <RouteRedirect to="/dashboard/venue/estoque" />;
}
