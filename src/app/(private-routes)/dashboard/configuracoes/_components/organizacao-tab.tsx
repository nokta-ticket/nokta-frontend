"use client";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DefinitionItem, DefinitionList } from "../../_components/definition-list";
import { useVenueOrganizationDetails } from "../_hooks/use-venue-settings";

const MODULE_LABEL: Record<string, string> = {
  tickets: "Tickets",
  venue: "Venue",
  finance: "Financeiro",
  insights: "Insights",
};

export function OrganizacaoTab({ orgId }: { orgId: number }) {
  const { data, isLoading, isError, refetch } = useVenueOrganizationDetails(orgId);

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;
  if (isError || !data) {
    return <ErrorState description="Não foi possível carregar os dados da organização." onRetry={() => refetch()} />;
  }

  const active = data.status === "ACTIVE";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dados da organização</CardTitle>
            <CardDescription>Como ela aparece pra equipe e nos documentos.</CardDescription>
          </div>
          <StatusBadge tone={active ? "success" : "danger"}>{active ? "Ativa" : data.status}</StatusBadge>
        </CardHeader>
        <CardContent className="space-y-6">
          <DefinitionList>
            <DefinitionItem label="Nome" value={data.nome} />
            <DefinitionItem label="Tipo" value={data.tipo === "PF" ? "Pessoa física" : "Pessoa jurídica"} />
            <DefinitionItem label="Documento" value={data.documento} mono />
            <DefinitionItem label="Proprietário" value={`${data.owner.nome} ${data.owner.sobrenome ?? ""}`.trim()} />
            <DefinitionItem label="E-mail do proprietário" value={data.owner.email} />
            <DefinitionItem label="Criada em" value={new Date(data.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} />
          </DefinitionList>

          <div>
            <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Módulos ativos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.modules.map((m) => (
                <Badge key={m.module} variant="secondary">
                  {MODULE_LABEL[m.module] ?? m.module}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Callout tone="neutral">Alterar nome, tipo ou documento exige um fluxo de verificação que ainda não está disponível — fale com o suporte se precisar corrigir esses dados.</Callout>
    </div>
  );
}
