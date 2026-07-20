import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/cardapio (Fase 4). */
export default function VenueCardapioLegacyPage() {
  return <RouteRedirect to="/dashboard/cardapio" />;
}
