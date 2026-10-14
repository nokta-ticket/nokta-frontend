"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenueMenu, VenueMenuCategory, VenueMenuCategorySection } from "@/services/venue-menu";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { ImageField } from "./image-field";
import { CategoriaBulkCreateDialog } from "./categoria-bulk-create-dialog";

interface CategoryFormValues {
  nome: string;
  descricao: string;
  imageUrl: string | null;
  section: VenueMenuCategorySection;
}

function CategoryFormDialog({ open, onOpenChange, category, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; category: VenueMenuCategory | null; onSubmit: (values: CategoryFormValues) => void; loading: boolean }) {
  const [nome, setNome] = useState(category?.nome ?? "");
  const [descricao, setDescricao] = useState(category?.descricao ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.imageUrl ?? null);
  const [section, setSection] = useState<VenueMenuCategorySection>(category?.section ?? "MENU");

  useEffect(() => {
    if (open) {
      setNome(category?.nome ?? "");
      setDescricao(category?.descricao ?? "");
      setImageUrl(category?.imageUrl ?? null);
      setSection(category?.section ?? "MENU");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="categoria-nome" required>
            <Input id="categoria-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cervejas, Drinks, Porções" />
          </Field>
          <Field label="Descrição" htmlFor="categoria-descricao" optional>
            <Textarea id="categoria-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="min-h-20" />
          </Field>
          <ImageField value={imageUrl} onChange={setImageUrl} hint="Aparece como capa da categoria no cardápio público." />
          <label htmlFor="categoria-tabacaria" className="surface-inset flex cursor-pointer items-start justify-between gap-4 rounded-xl px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-foreground">Categoria da tabacaria</span>
              <span className="block text-caption text-muted-foreground">Aparece só na aba Tabacaria do cardápio, separada de bebidas e comidas.</span>
            </span>
            <Switch id="categoria-tabacaria" checked={section === "TOBACCO"} onCheckedChange={(checked) => setSection(checked ? "TOBACCO" : "MENU")} className="mt-0.5" />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit({ nome: nome.trim(), descricao: descricao.trim(), imageUrl, section })}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Linha arrastável (@dnd-kit/sortable) — a alça é a ÚNICA área que inicia
 * o drag (`listeners` só nela): o Switch e o editar continuam clicáveis
 * sem disparar um arrasto por acidente.
 */
function SortableCategoryRow({ category, index, onToggleActive, onEdit, activePending }: { category: VenueMenuCategory; index: number; onToggleActive: (checked: boolean) => void; onEdit: () => void; activePending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const image = category.imageUrl ? resolveMediaUrl(category.imageUrl) : null;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 bg-surface px-3 py-3 sm:px-4", index > 0 && "border-t border-border", isDragging && "relative z-10 rounded-xl shadow-card-hover ring-1 ring-brand-ring")}>
      <button type="button" {...attributes} {...listeners} aria-label="Arrastar para reordenar" className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-2 hover:text-foreground active:cursor-grabbing">
        <Icon name="grip-vertical" size={14} />
      </button>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-2 hairline">
        {image ? <Image src={image} alt="" fill sizes="40px" className="object-cover" unoptimized /> : <Icon name="tags" size={14} className="absolute inset-0 m-auto text-subtle-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("truncate text-sm font-medium", category.active ? "text-foreground" : "text-muted-foreground")}>{category.nome}</p>
          {category.section === "TOBACCO" ? <StatusBadge tone="brand" dot={false}>Tabacaria</StatusBadge> : null}
        </div>
        <p className="truncate text-caption text-muted-foreground tnum">
          {category.itemCount === 0 ? <span className="text-warning">Vazia — não aparece no cardápio público</span> : `${category.itemCount} ${category.itemCount === 1 ? "produto" : "produtos"}`}
          {category.descricao ? ` · ${category.descricao}` : ""}
        </p>
      </div>
      <Switch checked={category.active} aria-label={category.active ? "Desativar categoria" : "Ativar categoria"} disabled={activePending} onCheckedChange={onToggleActive} />
      <Button variant="subtle" size="icon-sm" aria-label="Editar categoria" onClick={onEdit}>
        <Icon name="edit" size={14} />
      </Button>
    </li>
  );
}

export function CategoriasTab({ orgId, menus, selectedMenuId, onSelectMenu }: { orgId: number; menus: VenueMenu[]; selectedMenuId: number | null; onSelectMenu: (menuId: number) => void }) {
  const { data: categories, isLoading, isError, refetch } = useVenueCategories(orgId, selectedMenuId);
  const { create, update, setActive, reorder } = useVenueCategoryMutations(orgId, selectedMenuId ?? -1);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<VenueMenuCategory | null>(null);
  // Ordem otimista durante/após o drag — sincronizada com a fonte real sempre que ela muda.
  const [orderedList, setOrderedList] = useState<VenueMenuCategory[]>(categories ?? []);
  useEffect(() => {
    setOrderedList(categories ?? []);
  }, [categories]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const list = orderedList;
  const selectedMenu = menus.find((m) => m.id === selectedMenuId) ?? null;
  const archived = selectedMenu?.status === "ARCHIVED";

  if (menus.length === 0) return <EmptyState icon="utensils" title="Nenhum cardápio ainda" description="Crie o primeiro cardápio em Cardápios pra organizar categorias." />;

  const handleSubmit = (values: CategoryFormValues) => {
    if (!selectedMenuId) return;
    const payload = { nome: values.nome, descricao: values.descricao || undefined, imageUrl: values.imageUrl ?? undefined, section: values.section };
    const mutation = editing ? update.mutateAsync({ categoryId: editing.id, payload }) : create.mutateAsync(payload);
    mutation
      .then(() => {
        toast.success(editing ? "Categoria atualizada" : "Categoria criada");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a categoria.")));
  };

  /** Solta em qualquer posição; manda o displayOrder de TODAS em lote; reverte se falhar. */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = list.findIndex((c) => c.id === active.id);
    const newIndex = list.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const previousList = list;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setOrderedList(reordered);
    reorder.mutate(
      { items: reordered.map((c, i) => ({ id: c.id, displayOrder: i })) },
      {
        onError: (err) => {
          setOrderedList(previousList);
          toast.error(getErrorMessage(err, "Não foi possível reordenar."));
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {menus.length > 1 ? (
          <div className="w-full sm:w-64">
            <NativeSelect aria-label="Cardápio" value={selectedMenuId ? String(selectedMenuId) : ""} onChange={(e) => onSelectMenu(Number(e.target.value))}>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.nome}
                  {menu.isMain ? " · principal" : ""}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <p className="text-body text-muted-foreground">Arraste pela alça pra mudar a ordem do cardápio.</p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon="list" disabled={!selectedMenuId || archived} onClick={() => setBulkOpen(true)}>
            Várias de uma vez
          </Button>
          <Button size="sm" leftIcon="plus" disabled={!selectedMenuId || archived} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Nova categoria
          </Button>
        </div>
      </div>

      {archived ? <Callout tone="warning">Este cardápio está arquivado — não dá pra criar categorias nele.</Callout> : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar as categorias." onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState icon="tags" title="Nenhuma categoria ainda" description="Crie Cervejas, Drinks ou Porções pra organizar o cardápio." action={<Button leftIcon="plus" onClick={() => setFormOpen(true)}>Nova categoria</Button>} />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={list.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {list.map((category, i) => (
                  <SortableCategoryRow
                    key={category.id}
                    index={i}
                    category={category}
                    activePending={setActive.isPending}
                    onToggleActive={(checked) => setActive.mutate({ categoryId: category.id, active: checked }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a categoria.")) })}
                    onEdit={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} onSubmit={handleSubmit} loading={create.isPending || update.isPending} />
      <CategoriaBulkCreateDialog orgId={orgId} menuId={selectedMenuId} open={bulkOpen} onOpenChange={setBulkOpen} onCreated={() => refetch()} />
    </div>
  );
}
