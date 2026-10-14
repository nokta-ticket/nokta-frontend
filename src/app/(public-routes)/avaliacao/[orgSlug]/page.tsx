import { headers } from "next/headers";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchVenuePublic } from "@/components/venue-menu/public-fetch";
import type { VenueReviewPageData } from "@/services/venue-review-public";
import { AvaliacaoFormView } from "./_components/avaliacao-form-view";

/** Server Component — mesmo padrão de /cardapio/[orgSlug] (fetch no servidor, rota chromeless). */
export default async function AvaliacaoPublicaPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const host = (await headers()).get("host");
  const data = await fetchVenuePublic<VenueReviewPageData>(host, `/avaliacao-publica/${orgSlug}`);

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
        <EmptyState icon="store" title="Estabelecimento não encontrado" description="Confere o link e tenta de novo." className="w-full max-w-md" />
      </main>
    );
  }

  return (
    <main>
      <AvaliacaoFormView initialData={data} orgSlug={orgSlug} />
    </main>
  );
}
