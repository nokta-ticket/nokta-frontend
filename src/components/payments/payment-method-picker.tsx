"use client";

import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import type { PaymentMethod } from "@/lib/payment-fees";

function MethodCard({ icon, label, hint, active, disabled, onClick }: { icon: IconName; label: string; hint: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "press flex min-h-[76px] w-full flex-col items-start gap-1.5 rounded-card border bg-surface p-4 text-left shadow-card outline-none transition-[border-color,box-shadow,background-color] duration-150 disabled:opacity-50",
        active ? "border-brand bg-brand-soft/40 ring-2 ring-brand-ring" : "border-border hover:border-border-strong",
      )}
    >
      <span className="flex w-full items-center gap-2.5">
        <Icon name={icon} size={18} className={active ? "text-brand" : "text-foreground"} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {active ? <Icon name="check-circle" size={16} className="ml-auto text-brand" /> : null}
      </span>
      <span className="text-caption text-muted-foreground">{hint}</span>
    </button>
  );
}

/**
 * Escolha da forma de pagamento: dois cards selecionáveis (Pix / Cartão).
 * Clicar no método já selecionado desmarca (`onChange(null)`), como no fluxo
 * original — quem controla o estado é a tela.
 */
export function PaymentMethodPicker({ value, onChange, maxParcelas, disabled, className }: { value: PaymentMethod | null; onChange: (method: PaymentMethod | null) => void; maxParcelas?: number; disabled?: boolean; className?: string }) {
  const toggle = (method: PaymentMethod) => onChange(value === method ? null : method);
  return (
    <div role="radiogroup" aria-label="Forma de pagamento" className={cn("grid grid-cols-2 gap-3", className)}>
      <MethodCard icon="pix" label="Pix" hint="Aprovação na hora" active={value === "pix"} disabled={disabled} onClick={() => toggle("pix")} />
      <MethodCard icon="credit-card" label="Cartão de crédito" hint={maxParcelas && maxParcelas > 1 ? `Em até ${maxParcelas}x` : "À vista"} active={value === "card"} disabled={disabled} onClick={() => toggle("card")} />
    </div>
  );
}
