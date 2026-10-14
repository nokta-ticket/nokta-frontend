import { headers } from "next/headers";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchVenuePublic } from "@/components/venue-menu/public-fetch";
import type { PublicMenuResponse } from "@/services/venue-menu-public";
import { PublicMenuView } from "./_components/public-menu-view";

/**
 * Server Component — busca o cardápio no servidor (nunca client-side puro,
 * que adicionava um round-trip inteiro antes de mostrar qualquer coisa). Sem
 * visitorToken aqui (não existe localStorage no servidor): favoritedByVisitor
 * chega false e o client corrige em segundo plano. `headers()` torna só esta
 * rota dinâmica. A rota é "chromeless" no shell público — a página só
 * renderiza o conteúdo, sem cobrir nada com overlay fixo.
 */
export default async function CardapioPublicoPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const host = (await headers()).get("host");
  const data = await fetchVenuePublic<PublicMenuResponse>(host, `/cardapio-publico/${orgSlug}`);

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
        <EmptyState icon="utensils" title="Cardápio ainda não disponível" description="Este estabelecimento ainda não publicou um cardápio público." className="w-full max-w-md" />
      </main>
    );
  }

  return (
    <main>
      <PublicMenuView initialData={data} orgSlug={orgSlug} />
    </main>
  );
}
