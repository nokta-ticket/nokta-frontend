"use client";

import { useEffect, useState } from "react";
import { GripVertical, ListChecks, Plus } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueMenu, VenueMenuCategory } from "@/services/venue-menu";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { ActiveBadge } from "./venue-status-badge";
import { ImageField } from "./image-field";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { CategoriaBulkCreateDialog } from "./categoria-bulk-create-dialog";

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: VenueMenuCategory | null;
  onSubmit: (values: { nome: string; descricao: string; imageUrl: string | null }) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(category?.nome ?? "");
  const [descricao, setDescricao] = useState(category?.descricao ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.imageUrl ?? null);

  useEffect(() => {
    if (open) {
      setNome(category?.nome ?? "");
      setDescricao(category?.descricao ?? "");
      setImageUrl(category?.imageUrl ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria-nome">Nome</Label>
            <Input
              id="categoria-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Cervejas, Drinks, Porções"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria-descricao">Descrição (opcional)</Label>
            <Textarea
              id="categoria-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>
          <ImageField value={imageUrl} onChange={setImageUrl} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nome.trim()}
            onClick={() =>
              onSubmit({ nome: nome.trim(), descricao: descricao.trim(), imageUrl })
            }
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Linha de categoria arrastável (@dnd-kit/sortable) — a alça (GripVertical)
 * é a única área que inicia o drag (`listeners`/`attributes` só nela),
 * nunca a linha inteira: precisa deixar "Editar"/o Switch clicáveis sem
 * disparar um drag por acidente.
 */
function SortableCategoryRow({
  category,
  onToggleActive,
  onEdit,
  activePending,
}: {
  category: VenueMenuCategory;
  onToggleActive: (checked: boolean) => void;
  onEdit: () => void;
  activePending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-white px-4 py-3 ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        className="shrink-0 cursor-grab touch-none text-black/30 active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{category.nome}</p>
        {category.descricao ? (
          <p className="line-clamp-2 break-words text-xs text-black/50">{category.descricao}</p>
        ) : null}
        {category.itemCount === 0 ? (
          <p className="mt-0.5 text-xs font-medium text-amber-600">
            Vazia — não aparece no cardápio público ainda
          </p>
        ) : null}
      </div>
      <ActiveBadge active={category.active} />
      <Switch
        checked={category.active}
        aria-label={category.active ? "Desativar categoria" : "Ativar categoria"}
        disabled={activePending}
        onCheckedChange={onToggleActive}
      />
      <Button variant="outline" size="sm" onClick={onEdit}>
        Editar
      </Button>
    </li>
  );
}

export function CategoriasTab({
  orgId,
  menus,
  selectedMenuId,
  onSelectMenu,
}: {
  orgId: number;
  menus: VenueMenu[];
  selectedMenuId: number | null;
  onSelectMenu: (menuId: number) => void;
}) {
  const { data: categories, isLoading, isError, refetch } = useVenueCategories(orgId, selectedMenuId);
  const { create, update, setActive, reorder } = useVenueCategoryMutations(
    orgId,
    selectedMenuId ?? -1,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<VenueMenuCategory | null>(null);
  // Ordem exibida otimisticamente durante/após o drag — atualiza na hora,
  // sem esperar a resposta do servidor. Sincronizada com `categories` (a
  // fonte real) sempre que ela mudar de referência (nova busca, outra
  // mutation invalidando a query); durante um drag em andamento não há
  // conflito porque o usuário só solta uma vez por gesto.
  const [orderedList, setOrderedList] = useState<VenueMenuCategory[]>(categories ?? []);
  useEffect(() => {
    setOrderedList(categories ?? []);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const list = orderedList;
  const selectedMenu = menus.find((m) => m.id === selectedMenuId) ?? null;

  if (menus.length === 0) {
    return (
      <EmptyState
        title="Nenhum cardápio ainda"
        description="Crie seu primeiro cardápio na aba Cardápios para poder organizar categorias."
      />
    );
  }

  const handleSubmit = (values: { nome: string; descricao: string; imageUrl: string | null }) => {
    if (!selectedMenuId) return;
    const payload = {
      nome: values.nome,
      descricao: values.descricao || undefined,
      imageUrl: values.imageUrl ?? undefined,
    };
    const mutation = editing
      ? update.mutateAsync({ categoryId: editing.id, payload })
      : create.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a categoria.")));
  };

  /**
   * Solta o drag em qualquer posição da lista (não só swap com o vizinho
   * adjacente, como nas antigas setas ↑↓) — arrastar até o topo já deixa a
   * categoria em 1º lugar num gesto só. Atualiza a ordem local na hora
   * (otimista) e manda o displayOrder de TODAS as categorias reordenadas
   * pro backend em lote (o endpoint /reorder já aceita isso). Em caso de
   * erro, desfaz o otimismo revertendo pra ordem anterior.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((c) => c.id === active.id);
    const newIndex = list.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousList = list;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setOrderedList(reordered);

    const payload = { items: reordered.map((c, i) => ({ id: c.id, displayOrder: i })) };
    reorder.mutate(payload, {
      onError: (err) => {
        setOrderedList(previousList);
        toast.error(getErrorMessage(err, "Não foi possível reordenar."));
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-sm text-black/60">Cardápio:</Label>
          <Select
            value={selectedMenuId ? String(selectedMenuId) : undefined}
            onValueChange={(v) => onSelectMenu(Number(v))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um cardápio" />
            </SelectTrigger>
            <SelectContent>
              {menus.map((menu) => (
                <SelectItem key={menu.id} value={String(menu.id)}>
                  {menu.nome} {menu.isMain ? "· Principal" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedMenuId || selectedMenu?.status === "ARCHIVED"}
            onClick={() => setBulkOpen(true)}
          >
            <ListChecks size={16} /> Adicionar várias
          </Button>
          <Button
            size="sm"
            disabled={!selectedMenuId || selectedMenu?.status === "ARCHIVED"}
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            <Plus size={16} /> Nova categoria
          </Button>
        </div>
      </div>

      {selectedMenu?.status === "ARCHIVED" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Este cardápio está arquivado — não é possível criar novas categorias nele.
        </p>
      ) : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar as categorias." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria ainda"
          description="Crie categorias como Cervejas, Drinks ou Porções para organizar o cardápio."
          actionLabel="Nova categoria"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={list.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-black/5">
                {list.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    activePending={setActive.isPending}
                    onToggleActive={(checked) =>
                      setActive.mutate(
                        { categoryId: category.id, active: checked },
                        {
                          onError: (err) =>
                            toast.error(getErrorMessage(err, "Não foi possível atualizar a categoria.")),
                        },
                      )
                    }
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

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />

      <CategoriaBulkCreateDialog
        orgId={orgId}
        menuId={selectedMenuId}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onCreated={() => refetch()}
      />
    </div>
  );
}
