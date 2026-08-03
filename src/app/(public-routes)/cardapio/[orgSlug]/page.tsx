import { headers } from "next/headers";
import { UtensilsCrossed } from "lucide-react";
import { getApiBaseUrl } from "@/lib/surfaces";
import type { PublicMenuResponse } from "@/services/venue-menu-public";
import { PublicMenuView } from "./_components/public-menu-view";

/**
 * Server Component — busca o cardápio já no servidor (nunca client-side
 * puro como antes). A versão anterior era "use client" com useEffect
 * disparando o fetch só depois de baixar JS + hidratar, adicionando um
 * round-trip inteiro de rede antes de mostrar qualquer coisa (sentido pelo
 * usuário como "Carregando cardápio…" mesmo o cardápio sendo leve — o
 * gargalo era a arquitetura, não o tamanho dos dados). Sem visitorToken
 * aqui (não existe localStorage no servidor) — o backend já trata
 * visitorToken como opcional (favoritedByVisitor vem false); o client
 * (PublicMenuView) aplica o token real só na hora de favoritar.
 *
 * `headers()` torna esta rota dinâmica (sem cache estático) — mas ela já
 * era dinâmica na prática (depende do orgSlug real + dados de rede), e o
 * Root Layout deliberadamente NÃO usa headers() pra não forçar as outras
 * superfícies (institucional etc.) a perderem cache — ver comentário lá.
 * Escopo aqui é só esta rota.
 */
async function getPublicMenu(orgSlug: string): Promise<PublicMenuResponse | null> {
  const host = (await headers()).get("host");
  const apiBaseUrl = getApiBaseUrl(host);

  try {
    const res = await fetch(`${apiBaseUrl}/cardapio-publico/${orgSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicMenuResponse;
  } catch {
    return null;
  }
}

export default async function CardapioPublicoPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = await getPublicMenu(orgSlug);

  // A página pública nunca deve mostrar o header/footer do site de
  // ingressos (herdados do Root Layout, compartilhado pelas 3 superfícies —
  // ver comentário em app/layout.tsx) — mesmo padrão de cobertura "fixed
  // inset-0 z-50" já usado pela landing institucional.
  if (!data) {
    return (
      <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#e9e9ec] px-6 text-center">
        <UtensilsCrossed size={40} className="text-black/20" />
        <h1 className="font-poppins text-xl font-semibold text-foreground">Cardápio ainda não disponível</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Este estabelecimento ainda não publicou um cardápio público.
        </p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto">
      <PublicMenuView initialData={data} orgSlug={orgSlug} />
    </main>
  );
}
