"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { useUrlTab } from "../_hooks/use-url-tab";
import { useEnsureDefaultMenu, useVenueMenuMutations, useVenueMenus } from "./_hooks/use-venue-menus";
import { useVenueMenuItems } from "./_hooks/use-venue-menu-items";
import { useVenueCategories } from "./_hooks/use-venue-categories";
import { ProdutosTab } from "./_components/produtos-tab";
import { CategoriasTab } from "./_components/categorias-tab";
import { AdicionaisTab } from "./_components/adicionais-tab";
import { EstacoesTab } from "./_components/estacoes-tab";
import { MenuPreviewPhone } from "./_components/menu-preview-phone";
import { MenuHeader } from "./_components/menu-header";
import { ManageMenusDialog } from "./_components/manage-menus-dialog";
import { AmenitiesDialog } from "./_components/amenities-dialog";
import { BusinessHoursSummary } from "./_components/business-hours-summary";
import { BusinessHoursDialog } from "./_components/business-hours-dialog";
import { ProdutoBulkCreateDialog } from "./_components/produto-bulk-create-dialog";

const TABS = ["produtos", "categorias", "adicionais", "estacoes"] as const;
type TabKey = (typeof TABS)[number];

function CardapioSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title="Cardápio" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_392px]">
        <div className="space-y-6">
          <Skeleton className="aspect-[430/190] max-h-64 w-full rounded-card" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
        <Skeleton className="hidden h-[760px] w-full rounded-[36px] xl:block" />
      </div>
    </div>
  );
}

