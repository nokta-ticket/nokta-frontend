import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/eventos/criar (Fase 5). */
export default function ProdutorEventosCriarLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos/criar" />;
}
