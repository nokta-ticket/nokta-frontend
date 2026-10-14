"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ForceTheme } from "@/components/theme/theme-provider";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { getMarketingUrl } from "@/lib/surfaces";
import { useSurface } from "@/lib/use-surface";

/**
 * Moldura das telas de login/cadastro/recuperação/convite: o formulário
 * NUNCA ocupa a tela toda — fica num card sobre um fundo abstrato (a arte
 * da pista desfocada + grão + brilho rosa), e clicar/tocar fora do card
 * (ou Esc, ou o X) leva pra `backHref` (home por padrão). Ninguém fica
 * "preso" sem saber como voltar.
 *
 * Celular: o card sobe de baixo como uma folha (fundo visível em cima).
 * Desktop: card centralizado.
 */
export function AuthShell({ children, backHref: backHrefProp, size = "md", className }: { children: ReactNode; backHref?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const router = useRouter();
  const surface = useSurface();
  // Em app.nokta.live a raiz "/" só manda de volta pro login — "fora do
  // card" leva pro site institucional. Na bilheteria, pra home.
  const backHref = backHrefProp ?? (surface === "PLATFORM" ? getMarketingUrl("/") : "/");
  const goBack = () => (backHref.startsWith("http") ? window.location.assign(backHref) : router.push(backHref));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backHref]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background">
      <ForceTheme theme="dark" />
      {/* fundo abstrato */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <Image src="/hero/producers-wide.jpg" alt="" fill priority sizes="100vw" className="scale-110 object-cover blur-2xl brightness-[0.32] saturate-150" />
        <div className="ambient-blob -left-24 top-10 size-96 opacity-80" />
        <div className="ambient-blob -right-24 bottom-0 size-[28rem] opacity-60 [animation-delay:-3s]" />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70" />
      </div>

      {/* clicar fora do card = voltar. onMouseDown (não onClick) pra não
          fechar quando um arrasto de seleção termina fora do card. */}
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) goBack();
        }}
        onTouchEnd={(e) => {
          if (e.target === e.currentTarget) goBack();
        }}
        className="relative flex min-h-dvh flex-col items-center justify-end sm:justify-center sm:p-6"
      >
        <div className={cn("relative w-full rounded-t-modal bg-surface/85 shadow-3 ring-1 ring-white/10 backdrop-blur-2xl sm:rounded-modal", size === "sm" && "sm:max-w-sm", size === "md" && "sm:max-w-md", size === "lg" && "sm:max-w-lg", className)}>
          <div className="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-7">
            <Link href={backHref} aria-label="Ir pra página inicial" className="press text-foreground">
              <BrandLogo height={26} />
            </Link>
            <Link href={backHref} aria-label="Fechar" className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              <Icon name="close" size={16} />
            </Link>
          </div>
          <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
