"use client";

import { useEffect, useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueMenus } from "./_hooks/use-venue-menus";
import { ProdutosTab } from "./_components/produtos-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { AdicionaisTab } from "./_components/adicionais-tab";
import { EstacoesTab } from "./_components/estacoes-tab";
import { CardapiosTab } from "./_components/cardapios-tab";

type TabKey = "produtos" | "categorias" | "adicionais" | "estacoes" | "cardapios";

export default function VenueCardapioPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const [tab, setTab] = useState<TabKey>("produtos");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: menus } = useVenueMenus(venueActive ? orgId : null);

  // Ao trocar de organização, o cache de cada query já é isolado por orgId
  // (ver query-keys.ts) — mas o cardápio selecionado na tela precisa ser
  // reavaliado para não continuar apontando pro cardápio da org anterior.
  useEffect(() => {
    setSelectedMenuId(null);
  }, [orgId]);

  useEffect(() => {
    if (selectedMenuId !== null || !menus || menus.length === 0) return;
    const main = menus.find((m) => m.isMain) ?? menus[0];
    setSelectedMenuId(main.id);
  }, [menus, selectedMenuId]);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader
          title="Cardápio"
          description="Gerencie produtos, categorias, preços, adicionais e disponibilidade."
        />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader
          title="Cardápio"
          description="Gerencie produtos, categorias, preços, adicionais e disponibilidade."
        />
        <EmptyState
          title="Venue não está ativo"
          description="O módulo Venue precisa estar ativo nesta organização para gerenciar o cardápio."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Cardápio"
        description="Gerencie produtos, categorias, preços, adicionais e disponibilidade."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {menus && menus.length > 0 ? (
              <Select
                value={selectedMenuId ? String(selectedMenuId) : undefined}
                onValueChange={(v) => setSelectedMenuId(Number(v))}
              >
                <SelectTrigger className="w-48"><SelectValue placeholder="Cardápio" /></SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={String(menu.id)}>
                      {menu.nome} {menu.isMain ? "· Principal" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button variant="outline" onClick={() => setTab("cardapios")}>
              <Settings2 size={16} /> Gerenciar cardápios
            </Button>
            <Button
              onClick={() => {
                setTab("produtos");
                setCreateProductOpen(true);
              }}
            >
              <Plus size={16} /> Novo produto
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
            <TabsTrigger value="estacoes">Estações</TabsTrigger>
            <TabsTrigger value="cardapios">Cardápios</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="produtos">
          <ProdutosTab orgId={orgId} createOpen={createProductOpen} onCreateOpenChange={setCreateProductOpen} />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriasTab
            orgId={orgId}
            menus={menus ?? []}
            selectedMenuId={selectedMenuId}
            onSelectMenu={setSelectedMenuId}
          />
        </TabsContent>
        <TabsContent value="adicionais">
          <AdicionaisTab orgId={orgId} />
        </TabsContent>
        <TabsContent value="estacoes">
          <EstacoesTab orgId={orgId} />
        </TabsContent>
        <TabsContent value="cardapios">
          <CardapiosTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
