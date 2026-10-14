"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />;
}

/**
 * Lista de abas. `variant="pill"` (padrão) é o segmented control; `"line"`
 * é a aba sublinhada, melhor quando há muitas abas (rola na horizontal no
 * celular sem barra visível).
 */
function TabsList({ className, variant = "pill", ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "pill" | "line" }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "scrollbar-hide flex max-w-full items-center overflow-x-auto",
        variant === "pill" && "w-fit gap-0.5 rounded-pill bg-surface-2 p-1",
        variant === "line" && "gap-1 border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-150 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        // pill
        "[[data-variant=pill]_&]:rounded-pill [[data-variant=pill]_&]:data-[state=active]:bg-surface [[data-variant=pill]_&]:data-[state=active]:text-foreground [[data-variant=pill]_&]:data-[state=active]:shadow-thumb",
        // line
        "[[data-variant=line]_&]:-mb-px [[data-variant=line]_&]:h-10 [[data-variant=line]_&]:border-b-2 [[data-variant=line]_&]:border-transparent [[data-variant=line]_&]:px-1 [[data-variant=line]_&]:mr-4 [[data-variant=line]_&]:data-[state=active]:border-brand [[data-variant=line]_&]:data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
