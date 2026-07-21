"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { useMyPromoterProfile } from "./_hooks/use-my-promoter";
import { ResumoTab } from "./_components/resumo-tab";
import { OrganizacoesTab } from "./_components/organizacoes-tab";
import { LinksVendasTab } from "./_components/links-vendas-tab";
import { MeusAcertosTab } from "./_components/meus-acertos-tab";

type TabKey = "resumo" | "organizacoes" | "links" | "acertos";

export default function MeuPainelPromoterPage() {
  const { data: profile, isLoading } = useMyPromoterProfile();
  const [tab, setTab] = useState<TabKey>("resumo");

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Meu painel de promoter" description="Suas vendas, links, códigos e comissões." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <PageHeader title="Meu painel de promoter" description="Suas vendas, links, códigos e comissões." />
        <EmptyState
          title="Você ainda não é promoter"
          description="Quando aceitar um convite de promoter de alguma organização, seu painel aparece aqui."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Meu painel de promoter" description={`Olá, ${profile.displayName ?? "promoter"} — suas vendas, links, códigos e comissões.`} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="organizacoes">Organizações</TabsTrigger>
          <TabsTrigger value="links">Links, códigos e vendas</TabsTrigger>
          <TabsTrigger value="acertos">Acertos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo"><ResumoTab /></TabsContent>
        <TabsContent value="organizacoes"><OrganizacoesTab /></TabsContent>
        <TabsContent value="links"><LinksVendasTab /></TabsContent>
        <TabsContent value="acertos"><MeusAcertosTab /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
