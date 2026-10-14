"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ForceTheme } from "@/components/theme/theme-provider";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { getMarketingUrl } from "@/lib/surfaces";
import { useSurface } from "@/lib/use-surface";
import { HomeClient } from "@/app/(public-routes)/_home/home-client";
import { PublicHeader } from "./public-header";

type Presentation = "page" | "modal";
const AuthPresentationContext = createContext<Presentation>("page");

/**
 * Marca o conteúdo como "aberto por cima da página atual" (rota
 * interceptada em `(public-routes)/@modal`). O AuthShell então vira um
 * overlay desfocando a página de onde a pessoa veio, e "voltar" é
 * `router.back()` — a página continua ali embaixo, intacta.
 */
export function AuthModalPresentation({ children }: { children: ReactNode }) {
  return <AuthPresentationContext.Provider value="modal">{children}</AuthPresentationContext.Provider>;
}

/**
 * Moldura das telas de login/cadastro/recuperação/convite: o formulário
 * NUNCA ocupa a tela toda — fica num card por cima da página em que a
 * pessoa estava (desfocada). Clicar/tocar fora do card (ou Esc, ou o X)
 * fecha e volta. Ninguém fica "preso" sem saber como voltar.
 *
 * Dois modos:
 * - "modal" (navegação dentro do site): overlay sobre a página atual.
 * - "page" (URL aberta direto / redirect do middleware): não há página
 *   atrás, então a home de verdade é renderizada desfocada e inerte.
 *
 * Celular: o card sobe de baixo como uma folha. Desktop: centralizado.
 */
export function AuthShell({ children, backHref: backHrefProp, size = "md", className }: { children: ReactNode; backHref?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const router = useRouter();
  const surface = useSurface();
  const mode = useContext(AuthPresentationContext);
  // Em app.nokta.live a raiz "/" só manda de volta pro login — "fora do
  // card" leva pro site institucional. Na bilheteria, pra home.
  const backHref = backHrefProp ?? (surface === "PLATFORM" ? getMarketingUrl("/") : "/");
  const goBack = () => {
    if (mode === "modal") return router.back();
    return backHref.startsWith("http") ? window.location.assign(backHref) : router.push(backHref);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backHref, mode]);

  // Modal: a página de trás não rola enquanto o card está aberto.
  useEffect(() => {
    if (mode !== "modal") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  const card = (
    <div className={cn("relative w-full rounded-t-modal bg-surface/85 shadow-3 ring-1 ring-white/10 backdrop-blur-2xl sm:rounded-modal", size === "sm" && "sm:max-w-sm", size === "md" && "sm:max-w-md", size === "lg" && "sm:max-w-lg", className)}>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-7">
        {mode === "modal" ? (
          <button type="button" onClick={goBack} aria-label="Fechar e voltar" className="press text-foreground">
            <BrandLogo height={26} />
          </button>
        ) : (
          <Link href={backHref} aria-label="Ir pra página inicial" className="press text-foreground">
            <BrandLogo height={26} />
          </Link>
        )}
        <button type="button" onClick={goBack} aria-label="Fechar" className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7">{children}</div>
    </div>
  );

  // clicar fora do card = voltar. onMouseDown (não onClick) pra não fechar
  // quando um arrasto de seleção termina fora do card.
  const backdropHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) goBack();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (e.target === e.currentTarget) goBack();
    },
  };

  if (mode === "modal") {
    return (
      <div className="overlay-in fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-background/55 backdrop-blur-md">
        <ForceTheme theme="dark" />
        <div className="grain pointer-events-none fixed inset-0" aria-hidden />
        <div {...backdropHandlers} className="relative flex min-h-dvh flex-col items-center justify-end sm:justify-center sm:p-6">
          <div className="sheet-up w-full sm:contents">{card}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background">
      <ForceTheme theme="dark" />

      {/* Sem página atrás (URL direta): a home de verdade por baixo —
          desfocada, escurecida e inerte (sem foco, clique ou leitor de tela).
          `filter` vira containing block, então o header fixo da home fica
          preso aqui dentro. */}
      <div aria-hidden inert className="pointer-events-none fixed inset-0 select-none overflow-hidden">
        <div className="h-full overflow-hidden blur-md brightness-[0.5] saturate-[1.15]" style={{ transform: "scale(1.03)" }}>
          <PublicHeader chrome="full" />
          <main className="lg:pt-24">
            <HomeClient />
          </main>
        </div>
        <div className="absolute inset-0 bg-background/35" />
        <div className="grain absolute inset-0" />
      </div>

      <div {...backdropHandlers} className="relative flex min-h-dvh flex-col items-center justify-end sm:justify-center sm:p-6">
        {card}
      </div>
    </div>
  );
}
