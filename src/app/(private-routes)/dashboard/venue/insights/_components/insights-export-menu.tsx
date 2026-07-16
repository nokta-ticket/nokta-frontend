"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { venueInsightsApi, type VenueInsightsFilterParams } from "@/services/venue-insights";

const EXPORTS: { kind: "overview" | "sales" | "products" | "reservations" | "stock" | "finance"; label: string; filename: string }[] = [
  { kind: "overview", label: "Visão geral", filename: "insights-visao-geral.csv" },
  { kind: "sales", label: "Vendas", filename: "insights-vendas.csv" },
  { kind: "products", label: "Produtos", filename: "insights-produtos.csv" },
  { kind: "reservations", label: "Reservas", filename: "insights-reservas.csv" },
  { kind: "stock", label: "Estoque", filename: "insights-estoque.csv" },
  { kind: "finance", label: "Financeiro", filename: "insights-financeiro.csv" },
];

export function InsightsExportMenu({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (kind: (typeof EXPORTS)[number]["kind"], filename: string) => {
    setDownloading(kind);
    try {
      await venueInsightsApi.downloadExport(orgId, kind, filename, params);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível exportar."));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download size={16} /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORTS.map((e) => (
          <DropdownMenuItem key={e.kind} disabled={downloading !== null} onClick={() => handleExport(e.kind, e.filename)}>
            {downloading === e.kind ? "Exportando…" : e.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
