import { headers } from "next/headers";
import { UtensilsCrossed } from "lucide-react";
import { getApiBaseUrl } from "@/lib/surfaces";
import type { VenueReviewPageData } from "@/services/venue-review-public";
import { AvaliacaoFormView } from "./_components/avaliacao-form-view";

/**
 * Server Component — mesmo padrão de (public-routes)/cardapio/[orgSlug]/page.tsx
 * (busca no servidor via fetch com host resolvido por headers(), nunca
 * client-side puro — evita o round-trip extra de "baixar JS → hidratar →
 * só então buscar dado" sentido como delay no cardápio, ver histórico).
 */
async function getReviewPageData(orgSlug: string): Promise<VenueReviewPageData | null> {
  const host = (await headers()).get("host");
  const apiBaseUrl = getApiBaseUrl(host);

  try {
    const res = await fetch(`${apiBaseUrl}/avaliacao-publica/${orgSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as VenueReviewPageData;
  } catch {
    return null;
  }
}

export default async function AvaliacaoPublicaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = await getReviewPageData(orgSlug);

  if (!data) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#faf9fb] px-6 text-center">
        <UtensilsCrossed size={40} className="text-black/20" />
        <h1 className="font-poppins text-xl font-semibold text-foreground">Estabelecimento não encontrado</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Verifique o link e tente novamente.
        </p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <AvaliacaoFormView initialData={data} orgSlug={orgSlug} />
    </main>
  );
}
