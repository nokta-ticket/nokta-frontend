"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";
import { useSlidingIndicator } from "@/components/ui/use-sliding-indicator";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />;
}

/**
 * Lista de abas. `variant="pill"` (padrão) é o segmented control; `"line"`
 * é a aba sublinhada, melhor quando há muitas abas (rola na horizontal no
 * celular sem barra visível). Nos dois, o destaque da aba ativa DESLIZA até
 * a aba escolhida (pílula ou sublinhado); até a primeira medida (SSR) a aba
 * ativa usa o estilo estático, então nada pisca.
 */
function TabsList({ className, variant = "pill", children, ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "pill" | "line" }) {
  const { ref, rect, animate } = useSlidingIndicator<HTMLDivElement>('[role="tab"][data-state="active"]');
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      data-indicator={rect ? "" : undefined}
      className={cn(
        "scrollbar-hide relative flex max-w-full items-center overflow-x-auto",
        variant === "pill" && "w-fit gap-0.5 rounded-pill bg-surface-2 p-1",
        variant === "line" && "gap-1 border-b border-border",
        className,
      )}
      {...props}
    >
      {rect ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 z-0",
            animate && "transition-[transform,width] duration-300 ease-out-soft",
            variant === "pill" ? "rounded-pill bg-surface shadow-thumb" : "bottom-0 h-0.5 rounded-full bg-brand",
          )}
          style={{
            width: rect.width,
            transform: `translateX(${rect.left}px)`,
            ...(variant === "pill" ? { top: rect.top, height: rect.height } : null),
          }}
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-200 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground [&_svg]:shrink-0",
        // pill — fundo estático só até o indicador deslizante medir
        "[[data-variant=pill]_&]:rounded-pill [[data-variant=pill]:not([data-indicator])_&]:data-[state=active]:bg-surface [[data-variant=pill]:not([data-indicator])_&]:data-[state=active]:shadow-thumb",
        // line — sublinhado estático só até o indicador deslizante medir
        "[[data-variant=line]_&]:-mb-px [[data-variant=line]_&]:mr-4 [[data-variant=line]_&]:h-10 [[data-variant=line]_&]:border-b-2 [[data-variant=line]_&]:border-transparent [[data-variant=line]_&]:px-1 [[data-variant=line]:not([data-indicator])_&]:data-[state=active]:border-brand",
        className,
      )}
      {...props}
    />
  );
}

/** Conteúdo da aba entra com um fade curto ao trocar. */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("tab-enter flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
