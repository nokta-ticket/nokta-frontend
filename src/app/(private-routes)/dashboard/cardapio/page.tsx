"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { useEnsureDefaultMenu, useVenueMenus } from "./_hooks/use-venue-menus";
import { useVenueMenuItems } from "./_hooks/use-venue-menu-items";
import { useVenueCategories } from "./_hooks/use-venue-categories";
import { ProdutosTab } from "./_components/produtos-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { AdicionaisTab } from "./_components/adicionais-tab";
import { MenuPreviewPhone } from "./_components/menu-preview-phone";
import { MenuSharePanel } from "./_components/menu-share-panel";
import { VenuePublicProfileForm } from "./_components/venue-public-profile-form";
import { MenuHeader } from "./_components/menu-header";
import { ManageMenusDialog } from "./_components/manage-menus-dialog";
import { StationsSheet } from "./_components/stations-sheet";
import { ProdutoBulkCreateDialog } from "./_components/produto-bulk-create-dialog";

type TabKey = "produtos" | "categorias" | "adicionais";

export default function VenueCardapioPage() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const [tab, setTab] = useState<TabKey>("produtos");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [manageMenusOpen, setManageMenusOpen] = useState(false);
  const [stationsOpen, setStationsOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;

  const { data: menus } = useVenueMenus(orgId);
  const ensureDefault = useEnsureDefaultMenu(orgId ?? -1);

  // Ao trocar de organização, o cache de cada query já é isolado por orgId
  // (ver query-keys.ts) — mas o cardápio selecionado na tela precisa ser
  // reavaliado para não continuar apontando pro cardápio da org anterior.
  useEffect(() => {
    setSelectedMenuId(null);
  }, [orgId]);

  // Roda em TODO acesso à tela (não só quando menus vem vazio) — uma
  // organização já existente pode ter cardápio principal mas não ter a
  // categoria "Geral"/estações padrão ainda (idempotente no backend, ver
  // VenueMenuEnsureDefaultService).
  useEffect(() => {
    if (!orgId) return;
    ensureDefault.mutate(undefined, {
      onSuccess: (result) => {
        setSelectedMenuId((current) => current ?? result.menu.id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (selectedMenuId !== null || !menus || menus.length === 0) return;
    const main = menus.find((m) => m.isMain) ?? menus[0];
    setSelectedMenuId(main.id);
  }, [menus, selectedMenuId]);

  // Preview e "Publicar" atuam sobre o cardápio SELECIONADO — nunca
  // assumem que é sempre o principal (a organização pode ter mais de um
  // cardápio e o usuário estar editando um que não é o principal).
  const selectedMenu = menus?.find((m) => m.id === selectedMenuId) ?? null;
  const { data: selectedMenuItems } = useVenueMenuItems(orgId, selectedMenuId);
  const { data: categories } = useVenueCategories(orgId, selectedMenuId);

  const defaultCategoryId = (() => {
    if (ensureDefault.data?.menu.id === selectedMenuId) return ensureDefault.data.defaultCategoryId;
    return categories?.find((c) => c.nome.trim().toLowerCase() === "geral")?.id ?? categories?.[0]?.id ?? null;
  })();

  // O link/QR público sempre aponta pro cardápio PRINCIPAL (isMain), não
  // necessariamente o selecionado aqui — publicar um cardápio secundário
  // não gera link próprio (o público só tem espaço pra 1 cardápio).
  const canShare = Boolean(currentOrg?.slug) && selectedMenu?.isMain && selectedMenu?.status === "PUBLISHED";
  const canPublish = selectedMenu?.status === "DRAFT" && (selectedMenuItems?.length ?? 0) > 0;

  const previewPanel = orgId ? (
    <div className="space-y-5">
      <MenuPreviewPhone orgId={orgId} menuId={selectedMenuId} />
      {canShare ? (
        <>
          <MenuSharePanel orgId={orgId} orgSlug={currentOrg!.slug!} />
          <VenuePublicProfileForm orgId={orgId} />
        </>
      ) : (
        <div className="rounded-[22px] border border-dashed border-black/10 bg-black/[0.015] p-5 text-center">
          <p className="text-xs text-muted-foreground">
            {!selectedMenu?.isMain
              ? "O link e o QR code de divulgação são sempre do cardápio principal — selecione-o para publicar e compartilhar."
              : canPublish
                ? 'Clique em "Publicar cardápio" para gerar o link e o QR code de divulgação.'
                : "Adicione produtos e publique o cardápio para gerar o link e o QR code de divulgação."}
          </p>
        </div>
      )}
    </div>
  ) : null;

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
            <Button onClick={() => guard(() => {})}>Novo produto</Button>
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
      <MenuHeader
        orgId={orgId}
        orgSlug={currentOrg?.slug ?? null}
        menu={selectedMenu}
        menus={menus ?? []}
        onSelectMenu={setSelectedMenuId}
        onManageMenus={() => setManageMenusOpen(true)}
        onManageStations={() => setStationsOpen(true)}
        onCreateProduct={() => { setTab("produtos"); setCreateProductOpen(true); }}
        onBulkCreateProducts={() => { setTab("produtos"); setBulkCreateOpen(true); }}
      />

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <div className="flex items-center justify-between gap-3">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-max min-w-full sm:w-fit">
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="categorias">Categorias</TabsTrigger>
                <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
              </TabsList>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 xl:hidden"
              onClick={() => setMobilePreviewOpen(true)}
            >
              <Smartphone size={14} /> Ver preview
            </Button>
          </div>

          <div className="mt-4">
            <TabsContent value="produtos">
              <ProdutosTab
                orgId={orgId}
                menuId={selectedMenuId}
                defaultCategoryId={defaultCategoryId}
                createOpen={createProductOpen}
                onCreateOpenChange={setCreateProductOpen}
              />
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
          </div>
        </Tabs>

        <div className="hidden xl:block">{previewPanel}</div>
      </div>

      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Preview do cardápio</SheetTitle>
          </SheetHeader>
          {/* Só monta enquanto aberto — evita duplicar a query de preview lado a lado com o painel xl:block. */}
          <div className="px-4 pb-4">{mobilePreviewOpen ? previewPanel : null}</div>
        </SheetContent>
      </Sheet>

      <ManageMenusDialog orgId={orgId} open={manageMenusOpen} onOpenChange={setManageMenusOpen} />
      <StationsSheet orgId={orgId} open={stationsOpen} onOpenChange={setStationsOpen} />

      <ProdutoBulkCreateDialog
        orgId={orgId}
        menuId={selectedMenuId}
        defaultCategoryId={defaultCategoryId}
        open={bulkCreateOpen}
        onOpenChange={setBulkCreateOpen}
        onCreated={() => {}}
      />
    </PageContainer>
  );
}
