"use client";

/**
 * Preview real do cardápio — carrega a mesma renderização (MenuView) da
 * página pública dentro de um `<iframe>`, dentro de um bezel de celular
 * navegável. Nunca uma segunda implementação visual: qualquer mudança de
 * cor, layout ou regra do cardápio público aparece aqui automaticamente,
 * porque o iframe carrega o mesmo componente compilado.
 *
 * 2026-08-13: era um `transform: scale()` direto (renderiza o MenuView em
 * 390px de largura real, escala visualmente pra caber nos ~278px do bezel)
 * — abordagem quebrada porque os breakpoints Tailwind (`md:`/`lg:`, ~40
 * ocorrências dentro de MenuView) reagem à largura REAL da janela do
 * navegador, não à largura visual pós-escala. Numa janela de desktop larga,
 * isso disparava estilos de desktop (avatar maior, paddings maiores,
 * max-width maior) dentro de uma área visual de ~278px, deixando tudo
 * "espremido"/truncado — relatado pelo usuário com print comparando o
 * cardápio ao vivo (celular real) vs o preview (visivelmente diferente,
 * nome da org truncado, categorias mais apertadas). Um `<iframe>` tem sua
 * PRÓPRIA janela de renderização com a largura que `width` define de
 * verdade — os breakpoints passam a reagir a essa largura real, igual um
 * celular de verdade, resolvendo o problema pela raiz em vez de tentar
 * compensar visualmente.
 *
 * Funciona para cardápio DRAFT ou PUBLISHED — o preview não exige
 * publicação (ver VenueMenuPublicService.getMenuPreview no backend). O
 * iframe recarrega (`key`) sempre que orgId/menuId mudam; atualização após
 * salvar um produto/categoria específico ainda depende de um reload manual
 * do iframe (sem invalidação cross-document de React Query) — trade-off
 * aceito pela correção de fidelidade visual, que é o problema relatado.
 *
 * Bezel em até ~390px de largura interna (era fixo em 300px/~278px útil):
 * sem escala visual, o conteúdo renderiza no tamanho de fonte/padding real
 * (px fixos, feitos pra celular de verdade) — um bezel menor deixaria tudo
 * com mais quebra de linha que um celular real só por falta de espaço
 * físico, não por bug. `w-full max-w-[412px]` (não um `w-[412px]` fixo)
 * porque este mesmo componente é montado em 2 lugares com espaço diferente
 * (ver cardapio/page.tsx): o painel `xl:` (≥1280px) tem sobra de espaço
 * pro tamanho máximo; o Sheet mobile (`sm:max-w-sm`, ~352px de área útil
 * com padding) precisa encolher, senão o bezel de 412px+22px de borda
 * estouraria a largura do Sheet.
 */
export function MenuPreviewPhone({ orgId, menuId }: { orgId: number | null; menuId: number | null }) {
  if (orgId === null || menuId === null) return null;

  return (
    <div className="relative mx-auto w-full max-w-[412px] rounded-[48px] border-[11px] border-[#0c0c0f] bg-[#0c0c0f] shadow-[0_40px_70px_rgba(20,20,40,.22),0_12px_24px_rgba(20,20,40,.12)]">
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-[25px] w-[92px] -translate-x-1/2 rounded-b-[14px] bg-[#0c0c0f]" />
      <iframe
        key={`${orgId}-${menuId}`}
        src={`/cardapio-preview/${orgId}/${menuId}`}
        title="Preview do cardápio"
        className="relative h-[750px] w-full rounded-[38px] border-0 bg-[#e9e9ec]"
      />
    </div>
  );
}
