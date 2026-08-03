/**
 * Next.js mostra este arquivo automaticamente (via Suspense) enquanto
 * page.tsx (Server Component) está resolvendo o fetch — sem isso, o
 * navegador fica sem receber NADA até o fetch terminar, parecendo travado
 * em vez de "carregando" (mesma lição de /cardapio/[orgSlug] e /avaliacao/[orgSlug]).
 */
export default function Loading() {
  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#e9e9ec] text-sm text-muted-foreground">
      Carregando…
    </main>
  );
}
