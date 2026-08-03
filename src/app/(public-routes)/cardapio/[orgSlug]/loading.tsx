/**
 * Next.js mostra este arquivo automaticamente (via Suspense) enquanto
 * page.tsx (Server Component, ver comentário lá) está resolvendo o fetch
 * do cardápio — sem isso, o navegador fica sem receber NADA (nem o
 * <body>) até o fetch terminar, e a página parece travada/não abrir em
 * vez de "carregando". Mesmo visual de loading que a página antiga
 * (client-side) já usava.
 */
export default function Loading() {
  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#e9e9ec] text-sm text-muted-foreground">
      Carregando cardápio…
    </main>
  );
}
