"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Topo da landing: quatro pedaços recortados da tela real "Início" do
 * painel começam soltos e, conforme a página rola, se encaixam no lugar
 * exato da captura inteira (que aparece por baixo). Abaixo de 1100px não
 * há animação: só a captura inteira.
 *
 * A captura vem de public/institucional/painel-inicio.webp (1440x900 CSS,
 * organização de demonstração da própria Nokta). Se a captura for refeita,
 * os retângulos de TILES precisam acompanhar o novo layout.
 */
const SRC = "/institucional/painel-inicio.webp";
const W = 1440;
const H = 900;

// Retângulos em px CSS da captura + de onde cada pedaço sai (fração do palco, graus).
const TILES = [
  { x: 304, y: 222, w: 358, h: 353, dx: -0.1, dy: -0.15, rot: -6, label: "Panorama geral" },
  { x: 679, y: 222, w: 357, h: 353, dx: 0.03, dy: -0.21, rot: 4, label: "Agora na operação" },
  { x: 1054, y: 222, w: 339, h: 353, dx: 0.04, dy: -0.08, rot: 6, label: "Reservas de hoje" },
  { x: 304, y: 600, w: 727, h: 300, dx: -0.07, dy: 0.13, rot: -3, label: "Desempenho financeiro" },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function HeroStage({ heroId, captionId }: { heroId: string; captionId: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const hero = document.getElementById(heroId);
    const caption = document.getElementById(captionId);
    const scroller = stage?.closest<HTMLElement>("#institucional-lp");
    if (!stage || !frame || !hero || !scroller) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1100px)");
    let entry = reduce ? 1 : 0;
    let raf = 0;

    const progress = () => {
      const total = hero.offsetHeight - scroller.clientHeight;
      if (total <= 0) return 1;
      return Math.min(1, Math.max(0, (scroller.scrollTop - hero.offsetTop) / (total * 0.75)));
    };

    const render = () => {
      if (!desktop.matches) {
        if (caption) caption.textContent = "Quatro partes, uma conta só.";
        return;
      }
      const raw = progress();
      const p = reduce ? raw : ease(raw);
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      TILES.forEach((t, i) => {
        const el = tileRefs.current[i];
        if (!el) return;
        const x = lerp(t.dx * sw, 0, p);
        const y = lerp(t.dy * sh, 0, p) + (1 - entry) * 18;
        const s = lerp(1.05, 1, p);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${lerp(t.rot, 0, p)}deg) scale(${s})`;
        el.style.opacity = String(p >= 0.999 ? 0 : entry);
      });
      frame.style.opacity = String(Math.min(1, Math.max(0, (p - 0.15) / 0.6)));
      frame.style.transform = `scale(${lerp(0.97, 1, p)})`;
      if (caption) caption.textContent = p > 0.9 ? "Uma conta só: a Nokta." : "Quatro partes da sua operação.";
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };

    render();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let entryRaf = 0;
    if (!reduce) {
      const t0 = performance.now() + 150;
      const step = (now: number) => {
        const k = Math.min(1, Math.max(0, (now - t0) / 900));
        entry = 1 - Math.pow(1 - k, 3);
        render();
        if (k < 1) entryRaf = requestAnimationFrame(step);
      };
      entryRaf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(entryRaf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [heroId, captionId]);

  return (
    <div ref={stageRef} className="stage">
      <div ref={frameRef} className="stage-frame">
        <Image
          src={SRC}
          alt="Tela Início do painel da Nokta: faturamento dos últimos 30 dias, operação agora, reservas de hoje e mais vendidos (dados de demonstração)"
          width={2400}
          height={1500}
          priority
          sizes="(min-width: 1100px) 60vw, 100vw"
        />
      </div>
      {TILES.map((t, i) => (
        <div
          key={t.label}
          ref={(el) => {
            tileRefs.current[i] = el;
          }}
          className="tile"
          aria-hidden="true"
          style={{
            left: `${(t.x / W) * 100}%`,
            top: `${(t.y / H) * 100}%`,
            width: `${(t.w / W) * 100}%`,
            height: `${(t.h / H) * 100}%`,
            opacity: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- recorte decorativo da mesma captura via posicionamento */}
          <img
            src={SRC}
            alt=""
            style={{
              width: `${(W / t.w) * 100}%`,
              left: `${(-t.x / t.w) * 100}%`,
              top: `${(-t.y / t.h) * 100}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
