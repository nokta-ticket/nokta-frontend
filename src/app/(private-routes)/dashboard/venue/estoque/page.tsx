import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/estoque (Fase 4). */
export default function VenueEstoqueLegacyPage() {
  return <RouteRedirect to="/dashboard/estoque" />;
}
