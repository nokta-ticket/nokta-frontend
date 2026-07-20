"use client";

import { useEffect, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useVenueProduct, useVenueProductMutations } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { ProductStatusBadge } from "./venue-status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { ImageField } from "./image-field";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { ProdutoVariantesSection } from "./produto-variantes-section";
import { ProdutoCardapiosSection } from "./produto-cardapios-section";
import { ProdutoAdicionaisSection } from "./produto-adicionais-section";
import { ProdutoEstoqueSection } from "./produto-estoque-section";

export type ProdutoEditSection = "geral" | "variantes" | "cardapios" | "adicionais" | "estoque";

const NO_STATION = "NONE";

const SECTIONS: { key: ProdutoEditSection; label: string }[] = [
  { key: "geral", label: "Dados gerais" },
  { key: "variantes", label: "Variações" },
  { key: "cardapios", label: "Cardápios" },
  { key: "adicionais", label: "Adicionais" },
  { key: "estoque", label: "Estoque" },
];

function DadosGeraisSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: product } = useVenueProduct(orgId, productId);
  const { data: stations } = useVenueStations(orgId);
  const { update, archive, setAvailability } = useVenueProductMutations(orgId);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState("");
  const [stationId, setStationId] = useState(NO_STATION);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setNome(product.nome);
    setDescricao(product.descricao ?? "");
    setImageUrl(product.imageUrl);
    setPrepTime(product.prepTimeMinutes ? String(product.prepTimeMinutes) : "");
    setStationId(product.preparationStationId ? String(product.preparationStationId) : NO_STATION);
  }, [product]);

  if (!product) return <BlockSkeleton className="h-96" />;

  const archived = product.status === "ARCHIVED";

  const save = () => {
    update.mutate(
      {
        productId,
        payload: {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          imageUrl: imageUrl ?? undefined,
          prepTimeMinutes: prepTime ? Number(prepTime) : undefined,
          preparationStationId: stationId === NO_STATION ? undefined : Number(stationId),
        },
      },
      {
        onSuccess: () => toast.success("Alterações salvas."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar as alterações.")),
      },
    );
  };

  const toggleSoldOut = () => {
    const next = product.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT";
    setAvailability.mutate(
      { productId, status: next },
      {
        onSuccess: () =>
          toast.success(next === "SOLD_OUT" ? "Produto marcado como esgotado." : "Produto reativado."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ProductStatusBadge status={product.status} />
        {archived ? (
          <span className="text-xs text-black/50">
            Produto arquivado — não pode ser reativado por aqui.
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-nome">Nome</Label>
        <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-descricao">Descrição</Label>
        <Textarea id="edit-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
      </div>
      <ImageField value={imageUrl} onChange={setImageUrl} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit-prep">Tempo de preparo (min)</Label>
          <Input id="edit-prep" type="number" min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
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

      <Button disabled={update.isPending || !nome.trim()} onClick={save} className="w-full">
        {update.isPending ? "Salvando…" : "Salvar alterações"}
      </Button>

      {!archived ? (
        <div className="space-y-2 border-t border-black/10 pt-4">
          <Button variant="outline" className="w-full" onClick={toggleSoldOut} disabled={setAvailability.isPending}>
            {product.status === "SOLD_OUT" ? "Reativar produto" : "Marcar como esgotado"}
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-600"
            onClick={() => setArchiving(true)}
          >
            Arquivar produto
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        title="Arquivar produto"
        description={`Tem certeza que deseja arquivar "${product.nome}"? Ele deixa de aparecer nos cardápios ativos, mas nada é excluído.`}
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() =>
          archive.mutate(productId, {
            onSuccess: () => { toast.success("Produto arquivado."); setArchiving(false); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar o produto.")),
          })
        }
      />
    </div>
  );
}

export function ProdutoEditSheet({
  orgId,
  productId,
  initialSection = "geral",
  open,
  onOpenChange,
}: {
  orgId: number;
  productId: number;
  initialSection?: ProdutoEditSection;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [section, setSection] = useState<ProdutoEditSection>(initialSection);
  const { data: product, isError, refetch } = useVenueProduct(orgId, productId);

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [open, initialSection]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{product?.nome ?? "Produto"}</SheetTitle>
        </SheetHeader>

        <div className="flex gap-1 overflow-x-auto border-b border-black/10 px-4 pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                section === s.key ? "bg-violet-100 text-violet-700" : "text-black/60 hover:bg-black/5",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isError ? (
            <ErrorState description="Não foi possível carregar o produto." onRetry={() => refetch()} />
          ) : section === "geral" ? (
            <DadosGeraisSection orgId={orgId} productId={productId} />
          ) : section === "variantes" ? (
            <ProdutoVariantesSection orgId={orgId} productId={productId} />
          ) : section === "cardapios" ? (
            <ProdutoCardapiosSection orgId={orgId} productId={productId} />
          ) : section === "adicionais" ? (
            <ProdutoAdicionaisSection orgId={orgId} productId={productId} />
          ) : (
            <ProdutoEstoqueSection orgId={orgId} productId={productId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
