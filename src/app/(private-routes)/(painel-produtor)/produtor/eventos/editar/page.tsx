import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — rota órfã do fluxo legado (nada mais linka aqui); mantida como redirect por segurança. */
export default function ProdutorEventosEditarLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos" />;
}
