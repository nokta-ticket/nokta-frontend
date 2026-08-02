"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_STOCK_CONTROL_LABEL, type VenueStockControl } from "@/services/venue-menu";
import { useVenueProductMutations } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { ImageField } from "./image-field";
import { MoneyField } from "./money-field";
import { CategoryCombobox } from "./category-combobox";

const NO_STATION = "NONE";

/**
 * Produto nasce sempre vinculado ao cardápio selecionado na tela — nunca
 * fica órfão esperando um passo manual de "adicionar a um cardápio"
 * depois (ver ProdutoCardapiosSection, que continua existindo só para
 * vincular a OUTROS cardápios além deste). categoryId vai junto de
 * menuId no mesmo POST /products (ver CreateVenueProductPayload).
 */
export function ProdutoCreateDialog({
  orgId,
  menuId,
  defaultCategoryId,
  open,
  onOpenChange,
  onCreated,
}: {
  orgId: number;
  menuId: number | null;
  defaultCategoryId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (productId: number) => void;
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
  // primeiro render) — sem isso, abrir o dialog rápido demais deixaria
  // categoryId travado em null mesmo depois de "Geral" existir.
  useEffect(() => {
    if (categoryId === null && defaultCategoryId !== null) {
      setCategoryId(defaultCategoryId);
    }
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
          toast.success(`Categoria "${category.nome}" criada.`);
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
      {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        preparationStationId: stationId === NO_STATION ? undefined : Number(stationId),
        variantName: variantName.trim() || undefined,
        sku: sku.trim() || undefined,
        priceCents,
        stockControl,
        menuId,
        categoryId,
      },
      {
        onSuccess: (product) => {
          toast.success("Produto criado.");
          reset();
          onOpenChange(false);
          onCreated(product.id);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o produto.")),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="produto-nome">Nome</Label>
              <Input
                id="produto-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Cerveja Long Neck"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="produto-descricao">Descrição (opcional)</Label>
              <Textarea
                id="produto-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
              />
            </div>
            <ImageField value={imageUrl} onChange={setImageUrl} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <CategoryCombobox
                  categories={categories ?? []}
                  value={categoryId}
                  onSelectExisting={setCategoryId}
                  onCreateNew={handleCreateCategory}
                  disabled={createCategory.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Estação (opcional)</Label>
                <Select value={stationId} onValueChange={setStationId}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_STATION}>Sem estação</SelectItem>
                    {(stations ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <MoneyField label="Preço" cents={priceCents} onChange={setPriceCents} />
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black/80">
                <ChevronDown size={16} className={advancedOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                Configurações avançadas
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-4 rounded-xl border border-black/10 p-3">
                <p className="text-xs text-black/50">
                  Nome da variação e SKU — se não informar, a variação é criada como &quot;Padrão&quot;, sem SKU.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="variante-nome">Nome da variação</Label>
                    <Input
                      id="variante-nome"
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                      placeholder="Padrão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variante-sku">SKU</Label>
                    <Input
                      id="variante-sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Normalizado ao salvar"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Controle de estoque</Label>
                  <Select value={stockControl} onValueChange={(v) => setStockControl(v as VenueStockControl)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(VENUE_STOCK_CONTROL_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? "Criando…" : "Criar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
