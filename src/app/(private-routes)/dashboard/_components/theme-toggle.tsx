"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

/**
 * Pílula deslizante sol/lua do painel. A preferência fica com o
 * next-themes (localStorage) — as superfícies públicas continuam sempre
 * escuras via <ForceTheme>, sem tocar nela. `variant="sidebar"` é a versão
 * pra fundo escuro fixo (gaveta do celular).
 */
export function ThemeToggle({ className, variant = "surface" }: { className?: string; variant?: "surface" | "sidebar" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Antes de hidratar não dá pra saber o tema salvo: assume o padrão (escuro)
  // pra não piscar a pílula de um lado pro outro.
  const isDark = mounted ? resolvedTheme !== "light" : true;
  const onSidebar = variant === "sidebar";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-pill p-1 outline-none transition-colors",
        onSidebar ? "bg-white/10" : "bg-surface-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-1 top-1 w-[30px] rounded-pill transition-transform duration-300 ease-out-soft",
          onSidebar ? "bg-white/15" : "bg-surface shadow-thumb",
          isDark ? "translate-x-[30px]" : "translate-x-0",
        )}
        style={{ left: 4 }}
      />
      <span className="relative z-10 flex flex-1 items-center justify-center">
        <Icon name="sun" size={13} className={cn("transition-colors", !isDark ? "text-warning" : onSidebar ? "text-white/40" : "text-subtle-foreground")} />
      </span>
      <span className="relative z-10 flex flex-1 items-center justify-center">
        <Icon name="moon" size={13} className={cn("transition-colors", isDark ? "text-brand" : onSidebar ? "text-white/40" : "text-subtle-foreground")} />
      </span>
    </button>
  );
}
