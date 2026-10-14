import { headers } from "next/headers";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchVenuePublic } from "@/components/venue-menu/public-fetch";
import type { VenueHomePageData } from "@/services/venue-home-public";
import { VenueHomeView } from "./_components/venue-home-view";

/**
 * Home pública do estabelecimento (nokta.live/{orgSlug}) — Server Component,
 * mesmo padrão de /cardapio/[orgSlug]. [orgSlug] fica na raiz de
 * (public-routes); rotas estáticas irmãs têm precedência no roteamento.
 */
export default async function VenueHomePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const host = (await headers()).get("host");
  const data = await fetchVenuePublic<VenueHomePageData>(host, `/inicio-publica/${orgSlug}`);

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
        <EmptyState icon="store" title="Estabelecimento não encontrado" description="Confere o link e tenta de novo." className="w-full max-w-md" />
      </main>
    );
  }

  return (
    <main>
      <VenueHomeView data={data} orgSlug={orgSlug} />
    </main>
  );
}
