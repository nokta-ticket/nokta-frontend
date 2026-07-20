"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { venueFinanceApi, type VenueFinancePeriodParams } from "@/services/venue-finance";

const EXPORTS: { kind: "sales" | "payables" | "expenses" | "cash-sessions" | "reconciliations" | "summary"; label: string; filename: string }[] = [
  { kind: "sales", label: "Vendas", filename: "vendas.csv" },
  { kind: "payables", label: "Contas a pagar", filename: "contas-a-pagar.csv" },
  { kind: "expenses", label: "Despesas pagas", filename: "despesas.csv" },
  { kind: "cash-sessions", label: "Fechamentos de caixa", filename: "fechamentos-de-caixa.csv" },
  { kind: "reconciliations", label: "Conciliações", filename: "conciliacoes.csv" },
  { kind: "summary", label: "Resumo financeiro", filename: "resumo-financeiro.csv" },
];

export function ExportMenuButton({ orgId, locationId, period }: { orgId: number; locationId: number; period: VenueFinancePeriodParams }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (kind: (typeof EXPORTS)[number]["kind"], filename: string) => {
    setDownloading(kind);
    try {
      await venueFinanceApi.downloadExport(orgId, kind, locationId, filename, period);
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
