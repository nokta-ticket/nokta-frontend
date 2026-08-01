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
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { useVenueMenu, useVenueMenus } from "./_hooks/use-venue-menus";
import { useVenueMenuItems } from "./_hooks/use-venue-menu-items";
import { ProdutosTab } from "./_components/produtos-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { AdicionaisTab } from "./_components/adicionais-tab";
import { EstacoesTab } from "./_components/estacoes-tab";
import { CardapiosTab } from "./_components/cardapios-tab";
import { MenuPreviewPhone } from "./_components/menu-preview-phone";
import { MenuSharePanel } from "./_components/menu-share-panel";

type TabKey = "produtos" | "categorias" | "adicionais" | "estacoes" | "cardapios";

export default function VenueCardapioPage() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const [tab, setTab] = useState<TabKey>("produtos");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;

  const { data: menus } = useVenueMenus(orgId);

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

  // Preview sempre reflete o cardápio PRINCIPAL (o mesmo que fica público),
  // não necessariamente o cardápio selecionado nas abas de gerenciamento —
  // os dois podem divergir quando a organização tem mais de um cardápio.
  const mainMenu = menus?.find((m) => m.isMain) ?? null;
  const { data: mainMenuDetail, isLoading: loadingMainMenu } = useVenueMenu(orgId, mainMenu?.id ?? null);
  const { data: mainMenuItems, isLoading: loadingMainMenuItems } = useVenueMenuItems(orgId, mainMenu?.id ?? null);

  const canShare = Boolean(currentOrg?.slug) && mainMenu?.status === "PUBLISHED";

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

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader
          title="Cardápio"
          description="Gerencie produtos, categorias, preços, adicionais e disponibilidade."
          actions={
            <Button onClick={() => guard(() => {})}>
              <Plus size={16} /> Novo produto
            </Button>
          }
        />
        <EmptyState
          title="Nenhum produto ainda"
          description="Crie seu workspace para começar a montar o cardápio."
          actionLabel="Novo produto"
          onAction={() => guard(() => {})}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
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

        <div className="space-y-5">
          <MenuPreviewPhone
            organizationName={currentOrg?.nome ?? ""}
            menu={mainMenuDetail}
            items={mainMenuItems}
            isLoading={loadingMainMenu || loadingMainMenuItems}
          />
          {canShare ? (
            <MenuSharePanel orgId={orgId} orgSlug={currentOrg!.slug!} />
          ) : (
            <div className="rounded-[22px] border border-dashed border-black/10 bg-black/[0.015] p-5 text-center">
              <p className="text-xs text-muted-foreground">
                Publique o cardápio principal em &quot;Cardápios&quot; para gerar o link e o QR code de divulgação.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
