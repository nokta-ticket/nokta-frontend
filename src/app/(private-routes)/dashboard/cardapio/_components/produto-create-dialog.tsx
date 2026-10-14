"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { VENUE_STOCK_CONTROL_LABEL, type VenueStockControl } from "@/services/venue-menu";
import { useVenueProductMutations } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { ImageField } from "./image-field";
import { MoneyField } from "./money-field";
import { CategoryCombobox } from "./category-combobox";

const NO_STATION = "NONE";

/**
 * Produto nasce sempre vinculado ao cardápio selecionado — nunca fica órfão
 * esperando um passo manual de "adicionar a um cardápio". categoryId vai
 * junto de menuId no mesmo POST /products.
 */
export function ProdutoCreateDialog({
  orgId,
  menuId,
  defaultCategoryId,
  open,
  onOpenChange,
  onCreated,
  onOpenBulk,
}: {
  orgId: number;
  menuId: number | null;
  defaultCategoryId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (productId: number) => void;
  onOpenBulk?: () => void;
}) {
  const { data: stations } = useVenueStations(orgId);
  const { data: categories } = useVenueCategories(orgId, menuId);
  const { create } = useVenueProductMutations(orgId);
  const { create: createCategory } = useVenueCategoryMutations(orgId, menuId ?? -1);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(defaultCategoryId);
  const [stationId, setStationId] = useState(NO_STATION);
  const [priceCents, setPriceCents] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [variantName, setVariantName] = useState("");
  const [sku, setSku] = useState("");
  const [stockControl, setStockControl] = useState<VenueStockControl>("NONE");

  // defaultCategoryId chega assíncrono (ensure-default resolve depois do
  // primeiro render) — sem isso, abrir rápido deixaria a categoria em null.
  useEffect(() => {
    if (categoryId === null && defaultCategoryId !== null) setCategoryId(defaultCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCategoryId]);

  const reset = () => {
    setNome("");
    setDescricao("");
    setImageUrl(null);
    setCategoryId(defaultCategoryId);
    setStationId(NO_STATION);
    setPriceCents(0);
    setAdvancedOpen(false);
    setVariantName("");
    setSku("");
    setStockControl("NONE");
  };

  const handleCreateCategory = (nomeCategoria: string) => {
    createCategory.mutate(
      { nome: nomeCategoria },
      {
        onSuccess: (category) => {
          setCategoryId(category.id);
          toast.success(`Categoria "${category.nome}" criada`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")),
      },
    );
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (!menuId || !categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    create.mutate(
      { nome: nome.trim(), descricao: descricao.trim() || undefined, imageUrl: imageUrl ?? undefined, preparationStationId: stationId === NO_STATION ? undefined : Number(stationId), variantName: variantName.trim() || undefined, sku: sku.trim() || undefined, priceCents, stockControl, menuId, categoryId },
      {
        onSuccess: (product) => {
          toast.success("Produto criado");
          reset();
          onOpenChange(false);
          onCreated(product.id);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o produto.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Já entra no cardápio selecionado.
            {onOpenBulk ? (
              <>
                {" "}
                <button type="button" className="font-medium text-brand underline-offset-4 hover:underline" onClick={() => { onOpenChange(false); onOpenBulk(); }}>
                  Cadastrar vários de uma vez
                </button>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="produto-nome" required>
            <Input id="produto-nome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cerveja long neck" />
          </Field>
          <FieldGroup columns={2}>
            <Field label="Categoria" htmlFor="produto-categoria" required>
              <CategoryCombobox id="produto-categoria" categories={categories ?? []} value={categoryId} onSelectExisting={setCategoryId} onCreateNew={handleCreateCategory} disabled={createCategory.isPending} />
            </Field>
            <MoneyField id="produto-preco" label="Preço" cents={priceCents} onChange={setPriceCents} />
          </FieldGroup>
          <Field label="Descrição" htmlFor="produto-descricao" optional>
            <Textarea id="produto-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="min-h-20" placeholder="O que vem, como é servido…" />
          </Field>
          <FieldGroup columns={2}>
            <Field label="Estação de preparo" htmlFor="produto-estacao" optional>
              <NativeSelect id="produto-estacao" value={stationId} onChange={(e) => setStationId(e.target.value)}>
                <option value={NO_STATION}>Sem estação</option>
                {(stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <ImageField value={imageUrl} onChange={setImageUrl} label="Foto" hint="Quadrada (1:1) fica melhor." />
          </FieldGroup>

          <div>
            <button type="button" onClick={() => setAdvancedOpen((v) => !v)} aria-expanded={advancedOpen} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Icon name="chevron-down" size={11} className={cn("transition-transform duration-300 ease-out-soft", advancedOpen && "rotate-180")} />
              Variação, SKU e estoque
            </button>
            {advancedOpen ? (
              <div className="surface-inset mt-3 space-y-4 rounded-xl p-4">
                <p className="text-caption text-muted-foreground">Sem preencher, a variação é criada como &quot;Padrão&quot;, sem SKU. Mais variações (300 ml, 500 ml…) entram depois, na edição.</p>
                <FieldGroup columns={2}>
                  <Field label="Nome da variação" htmlFor="variante-nome">
                    <Input id="variante-nome" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="Padrão" />
                  </Field>
                  <Field label="SKU" htmlFor="variante-sku">
                    <Input id="variante-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Normalizado ao salvar" />
                  </Field>
                </FieldGroup>
                <Field label="Controle de estoque" htmlFor="variante-estoque">
                  <NativeSelect id="variante-estoque" value={stockControl} onChange={(e) => setStockControl(e.target.value as VenueStockControl)}>
                    {Object.entries(VENUE_STOCK_CONTROL_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button loading={create.isPending} onClick={handleSubmit} leftIcon="plus">
            Criar produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
