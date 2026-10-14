"use client";

import type { ReactNode } from "react";
import { AuthShell } from "@/components/shell/auth-shell";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Conteúdo padrão do card de autenticação (login, cadastro, recuperar
 * senha, convites, callback OAuth): título curto, subtítulo, formulário e
 * links. A moldura (fundo abstrato, card, logo, X, clique fora/Esc) é do
 * `AuthShell` canônico — nenhuma rota de auth desenha tela cheia própria.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  backHref = "/",
  size = "md",
  externalBack,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Pra onde o X, o Esc e o toque fora do card levam (home por padrão). */
  backHref?: string;
  size?: "sm" | "md" | "lg";
  /** Saída externa extra (ex.: "Voltar para nokta.live" na superfície PLATFORM). */
  externalBack?: { href: string; label: string };
  className?: string;
}) {
  return (
    <AuthShell backHref={backHref} size={size} className={className}>
      {title || subtitle ? (
        <div className="fade-up mb-6">
          {title ? <h1 className="font-display text-[2rem] uppercase leading-[0.95] tracking-wide text-foreground sm:text-[2.25rem]">{title}</h1> : null}
          {subtitle ? <p className="mt-2 text-body text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="fade-up [--i:1]">{children}</div>

      {footer || externalBack ? (
        <div className="fade-up [--i:2] mt-6 space-y-3 text-center text-sm text-muted-foreground">
          {footer ? <div>{footer}</div> : null}
          {externalBack ? (
            <a href={externalBack.href} className="inline-flex items-center gap-1.5 text-caption font-medium text-subtle-foreground transition-colors hover:text-foreground">
              <Icon name="arrow-left" size={11} />
              {externalBack.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </AuthShell>
  );
}

/** Skeleton do formulário enquanto o `useSearchParams` suspende. */
export function AuthFormFallback({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-11 w-full rounded-input" />
      ))}
    </div>
  );
}

/** Divisor "ou" entre os botões sociais e o formulário. */
export function AuthDivider({ label = "ou" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-micro font-semibold uppercase tracking-[0.12em] text-subtle-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
