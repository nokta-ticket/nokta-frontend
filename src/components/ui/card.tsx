import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Card canônico: superfície + borda + sombra em camadas + raio 16px.
 * `interactive` adiciona o lift de hover; `glow` o brilho rosa no canto.
 */
function Card({ className, interactive, glow, accent, ...props }: React.ComponentProps<"div"> & { interactive?: boolean; glow?: boolean; accent?: boolean }) {
  return <div data-slot="card" className={cn("flex flex-col rounded-card border border-border bg-surface text-foreground shadow-card", interactive && "card-hover", glow && "card-glow", accent && "card-accent", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-base font-semibold leading-snug tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("mt-1 text-body text-muted-foreground", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("shrink-0", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-5 py-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-3 border-t border-border px-5 py-4", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
