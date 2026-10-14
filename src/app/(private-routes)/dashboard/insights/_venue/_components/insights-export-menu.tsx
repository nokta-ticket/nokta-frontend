"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { venueInsightsApi, type VenueInsightsFilterParams } from "@/services/venue-insights";

type ExportKind = Parameters<typeof venueInsightsApi.downloadExport>[1];

const EXPORTS: { kind: ExportKind; label: string; description: string; icon: IconName; filename: string }[] = [
  { kind: "overview", label: "Visão geral", description: "Indicadores do período", icon: "chart-line", filename: "insights-visao-geral.csv" },
  { kind: "sales", label: "Vendas", description: "Faturamento ao longo do período", icon: "receipt", filename: "insights-vendas.csv" },
  { kind: "products", label: "Produtos", description: "Quantidade, receita e margem", icon: "utensils", filename: "insights-produtos.csv" },
  { kind: "reservations", label: "Reservas", description: "Reservas e fila de espera", icon: "calendar-check", filename: "insights-reservas.csv" },
  { kind: "stock", label: "Estoque", description: "Perdas, compras e consumo", icon: "box", filename: "insights-estoque.csv" },
  { kind: "finance", label: "Financeiro", description: "Receitas, despesas e resultado", icon: "wallet", filename: "insights-financeiro.csv" },
];

/** Botão "Exportar" que abre o diálogo com os 6 CSVs — download autenticado via Blob. */
export function InsightsExportDialog({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const [downloading, setDownloading] = useState<ExportKind | null>(null);

  const handleExport = async (entry: (typeof EXPORTS)[number]) => {
    setDownloading(entry.kind);
    try {
      await venueInsightsApi.downloadExport(orgId, entry.kind, entry.filename, params);
      toast.success(`${entry.label} exportado.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível exportar."));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" leftIcon="download">
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Exportar CSV</DialogTitle>
          <DialogDescription>Os arquivos respeitam o período, a unidade e a comparação selecionados.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-2">
          {EXPORTS.map((entry) => {
            const busy = downloading === entry.kind;
            return (
              <button
                key={entry.kind}
                type="button"
                disabled={downloading !== null}
                onClick={() => handleExport(entry)}
                className="press flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name={entry.icon} size={16} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{entry.label}</span>
                  <span className="block text-caption text-muted-foreground">{entry.description}</span>
                </span>
                <Icon name={busy ? "loader" : "download"} size={14} className={cn("shrink-0 text-subtle-foreground", busy && "animate-spin")} />
              </button>
            );
          })}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
