"use client";

import { useEffect } from "react";

/**
 * Liga a revelação das telas (clip-path de baixo para cima, uma vez) e a
 * borda do topo ao rolar. Sem JS ou com movimento reduzido, tudo fica
 * visível desde o início.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.getElementById("institucional-lp");
    if (!root) return;
    const nav = root.querySelector<HTMLElement>("[data-nav]");
    const onScroll = () => nav?.setAttribute("data-scrolled", String(root.scrollTop > 8));
    root.addEventListener("scroll", onScroll, { passive: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => root.removeEventListener("scroll", onScroll);
    }
    root.setAttribute("data-motion", "true");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}
