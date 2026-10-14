"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  disabled?: boolean;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Opções mutuamente exclusivas com pílula deslizante (medida com
 * getBoundingClientRect, recalculada no resize). Sem contagens dentro das
 * opções quando stat cards já mostram — limpo > redundante.
 */
export function SegmentedControl<T extends string>({ value, onChange, options, className, size = "md", fullWidth }: { value: T; onChange: (value: T) => void; options: SegmentedOption<T>[]; className?: string; size?: "sm" | "md"; fullWidth?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const container = containerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(value)}"]`);
    if (!active) return setThumb(null);
    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setThumb({ left: a.left - c.left, width: a.width });
  };

  useIsoLayoutEffect(measure, [value, options.length]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div ref={containerRef} role="radiogroup" className={cn("relative inline-flex rounded-pill bg-surface-2 p-1", fullWidth && "flex w-full", className)}>
      {thumb ? (
        <span aria-hidden className="absolute bottom-1 top-1 rounded-pill bg-surface shadow-thumb transition-[transform,width] duration-300 ease-out-soft" style={{ width: thumb.width, transform: `translateX(${thumb.left}px)`, left: 0 }} />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={opt.value}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-pill font-medium transition-colors duration-150 disabled:opacity-40",
              size === "sm" ? "h-8 px-3 text-caption" : "h-9 px-4 text-sm",
              fullWidth && "flex-1",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon ? <Icon name={opt.icon} size={12} /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
