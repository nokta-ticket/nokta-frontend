"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Botão de atualizar da toolbar: só ícone, gira enquanto a busca está pendente. */
export function RefreshButton({ onClick, pending, className, label = "Atualizar" }: { onClick: () => void; pending?: boolean; className?: string; label?: string }) {
  return (
    <Button type="button" variant="subtle" size="icon-sm" aria-label={label} title={label} onClick={onClick} disabled={pending} className={className}>
      <Icon name="refresh" size={14} className={cn(pending && "animate-spin")} />
    </Button>
  );
}
