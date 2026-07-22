import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/check-in (Fase 5). */
export default function ProdutorValidarLegacyPage() {
  return <RouteRedirect to="/dashboard/check-in" />;
}
