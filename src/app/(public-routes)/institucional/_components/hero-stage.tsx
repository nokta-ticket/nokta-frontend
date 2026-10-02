"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Captura real da tela Início do painel (1440x900 CSS, organização de
 * demonstração da própria Nokta). Se a captura for refeita, os retângulos
 * de RECTS precisam acompanhar o novo layout.
 */
const SRC = "/institucional/painel-inicio.webp";
const W = 1440;
const H = 900;

const RECTS = {
  panorama: { x: 304, y: 222, w: 358, h: 353, label: "Panorama geral" },
  operacao: { x: 679, y: 222, w: 357, h: 353, label: "Agora na operação" },
  reservas: { x: 1054, y: 222, w: 339, h: 353, label: "Reservas de hoje" },
  desempenho: { x: 304, y: 600, w: 727, h: 300, label: "Desempenho financeiro" },
} as const;

type RectKey = keyof typeof RECTS;

// De onde cada pedaço sai antes de se encaixar (fração do palco e graus).
const FROM: { key: RectKey; dx: number; dy: number; rot: number }[] = [
  { key: "panorama", dx: -0.12, dy: -0.16, rot: -7 },
  { key: "operacao", dx: 0.02, dy: -0.24, rot: 4 },
  { key: "reservas", dx: 0.06, dy: -0.1, rot: 6 },
  { key: "desempenho", dx: -0.06, dy: 0.16, rot: -3 },
];

/** Recorte de uma região da captura, sem arquivo extra: a mesma imagem posicionada. */
function Crop({ k, className, style }: { k: RectKey; className?: string; style?: React.CSSProperties }) {
  const r = RECTS[k];
  return (
    <div className={className} style={{ aspectRatio: `${r.w} / ${r.h}`, ...style }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- recorte decorativo da mesma captura */}
      <img
        src={SRC}
        alt=""
        loading="lazy"
        style={{ width: `${(W / r.w) * 100}%`, left: `${(-r.x / r.w) * 100}%`, top: `${(-r.y / r.h) * 100}%` }}
      />
    </div>
  );
}

/**
 * Topo: ao abrir a página, quatro pedaços da tela Início voam e se encaixam
 * no lugar exato da captura inteira, que aparece por baixo. Ao rolar, o
 * painel sai de uma leve inclinação em perspectiva e fica reto. Celular:
 * dois recortes legíveis, sem a captura de 1440px encolhida.
 */
export function HeroStage() {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    const scroller = tilt?.closest<HTMLElement>("#institucional-lp");
    if (!tilt || !scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      const p = Math.min(1, scroller.scrollTop / 420);
      tilt.style.setProperty("--tilt", `${(1 - p) * 12}deg`);
      tilt.style.setProperty("--lift", String(0.94 + p * 0.06));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div className="stage-wrap">
        <div ref={tiltRef} className="stage-tilt">
          <div className="stage">
            <div className="stage-frame">
              <Image
                src={SRC}
                alt="Tela Início do painel da Nokta: faturamento dos últimos 30 dias, operação agora, reservas de hoje e mais vendidos (dados de demonstração)"
                width={2400}
                height={1500}
                priority
                sizes="(min-width: 1100px) 1200px, 100vw"
              />
            </div>
            {FROM.map((f, i) => {
              const r = RECTS[f.key];
              return (
                <Crop
                  key={f.key}
                  k={f.key}
                  className="tile"
                  style={
                    {
                      left: `${(r.x / W) * 100}%`,
                      top: `${(r.y / H) * 100}%`,
                      width: `${(r.w / W) * 100}%`,
                      "--dx": `${f.dx * 100}cqw`,
                      "--dy": `${f.dy * 62.5}cqw`,
                      "--rot": `${f.rot}deg`,
                      "--i": i,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="stage-mobile">
        <Crop k="panorama" className="crop" />
        <Crop k="operacao" className="crop" />
      </div>
    </>
  );
}

/** Visual do fechamento: dois cards reais do painel, sobrepostos. */
export function CloseVisual() {
  return (
    <div className="close-visual" aria-hidden="true">
      <Crop k="panorama" className="crop c1" />
      <Crop k="reservas" className="crop c2" />
    </div>
  );
}
