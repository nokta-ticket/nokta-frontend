import { RouteRedirect } from "../_components/route-redirect";

/** Cobre também Produtos e Adicionais — abas dentro de Cardápio, não páginas próprias. */
export default function CardapioPage() {
  return <RouteRedirect to="/dashboard/venue/cardapio" />;
}
