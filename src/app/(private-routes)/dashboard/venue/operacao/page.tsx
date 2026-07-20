import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/operacao (Fase 4). */
export default function VenueOperacaoLegacyPage() {
  return <RouteRedirect to="/dashboard/operacao" />;
}
