"use client";

import { useEffect, useState } from "react";

const BAR_SELECTOR = "[data-fixed-bottom-purchase-bar]";

/**
 * Reserva, DEPOIS do footer no documento, o mesmo espaço vertical ocupado
 * por uma barra `position: fixed` na parte inferior da tela (ex.: a barra
 * de compra da página pública de evento) — sem precisar acoplar este
 * arquivo (RootLayout) a nenhuma rota específica.
 *
 * Por que isto não pode viver dentro da própria página (como padding-bottom
 * no <main> dela): ao rolar até o fim de verdade, o navegador sempre alinha
 * a borda inferior do ÚLTIMO elemento do documento com a borda inferior da
 * viewport — nenhuma quantidade de padding ANTES do footer muda isso
 * (confirmado por medição real: um <main> com padding-bottom igual à altura
 * da barra ainda termina com o footer coberto por ela). Só um espaço real
 * DEPOIS do footer resolve — e o footer é renderizado pelo RootLayout, fora
 * da árvore de qualquer página individual.
 *
 * Nenhuma rota decide nada aqui: qualquer página que precise deste
 * comportamento só marca sua barra fixa com `data-fixed-bottom-purchase-bar`
 * — este componente descobre a barra via MutationObserver (ela monta/
 * desmonta com a navegação e com o estado da própria página, ex.:
 * `tickets.length > 0`) e mede a altura real via ResizeObserver (o
 * conteúdo da barra varia — cupom aberto, total selecionado — então uma
 * altura fixa chutada sempre erraria pra mais ou pra menos).
 */
export default function FixedBottomBarSpacer() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let observedEl: Element | null = null;

    function attachTo(el: Element) {
      if (observedEl === el) return;
      resizeObserver?.disconnect();
      observedEl = el;
      resizeObserver = new ResizeObserver(([entry]) => {
        setHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
      });
      resizeObserver.observe(el);
    }

    function detach() {
      resizeObserver?.disconnect();
      resizeObserver = null;
      observedEl = null;
      setHeight(0);
    }

    function sync() {
      const el = document.querySelector(BAR_SELECTOR);
      if (el) attachTo(el);
      else detach();
    }

    sync();

    // A barra é montada/desmontada pela própria página (ex.: só existe
    // quando `tickets.length > 0`) — precisa reagir a isso, não só a
    // mudanças de tamanho de uma barra já existente.
    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  if (height === 0) return null;

  return <div aria-hidden style={{ height: `${height}px` }} className="lg:hidden" />;
}
