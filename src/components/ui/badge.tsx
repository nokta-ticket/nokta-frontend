import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const badgeVariants = cva("inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-0.5 text-caption font-semibold [&>svg]:size-3", {
  variants: {
    variant: {
      default: "border-transparent bg-brand text-brand-foreground",
      secondary: "border-transparent bg-surface-2 text-foreground",
      destructive: "border-transparent bg-danger text-white",
      outline: "border-border-strong text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const TONE_CLASS: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand ring-brand-ring",
  success: "bg-success-bg text-success ring-success-ring",
  warning: "bg-warning-bg text-warning ring-warning-ring",
  danger: "bg-danger-bg text-danger ring-danger-ring",
  info: "bg-info-bg text-info ring-info-ring",
  neutral: "bg-neutral-bg text-neutral ring-neutral-ring",
};

const DOT_CLASS: Record<Tone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
};

/**
 * Etiqueta de estado com ponto colorido. Cor só por tom semântico — nunca
 * cor crua do Tailwind. `pulse` pra "ao vivo"/"aberto agora".
 */
export function StatusBadge({ tone = "neutral", children, dot = true, pulse, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-caption font-semibold ring-1 ring-inset", TONE_CLASS[tone], className)}>
      {dot ? <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone], pulse && "pulse-ring [--pulse-size:4px]")} aria-hidden /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
