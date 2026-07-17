"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { useVenueOrganizationDetails } from "../_hooks/use-venue-settings";

const MODULE_LABEL: Record<string, string> = {
  tickets: "Tickets",
  venue: "Venue",
  finance: "Financeiro",
  insights: "Insights",
};

export function OrganizacaoTab({ orgId }: { orgId: number }) {
  const { data, isLoading, isError } = useVenueOrganizationDetails(orgId);

  if (isLoading) return <BlockSkeleton className="h-72" />;
  if (isError || !data) {
    return <EmptyState title="Não foi possível carregar" description="Tente novamente em instantes." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da organização</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" value={data.nome} />
          <Field label="Tipo" value={data.tipo === "PF" ? "Pessoa física" : "Pessoa jurídica"} />
          <Field label="Documento" value={data.documento ?? "Não informado"} />
          <Field label="Proprietário" value={`${data.owner.nome} ${data.owner.sobrenome ?? ""}`.trim()} />
          <Field label="E-mail do proprietário" value={data.owner.email} />
          <Field label="Status" value={<Badge variant="outline">{data.status}</Badge>} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-black/70">Módulos ativos</p>
          <div className="flex flex-wrap gap-2">
            {data.modules.map((m) => (
              <Badge key={m.module} variant="secondary">
                {MODULE_LABEL[m.module] ?? m.module}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-xs text-black/40">
          Alterar nome, tipo ou documento exige um fluxo de verificação que ainda não está disponível — fale com o
          suporte se precisar corrigir esses dados.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-black/50">{label}</p>
      <div className="mt-0.5 text-sm text-black/90">{value}</div>
    </div>
  );
}
