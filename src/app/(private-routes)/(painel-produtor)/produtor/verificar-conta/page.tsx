import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/eventos/verificar-conta (Fase 5). */
export default function ProdutorVerificarContaLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos/verificar-conta" />;
}
