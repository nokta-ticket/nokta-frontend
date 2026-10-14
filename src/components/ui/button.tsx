import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-[background-color,color,border-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Ação principal: rosa com texto escuro (no escuro) / branco (no claro).
        primary: "btn-lift bg-brand text-brand-foreground hover:bg-brand-hover",
        default: "btn-lift bg-brand text-brand-foreground hover:bg-brand-hover",
        // Pílula de alto contraste (branca no escuro) — CTA secundário forte.
        contrast: "btn-lift bg-foreground text-background hover:opacity-90",
        secondary: "bg-surface-2 text-foreground hover:bg-surface-3",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-surface-2",
        ghost: "text-foreground hover:bg-surface-2",
        subtle: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        destructive: "btn-lift btn-lift-danger bg-danger text-white hover:opacity-90",
        "destructive-soft": "bg-danger-bg text-danger hover:bg-danger/20",
        link: "h-auto px-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        default: "h-10 px-4 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        full: "h-12 w-full px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
      shape: {
        rounded: "rounded-input",
        pill: "rounded-pill",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "rounded",
    },
  },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
}

/**
 * Botão canônico. `variant="primary"` é o rosa; `contrast` a pílula branca
 * do estilo Gandaya; `size="full"` pra CTAs de celular (h-12, largura toda).
 * Nunca envolver num <Link> — use `asChild` + <Link> dentro.
 */
function Button({ className, variant, size, shape, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg";
  const iconSize = size === "lg" || size === "full" || size === "icon-lg" ? 16 : 14;

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, shape, className }))} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Icon name="loader" size={iconSize} className="animate-spin" /> : leftIcon ? <Icon name={leftIcon} size={iconSize} /> : null}
          {isIconOnly && loading ? null : children}
          {rightIcon && !loading ? <Icon name={rightIcon} size={iconSize} /> : null}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