function CardapioContent() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { can } = useVenueAccess();
  const { guard } = useRequireWorkspace();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "produtos");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [manageMenusOpen, setManageMenusOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [businessHoursOpen, setBusinessHoursOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;
  const { data: menus } = useVenueMenus(orgId);
  const ensureDefault = useEnsureDefaultMenu(orgId ?? -1);
  const { publish } = useVenueMenuMutations(orgId ?? -1);

  // Ao trocar de organização, o cardápio selecionado precisa ser reavaliado
  // (o cache de cada query já é isolado por orgId).
  useEffect(() => {
    setSelectedMenuId(null);
  }, [orgId]);

  // Roda em TODO acesso (idempotente no backend): garante cardápio principal
  // + categoria "Geral" + estações padrão, criando só o que faltar.
  useEffect(() => {
    if (!orgId) return;
    ensureDefault.mutate(undefined, { onSuccess: (result) => setSelectedMenuId((current) => current ?? result.menu.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (selectedMenuId !== null || !menus || menus.length === 0) return;
    const main = menus.find((m) => m.isMain) ?? menus[0];
    setSelectedMenuId(main.id);
  }, [menus, selectedMenuId]);

  // Preview e "Publicar" atuam sobre o cardápio SELECIONADO — a organização
  // pode ter mais de um e estar editando um que não é o principal.
  const selectedMenu = menus?.find((m) => m.id === selectedMenuId) ?? null;
  const { data: selectedMenuItems } = useVenueMenuItems(orgId, selectedMenuId);
  const { data: categories } = useVenueCategories(orgId, selectedMenuId);

  const defaultCategoryId = (() => {
    if (ensureDefault.data?.menu.id === selectedMenuId) return ensureDefault.data.defaultCategoryId;
    return categories?.find((c) => c.nome.trim().toLowerCase() === "geral")?.id ?? categories?.[0]?.id ?? null;
  })();

  const canPublish = selectedMenu?.status === "DRAFT" && (selectedMenuItems?.length ?? 0) > 0;

  const handlePublish = () => {
    if (!selectedMenuId) return;
    publish.mutate(selectedMenuId, {
      onSuccess: () => toast.success(selectedMenu?.isMain ? "Cardápio publicado — já está no link público" : "Cardápio publicado"),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível publicar o cardápio.")),
    });
  };

  if (loadingOrgs || loadingModules) return <CardapioSkeleton />;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cardápio" actions={<Button leftIcon="plus" onClick={() => guard(() => {})}>Novo produto</Button>} />
        <EmptyState icon="utensils" title="Nenhum produto ainda" description="Crie seu workspace pra começar a montar o cardápio." action={<Button leftIcon="plus" onClick={() => guard(() => {})}>Novo produto</Button>} />
      </div>
    );
  }

  const openCreate = () => {
    setTab("produtos");
    setCreateProductOpen(true);
  };
  const openBulk = () => {
    setTab("produtos");
    setCreateProductOpen(false);
    setBulkCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cardápio"
        actions={
          <>
            <BusinessHoursSummary orgId={orgId} onClick={() => setBusinessHoursOpen(true)} />
            <Button variant="outline" leftIcon="info" onClick={() => setAmenitiesOpen(true)}>
              Informações úteis
            </Button>
            <Button variant="outline" leftIcon="mobile" className="xl:hidden" onClick={() => setMobilePreviewOpen(true)}>
              Ver prévia
            </Button>
            <Button leftIcon="plus" onClick={openCreate}>
              Adicionar produto
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_392px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <MenuHeader orgId={orgId} orgName={currentOrg?.nome ?? ""} orgSlug={currentOrg?.slug ?? null} menu={selectedMenu} menus={menus ?? []} onSelectMenu={setSelectedMenuId} canPublish={canPublish} publishing={publish.isPending} onPublish={handlePublish} onManageMenus={() => setManageMenusOpen(true)} />

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList variant="line">
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
              <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
              <TabsTrigger value="estacoes">Estações</TabsTrigger>
            </TabsList>
            <TabsContent value="produtos">
              <ProdutosTab orgId={orgId} menuId={selectedMenuId} defaultCategoryId={defaultCategoryId} createOpen={createProductOpen} onCreateOpenChange={setCreateProductOpen} onOpenBulk={openBulk} />
            </TabsContent>
            <TabsContent value="categorias">
              <CategoriasTab orgId={orgId} menus={menus ?? []} selectedMenuId={selectedMenuId} onSelectMenu={setSelectedMenuId} />
            </TabsContent>
            <TabsContent value="adicionais">
              <AdicionaisTab orgId={orgId} />
            </TabsContent>
            <TabsContent value="estacoes">
              <EstacoesTab orgId={orgId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Prévia ao vivo: coluna fixa no desktop largo */}
        <aside className="hidden xl:block xl:sticky xl:top-24">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Prévia ao vivo</h2>
              <span className="text-caption text-muted-foreground">{selectedMenu?.nome}</span>
            </div>
            <MenuPreviewPhone orgId={orgId} menuId={selectedMenuId} height={640} />
          </Card>
        </aside>
      </div>

      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent side="bottom" className="max-h-[94dvh]">
          <SheetHeader>
            <SheetTitle>Prévia do cardápio</SheetTitle>
          </SheetHeader>
          {/* Só monta enquanto aberto — evita duplicar a query do preview com o painel xl. */}
          <div className="overflow-y-auto px-4 pb-4">{mobilePreviewOpen ? <MenuPreviewPhone orgId={orgId} menuId={selectedMenuId} height={Math.max(420, Math.round((typeof window !== "undefined" ? window.innerHeight : 800) * 0.68))} /> : null}</div>
        </SheetContent>
      </Sheet>

      <ManageMenusDialog orgId={orgId} open={manageMenusOpen} onOpenChange={setManageMenusOpen} selectedMenuId={selectedMenuId} onSelectMenu={setSelectedMenuId} />
      <AmenitiesDialog orgId={orgId} open={amenitiesOpen} onOpenChange={setAmenitiesOpen} />
      <BusinessHoursDialog orgId={orgId} canManage={can("organization.settings.manage")} open={businessHoursOpen} onOpenChange={setBusinessHoursOpen} />
      <ProdutoBulkCreateDialog orgId={orgId} menuId={selectedMenuId} defaultCategoryId={defaultCategoryId} open={bulkCreateOpen} onOpenChange={setBulkCreateOpen} onCreated={() => {}} />
    </div>
  );
}

export default function VenueCardapioPage() {
  return (
    <Suspense fallback={<CardapioSkeleton />}>
      <CardapioContent />
    </Suspense>
  );
}
