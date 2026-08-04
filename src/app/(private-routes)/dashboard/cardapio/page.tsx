"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ListChecks, Plus, Settings2, Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { buildMarketingUrl } from "@/lib/surfaces";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useEnsureDefaultMenu, useVenueMenuMutations, useVenueMenus } from "./_hooks/use-venue-menus";
import { useVenueMenuItems } from "./_hooks/use-venue-menu-items";
import { useVenueCategories } from "./_hooks/use-venue-categories";
import { ProdutosTab } from "./_components/produtos-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { AdicionaisTab } from "./_components/adicionais-tab";
import { MenuPreviewPhone } from "./_components/menu-preview-phone";
import { MenuSharePanel } from "./_components/menu-share-panel";
import { MenuHeader } from "./_components/menu-header";
import { ManageMenusDialog } from "./_components/manage-menus-dialog";
import { StationsSheet } from "./_components/stations-sheet";
import { AmenitiesDialog } from "./_components/amenities-dialog";
import { BusinessHoursSummary } from "./_components/business-hours-summary";
import { BusinessHoursDialog } from "./_components/business-hours-dialog";
import { ProdutoBulkCreateDialog } from "./_components/produto-bulk-create-dialog";

type TabKey = "produtos" | "categorias" | "adicionais";

export default function VenueCardapioPage() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { can } = useVenueAccess();
  const { guard } = useRequireWorkspace();
  const [tab, setTab] = useState<TabKey>("produtos");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [manageMenusOpen, setManageMenusOpen] = useState(false);
  const [stationsOpen, setStationsOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [businessHoursOpen, setBusinessHoursOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;

  const { data: menus } = useVenueMenus(orgId);
  const ensureDefault = useEnsureDefaultMenu(orgId ?? -1);
  const { publish } = useVenueMenuMutations(orgId ?? -1);

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
  // não gera link próprio (o público só tem espaço pra 1 cardápio). Todo
  // cardápio principal já nasce PUBLISHED (ver VenueMenuEnsureDefaultService),
  // então status não bloqueia mais o link — só cardápio arquivado (raro,
  // ação explícita do usuário) não tem link ativo.
  const canShare = Boolean(currentOrg?.slug) && selectedMenu?.isMain && selectedMenu?.status !== "ARCHIVED";
  const canOpenPublic = canShare;
  const canPublish = selectedMenu?.status === "DRAFT" && (selectedMenuItems?.length ?? 0) > 0;
  const publicUrl = currentOrg?.slug ? buildMarketingUrl(`/cardapio/${currentOrg.slug}`) : null;

  const handlePublish = () => {
    if (!selectedMenuId) return;
    publish.mutate(selectedMenuId, {
      onSuccess: () =>
        toast.success(
          selectedMenu?.isMain
            ? "Cardápio publicado! Já está disponível no link público."
            : "Cardápio publicado.",
        ),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível publicar o cardápio.")),
    });
  };

  const previewPanel = orgId ? <MenuPreviewPhone orgId={orgId} menuId={selectedMenuId} /> : null;

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader
          title="Cardápio"
          description="Gerencie seu cardápio, produtos, categorias e adicionais."
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
          description="Gerencie seu cardápio, produtos, categorias e adicionais."
          actions={
            <Button onClick={() => guard(() => {})}>
              <Plus size={16} /> Adicionar produto
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
      {/* TOP BAR */}
      <div className="mb-[30px] flex flex-wrap items-start gap-5">
        <div>
          <h1 className="m-0 text-[27px] font-bold tracking-[-0.02em] text-foreground">Cardápio</h1>
          <p className="mt-[7px] text-[14.5px] text-black/50">
            Gerencie seu cardápio, produtos, categorias e adicionais.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <BusinessHoursSummary orgId={orgId} onClick={() => setBusinessHoursOpen(true)} />

          {canOpenPublic && publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[42px] items-center gap-2 rounded-[11px] border border-black/10 bg-white px-4 text-sm font-medium text-foreground shadow-sm hover:bg-black/[0.015]"
            >
              <ExternalLink size={16} className="text-black/50" />
              Ver cardápio público
            </a>
          ) : null}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-[42px] gap-2 rounded-[11px]">
                <Share2 size={16} className="text-black/50" />
                Compartilhar
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              {canShare ? (
                <MenuSharePanel orgId={orgId} orgSlug={currentOrg!.slug!} />
              ) : (
                <div className="max-w-[260px] p-4 text-xs text-muted-foreground">
                  {!selectedMenu?.isMain
                    ? "O link e o QR code de divulgação são sempre do cardápio principal — selecione-o para compartilhar."
                    : "Este cardápio está arquivado e não tem link público ativo."}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-[42px] w-[42px] rounded-[11px]" aria-label="Mais opções">
                <Settings2 size={16} className="text-black/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setManageMenusOpen(true)}>Gerenciar cardápios</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStationsOpen(true)}>Estações de preparo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAmenitiesOpen(true)}>Informações úteis</DropdownMenuItem>
              {canPublish ? (
                <DropdownMenuItem disabled={publish.isPending} onClick={handlePublish}>
                  {publish.isPending ? "Publicando…" : "Publicar cardápio"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-[42px] gap-2 rounded-[11px] bg-violet-600 shadow-[0_8px_18px_rgba(109,40,217,.26)] hover:bg-violet-500">
                <Plus size={16} /> Adicionar produto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setTab("produtos"); setCreateProductOpen(true); }}>
                Adicionar um produto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTab("produtos"); setBulkCreateOpen(true); }}>
                <ListChecks size={14} /> Adicionar vários produtos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-11 xl:grid-cols-[1fr_400px]">
        {/* MAIN */}
        <div>
          <p className="mb-3.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">Cardápio atual</p>

          <div className="mb-[22px]">
            <MenuHeader
              orgId={orgId}
              orgName={currentOrg?.nome ?? ""}
              orgSlug={currentOrg?.slug ?? null}
              menu={selectedMenu}
              menus={menus ?? []}
              onSelectMenu={setSelectedMenuId}
            />
          </div>

          <div className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(20,20,35,.05),0_1px_3px_rgba(20,20,35,.03)]">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-6 pt-[18px]">
                <div className="-mb-px overflow-x-auto">
                  <TabsList className="h-auto w-max min-w-full gap-6 rounded-none border-0 bg-transparent p-0 sm:w-fit">
                    <TabsTrigger
                      value="produtos"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3.5 text-[14.5px] font-medium text-black/50 shadow-none data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
                    >
                      Produtos
                    </TabsTrigger>
                    <TabsTrigger
                      value="categorias"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3.5 text-[14.5px] font-medium text-black/50 shadow-none data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
                    >
                      Categorias
                    </TabsTrigger>
                    <TabsTrigger
                      value="adicionais"
                      className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3.5 text-[14.5px] font-medium text-black/50 shadow-none data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
                    >
                      Adicionais
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-2 shrink-0 gap-1.5 xl:hidden"
                  onClick={() => setMobilePreviewOpen(true)}
                >
                  <Smartphone size={14} /> Ver preview
                </Button>
              </div>

              <div className="p-6">
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
          </div>
        </div>

        {/* ASIDE / PREVIEW */}
        <div className="hidden border-l border-black/[0.06] pl-11 xl:block">
          <p className="mb-3.5 text-sm font-semibold text-foreground">Preview do cardápio</p>
          {previewPanel}
          <p className="mt-5 text-center text-[13px] text-black/50">Esta é uma visualização real do seu cardápio.</p>
          <p className="mt-3 rounded-xl bg-black/[0.02] p-3 text-center text-[12px] leading-relaxed text-black/45">
            Os destaques são definidos automaticamente pelos clientes. Esta seção aparecerá no cardápio quando houver favoritos suficientes.
          </p>
        </div>
      </div>

      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Preview do cardápio</SheetTitle>
          </SheetHeader>
          {/* Só monta enquanto aberto — evita duplicar a query de preview lado a lado com o painel xl:block. */}
          <div className="px-4 pb-4">
            {mobilePreviewOpen ? (
              <>
                {previewPanel}
                <p className="mt-3 rounded-xl bg-black/[0.02] p-3 text-center text-[12px] leading-relaxed text-black/45">
                  Os destaques são definidos automaticamente pelos clientes. Esta seção aparecerá no cardápio quando houver favoritos suficientes.
                </p>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ManageMenusDialog orgId={orgId} open={manageMenusOpen} onOpenChange={setManageMenusOpen} />
      <StationsSheet orgId={orgId} open={stationsOpen} onOpenChange={setStationsOpen} />
      <AmenitiesDialog orgId={orgId} open={amenitiesOpen} onOpenChange={setAmenitiesOpen} />
      <BusinessHoursDialog
        orgId={orgId}
        canManage={can("organization.settings.manage")}
        open={businessHoursOpen}
        onOpenChange={setBusinessHoursOpen}
      />

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
