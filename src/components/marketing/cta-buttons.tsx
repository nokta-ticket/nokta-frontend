"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PRODUCER_SIGNUP_PATH, usePlatformHref } from "@/lib/use-platform-href";

/** Par de CTAs das páginas de conteúdo: criar conta (produtor) e ver eventos. */
export function CtaButtons({ className, secondary = { label: "Falar com a gente", href: "/ajuda" } }: { className?: string; secondary?: { label: string; href: string } | null }) {
  const cadastro = usePlatformHref(PRODUCER_SIGNUP_PATH);
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <Button asChild variant="primary" shape="pill" size="lg" className="w-full sm:w-auto" rightIcon="arrow-right">
        <a href={cadastro}>Criar conta grátis</a>
      </Button>
      {secondary ? (
        <Button asChild variant="outline" shape="pill" size="lg" className="w-full sm:w-auto">
          <a href={secondary.href}>{secondary.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
