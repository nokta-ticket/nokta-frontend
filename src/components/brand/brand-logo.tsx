import { cn } from "@/lib/cn";

type Variant = "tickets" | "nokta" | "bolt";

const SOURCES: Record<Variant, { src: string; ratio: number; label: string }> = {
  // viewBox 782x283 nos dois lettering
  tickets: { src: "/brand/nokta-tickets-white.svg", ratio: 782 / 283, label: "Nokta Tickets" },
  nokta: { src: "/brand/nokta-logotype.svg", ratio: 782 / 283, label: "Nokta" },
  // O raio do "K" — símbolo da marca (viewBox 51.2x129.6). Use como ícone,
  // favicon, marcador de destaque, loader.
  bolt: { src: "/brand/nokta-bolt.svg", ratio: 51.2 / 129.6, label: "Nokta" },
};

/**
 * Logo oficial (2026-10). Renderizada via mask pra herdar `currentColor`:
 * branca no escuro, preta no claro, rosa se quiser (`text-brand`).
 * Toda logo passa por aqui — nunca <Image src="/brand/..."> direto.
 */
export function BrandLogo({ variant = "tickets", height = 28, className, title }: { variant?: Variant; height?: number; className?: string; title?: string }) {
  const { src, ratio, label } = SOURCES[variant];
  const style: React.CSSProperties = {
    height,
    width: Math.round(height * ratio),
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  return <span role="img" aria-label={title ?? label} className={cn("inline-block shrink-0 bg-current", className)} style={style} />;
}
