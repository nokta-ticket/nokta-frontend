import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — o painel do produtor foi unificado em /dashboard (Fase 5). */
export default function ProdutorRootPage() {
  return <RouteRedirect to="/dashboard/eventos" />;
}
