"use client";

import { useEffect } from "react";

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function renderStat(el: HTMLElement, value: number) {
  const decimals = Number(el.dataset.decimals || 0);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const emph = el.dataset.emph;
  const num = formatNumber(value, decimals);
  const p = emph === "prefix" && prefix ? `<em>${prefix}</em>` : prefix;
  const s = emph === "suffix" && suffix ? `<em>${suffix}</em>` : suffix;
  el.innerHTML = p + num + s;
}

function countUp(el: HTMLElement, reduceMotion: boolean) {
  const target = parseFloat(el.dataset.value || "0");
  const decimals = Number(el.dataset.decimals || 0);
  if (reduceMotion) {
    renderStat(el, target);
    return;
  }
  const duration = 1300;
  let start: number | null = null;
  function step(ts: number) {
    if (start === null) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    renderStat(el, Number((target * eased).toFixed(decimals)));
    if (t < 1) requestAnimationFrame(step);
    else renderStat(el, target);
  }
  requestAnimationFrame(step);
}

/**
 * Reveal-on-scroll (.lp-reveal) e contadores animados (.lp-stat-num) —
 * mesmo comportamento do script vanilla do exemplo original, portado pra um
 * client component isolado. Só afeta elementos dentro de #institucional-lp.
 */
export function ScrollEffects() {
  useEffect(() => {
    const root = document.getElementById("institucional-lp");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = root.querySelectorAll<HTMLElement>(".lp-reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("lp-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("lp-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      reveals.forEach((el) => io.observe(el));

      const nums = root.querySelectorAll<HTMLElement>(".lp-stat-num[data-value]");
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              countUp(entry.target as HTMLElement, reduceMotion);
              io2.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      nums.forEach((el) => io2.observe(el));

      return () => {
        io.disconnect();
        io2.disconnect();
      };
    }

    const nums = root.querySelectorAll<HTMLElement>(".lp-stat-num[data-value]");
    nums.forEach((el) => countUp(el, reduceMotion));
  }, []);

  return null;
}
