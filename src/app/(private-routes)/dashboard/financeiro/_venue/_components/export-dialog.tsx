"use client";

import { useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { venueFinanceApi, type VenueFinancePeriodParams } from "@/services/venue-finance";

type ExportKind = Parameters<typeof venueFinanceApi.downloadExport>[1];

const KINDS: { kind: ExportKind; label: string; description: string; icon: IconName }[] = [
  { kind: "summary", label: "Resumo do período", description: "Bruto, líquido, CMV, despesas e resultado", icon: "chart-line" },
  { kind: "sales", label: "Vendas", description: "Cada pagamento com método, bruto e taxa", icon: "receipt" },
  { kind: "payables", label: "Contas a pagar", description: "Todas as contas com status e saldo", icon: "invoice" },
  { kind: "expenses", label: "Despesas por categoria", description: "Total por categoria no período", icon: "chart-bar" },
  { kind: "reconciliations", label: "Conciliação", description: "Esperado × informado por dia e método", icon: "scale" },
  { kind: "cash-sessions", label: "Fechamentos de caixa", description: "Esperado e contado de cada caixa", icon: "wallet" },
];

/** Escolha do CSV a baixar — a descarga é um fetch autenticado (Blob). */
export function ExportDialog({ orgId, locationId, locationName, params, days, periodLabel, open, onOpenChange }: { orgId: number; locationId: number; locationName: string | null; params: VenueFinancePeriodParams; days: string[]; periodLabel: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, setPending] = useState<ExportKind | null>(null);

  const download = async (kind: ExportKind) => {
    if (pending) return;
    setPending(kind);
    try {
      const range = days.length > 1 ? `${days[0]}_${days[days.length - 1]}` : days[0];
      await venueFinanceApi.downloadExport(orgId, kind, locationId, `financeiro-${kind}-${range}.csv`, params);
      toast.success("CSV baixado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível gerar o arquivo."));
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!pending ? onOpenChange(v) : null)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Exportar CSV</DialogTitle>
          <DialogDescription>
            {periodLabel}
            {locationName ? ` · ${locationName}` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-2 pt-1">
          {KINDS.map((k) => {
            const busy = pending === k.kind;
            return (
              <button
                key={k.kind}
                type="button"
                disabled={pending !== null}
                onClick={() => void download(k.kind)}
                className={cn("press flex w-full items-center gap-3.5 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60", busy && "opacity-100")}
              >
                <Icon name={busy ? "loader" : k.icon} size={16} className={cn("shrink-0 text-muted-foreground", busy && "animate-spin text-brand")} fw />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{k.label}</span>
                  <span className="block text-caption text-muted-foreground">{k.description}</span>
                </span>
                <Icon name="download" size={13} className="shrink-0 text-subtle-foreground" />
              </button>
            );
          })}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
