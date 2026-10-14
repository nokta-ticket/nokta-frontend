"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Card padrão de uma seção do editor: título + descrição curta + conteúdo + rodapé de ações. */
export function SectionCard({ title, description, action, children, footer, className, contentClassName }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string; contentClassName?: string }) {
  return (
    <Card className={cn("fade-up", className)}>
      <CardHeader className="flex-col gap-3 sm:flex-row">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-5", contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter className="justify-end">{footer}</CardFooter> : null}
    </Card>
  );
}

/** Rodapé com o botão de salvar (e um texto de apoio à esquerda, opcional). */
export function SaveBar({ onSave, saving, disabled, label = "Salvar alterações", hint }: { onSave: () => void; saving?: boolean; disabled?: boolean; label?: string; hint?: ReactNode }) {
  return (
    <div className="flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-caption text-muted-foreground">{hint}</p>
      <Button onClick={onSave} loading={saving} disabled={disabled} leftIcon="save" className="h-11 sm:h-10">
        {label}
      </Button>
    </div>
  );
}

/** Agrupamento dentro de um card: título pequeno + campos. */
export function FormSection({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-caption text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FormDivider() {
  return <hr className="divider-glow" />;
}
