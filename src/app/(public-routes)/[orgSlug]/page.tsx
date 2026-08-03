import { headers } from "next/headers";
import { UtensilsCrossed } from "lucide-react";
import { getApiBaseUrl } from "@/lib/surfaces";
import type { VenueHomePageData } from "@/services/venue-home-public";
import { VenueHomeView } from "./_components/venue-home-view";

/**
 * Server Component — mesmo padrão de (public-routes)/cardapio/[orgSlug]/page.tsx
 * e (public-routes)/avaliacao/[orgSlug]/page.tsx (fetch no servidor via
 * headers(), cache:"no-store").
 *
 * [orgSlug] na RAIZ de (public-routes): nokta.live/{orgSlug} é a Home do
 * estabelecimento, acessada pelo ícone "Início" do cardápio/avaliação.
 * Rotas estáticas irmãs (login, eventos, institucional etc.) têm
 * precedência no roteamento do Next — sem conflito real.
 */
async function getHomePageData(orgSlug: string): Promise<VenueHomePageData | null> {
  const host = (await headers()).get("host");
  const apiBaseUrl = getApiBaseUrl(host);

  try {
    const res = await fetch(`${apiBaseUrl}/inicio-publica/${orgSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as VenueHomePageData;
  } catch {
    return null;
  }
}

export default async function VenueHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = await getHomePageData(orgSlug);

  if (!data) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#f4f4f6] px-6 text-center">
        <UtensilsCrossed size={40} className="text-black/20" />
        <h1 className="font-poppins text-xl font-semibold text-foreground">Estabelecimento não encontrado</h1>
        <p className="max-w-xs text-sm text-muted-foreground">Verifique o link e tente novamente.</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <VenueHomeView data={data} orgSlug={orgSlug} />
    </main>
  );
}
