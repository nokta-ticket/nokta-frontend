"use client";

import { useState } from "react";
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
import { ImageField } from "./image-field";
import { MoneyField } from "./money-field";

const NO_STATION = "NONE";

export function ProdutoCreateDialog({
  orgId,
  open,
  onOpenChange,
  onCreated,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (productId: number) => void;
}) {
  const { data: stations } = useVenueStations(orgId);
  const { create } = useVenueProductMutations(orgId);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState("");
  const [stationId, setStationId] = useState(NO_STATION);
  const [variantName, setVariantName] = useState("");
  const [sku, setSku] = useState("");
  const [priceCents, setPriceCents] = useState(0);
  const [stockControl, setStockControl] = useState<VenueStockControl>("NONE");

  const reset = () => {
    setNome("");
    setDescricao("");
    setImageUrl(null);
    setPrepTime("");
    setStationId(NO_STATION);
    setVariantName("");
    setSku("");
    setPriceCents(0);
    setStockControl("NONE");
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    create.mutate(
      {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        prepTimeMinutes: prepTime ? Number(prepTime) : undefined,
        preparationStationId: stationId === NO_STATION ? undefined : Number(stationId),
        variantName: variantName.trim() || undefined,
        sku: sku.trim() || undefined,
        priceCents,
        stockControl,
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
                <Label htmlFor="produto-prep">Tempo de preparo (min)</Label>
                <Input
                  id="produto-prep"
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Estação de preparo</Label>
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
          </div>

          <div className="space-y-4 rounded-xl border border-black/10 p-3">
            <p className="text-sm font-medium text-gray-900">Primeira variação</p>
            <p className="text-xs text-black/50">
              Se não informar um nome, ela é criada como &quot;Padrão&quot;.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="variante-nome">Nome (opcional)</Label>
                <Input
                  id="variante-nome"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Padrão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variante-sku">SKU (opcional)</Label>
                <Input
                  id="variante-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Normalizado ao salvar"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MoneyField label="Preço" cents={priceCents} onChange={setPriceCents} />
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
          </div>
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
