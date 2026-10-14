"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Banner do evento na proporção inteira (818×355, nunca cortado), cantos
 * arredondados e grão. Com mais de uma imagem vira um carrossel com snap,
 * pontinhos e setas (setas só no desktop — no celular o gesto é arrastar).
 */
export function EventBanner({ images, alt, badge, className }: { images: string[]; alt: string; badge?: React.ReactNode; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const many = images.length > 1;

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = (idx + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={cn("group relative", className)}>
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.clientWidth > 0) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="snap-row grain relative overflow-hidden rounded-[20px] bg-surface-2 shadow-card-hover ring-1 ring-white/5 [scroll-padding-inline:0] lg:rounded-[24px]"
        aria-roledescription={many ? "carrossel" : undefined}
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative aspect-[818/355] w-full shrink-0">
            <Image src={src} alt={i === 0 ? alt : ""} fill sizes="(max-width: 1024px) 100vw, 760px" priority={i === 0} unoptimized className="object-cover" />
          </div>
        ))}
      </div>

      {badge ? <div className="absolute left-3 top-3 z-10">{badge}</div> : null}

      {many ? (
        <>
          <button type="button" onClick={() => goTo(current - 1)} aria-label="Imagem anterior" className="absolute left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/65 group-hover:opacity-100 lg:flex">
            <Icon name="chevron-left" size={14} />
          </button>
          <button type="button" onClick={() => goTo(current + 1)} aria-label="Próxima imagem" className="absolute right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/65 group-hover:opacity-100 lg:flex">
            <Icon name="chevron-right" size={14} />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-pill bg-black/35 px-2 py-1.5 backdrop-blur-md">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Imagem ${i + 1} de ${images.length}`} aria-current={i === current} className={cn("h-1.5 rounded-full transition-all duration-300", i === current ? "w-5 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70")} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
