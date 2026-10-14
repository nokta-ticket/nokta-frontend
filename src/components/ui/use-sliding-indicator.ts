"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export interface IndicatorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Mede o item ativo dentro de um container (`position: relative`) pra
 * desenhar um indicador que DESLIZA entre itens (abas, nav inferior).
 * Usa offsetLeft/offsetTop: dentro de um container com scroll horizontal o
 * indicador acompanha o conteúdo sem recalcular no scroll. Recalcula quando
 * o item ativo muda (MutationObserver nos atributos) e em resize.
 *
 * `rect` fica null até a primeira medida — quem usa mantém o estilo estático
 * do item ativo até lá (SSR/sem JS continua correto).
 */
export function useSlidingIndicator<T extends HTMLElement>(activeSelector: string, deps: unknown[] = []): { ref: RefObject<T | null>; rect: IndicatorRect | null; animate: boolean } {
  const ref = useRef<T | null>(null);
  const [rect, setRect] = useState<IndicatorRect | null>(null);
  // Primeira medida aparece sem transição (sem "voar" do canto na montagem).
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const container = ref.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(activeSelector);
    if (!active) {
      setRect(null);
      return;
    }
    setRect((prev) => {
      const next = { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight };
      if (prev && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height) return prev;
      return next;
    });
  }, [activeSelector]);

  useIsoLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => setAnimate(true));
    const mo = new MutationObserver(measure);
    mo.observe(container, { attributes: true, subtree: true, attributeFilter: ["data-state", "aria-current", "aria-selected", "aria-checked"] });
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener("resize", measure);
    // Fontes web mudam a largura dos rótulos depois do primeiro paint.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return { ref, rect, animate };
}
