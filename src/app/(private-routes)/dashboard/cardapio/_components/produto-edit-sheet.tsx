"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueProduct, useVenueProductMutations } from "../_hooks/use-venue-products";
import { useVenueStations } from "../_hooks/use-venue-stations";
import { ProductStatusBadge } from "./venue-status-badge";
import { ImageField } from "./image-field";
import { ProdutoVariantesSection } from "./produto-variantes-section";
import { ProdutoCardapiosSection } from "./produto-cardapios-section";
import { ProdutoAdicionaisSection } from "./produto-adicionais-section";
import { ProdutoEstoqueSection } from "./produto-estoque-section";

export type ProdutoEditSection = "geral" | "variantes" | "cardapios" | "adicionais" | "estoque";

const NO_STATION = "NONE";

const SECTIONS: { key: ProdutoEditSection; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "variantes", label: "Variações" },
  { key: "cardapios", label: "Cardápios" },
  { key: "adicionais", label: "Adicionais" },
  { key: "estoque", label: "Estoque" },
];

function DadosGeraisSection({ orgId, productId, onDirtyChange, registerSave }: { orgId: number; productId: number; onDirtyChange: (dirty: boolean) => void; registerSave: (fn: (() => void) | null) => void }) {
  const { data: product } = useVenueProduct(orgId, productId);
  const { data: stations } = useVenueStations(orgId);
  const { update, archive, setAvailability } = useVenueProductMutations(orgId);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [harmonizaCom, setHarmonizaCom] = useState("");
  const [contraindicacoes, setContraindicacoes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prepTime, setPrepTime] = useState("");
  const [stationId, setStationId] = useState(NO_STATION);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setNome(product.nome);
    setDescricao(product.descricao ?? "");
    setHarmonizaCom(product.harmonizaCom ?? "");
    setContraindicacoes(product.contraindicacoes ?? "");
    setImageUrl(product.imageUrl);
    setPrepTime(product.prepTimeMinutes ? String(product.prepTimeMinutes) : "");
    setStationId(product.preparationStationId ? String(product.preparationStationId) : NO_STATION);
  }, [product]);

  const dirty = Boolean(product) && (nome !== product!.nome || descricao !== (product!.descricao ?? "") || harmonizaCom !== (product!.harmonizaCom ?? "") || contraindicacoes !== (product!.contraindicacoes ?? "") || imageUrl !== product!.imageUrl || prepTime !== (product!.prepTimeMinutes ? String(product!.prepTimeMinutes) : "") || stationId !== (product!.preparationStationId ? String(product!.preparationStationId) : NO_STATION));

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const save = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    update.mutate(
      { productId, payload: { nome: nome.trim(), descricao: descricao.trim() || undefined, harmonizaCom: harmonizaCom.trim() || undefined, contraindicacoes: contraindicacoes.trim() || undefined, imageUrl: imageUrl ?? undefined, prepTimeMinutes: prepTime ? Number(prepTime) : undefined, preparationStationId: stationId === NO_STATION ? undefined : Number(stationId) } },
      { onSuccess: () => toast.success("Alterações salvas"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar as alterações.")) },
    );
  };

  useEffect(() => {
    registerSave(save);
    return () => registerSave(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, descricao, harmonizaCom, contraindicacoes, imageUrl, prepTime, stationId, productId]);

  if (!product) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  const archived = product.status === "ARCHIVED";

  return (
    <div className="space-y-5">
      <Field label="Nome" htmlFor="edit-nome" required>
        <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={archived} />
      </Field>
      <Field label="Descrição" htmlFor="edit-descricao" optional>
        <Textarea id="edit-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="min-h-20" disabled={archived} />
      </Field>
      <ImageField value={imageUrl} onChange={setImageUrl} label="Foto" hint="Quadrada (1:1) fica melhor no cardápio." />
      <FieldGroup columns={2}>
        <Field label="Estação de preparo" htmlFor="edit-estacao">
          <NativeSelect id="edit-estacao" value={stationId} onChange={(e) => setStationId(e.target.value)} disabled={archived}>
            <option value={NO_STATION}>Sem estação</option>
            {(stations ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tempo de preparo" htmlFor="edit-prep" optional>
          <Input id="edit-prep" type="number" inputMode="numeric" min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} suffix="min" disabled={archived} />
        </Field>
      </FieldGroup>
      <Field label="Harmoniza com" htmlFor="edit-harmoniza" optional hint="Aparece na tela do produto no cardápio público.">
        <Input id="edit-harmoniza" placeholder="Ex.: Porção de batata, vinho tinto seco" value={harmonizaCom} onChange={(e) => setHarmonizaCom(e.target.value)} disabled={archived} />
      </Field>
      <Field label="Contraindicações e alergênicos" htmlFor="edit-contraindicacoes" optional>
        <Input id="edit-contraindicacoes" placeholder="Ex.: Contém crustáceos e lactose" value={contraindicacoes} onChange={(e) => setContraindicacoes(e.target.value)} disabled={archived} />
      </Field>

      {!archived ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" leftIcon={product.status === "SOLD_OUT" ? "check-circle" : "ban"} loading={setAvailability.isPending} onClick={() => setAvailability.mutate({ productId, status: product.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT" }, { onSuccess: () => toast.success(product.status === "SOLD_OUT" ? "Produto reativado" : "Produto marcado como esgotado"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")) })}>
            {product.status === "SOLD_OUT" ? "Reativar produto" : "Marcar como esgotado"}
          </Button>
          <Button variant="destructive-soft" size="sm" leftIcon="trash" onClick={() => setArchiving(true)}>
            Arquivar produto
          </Button>
        </div>
      ) : (
        <p className="text-caption text-muted-foreground">Produto arquivado — não pode ser reativado por aqui.</p>
      )}

      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        title="Arquivar produto"
        description={`Arquivar "${product.nome}"? Ele some dos cardápios ativos, mas nada é excluído.`}
        confirmLabel="Arquivar"
        danger
        onConfirm={async () => {
          try {
            await archive.mutateAsync(productId);
            toast.success("Produto arquivado");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível arquivar o produto."));
            throw err;
          }
        }}
      />
    </div>
  );
}

/** Edição do produto em gaveta lateral: dados gerais, variações, cardápios, adicionais e estoque. */
export function ProdutoEditSheet({ orgId, productId, initialSection = "geral", open, onOpenChange }: { orgId: number; productId: number; initialSection?: ProdutoEditSection; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [section, setSection] = useState<ProdutoEditSection>(initialSection);
  const [dirty, setDirty] = useState(false);
  const [saveFn, setSaveFn] = useState<(() => void) | null>(null);
  const { data: product, isError, refetch } = useVenueProduct(orgId, productId);
  const { update } = useVenueProductMutations(orgId);

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [open, initialSection]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-2 pr-2">
            <SheetTitle className="truncate">{product?.nome ?? "Produto"}</SheetTitle>
            {product ? <ProductStatusBadge status={product.status} /> : null}
          </div>
          <Tabs value={section} onValueChange={(v) => setSection(v as ProdutoEditSection)} className="mt-2 gap-0">
            <TabsList variant="line" className="-mx-5 px-5">
              {SECTIONS.map((s) => (
                <TabsTrigger key={s.key} value={s.key}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </SheetHeader>

        <SheetBody>
          {isError ? (
            <ErrorState description="Não foi possível carregar o produto." onRetry={() => refetch()} />
          ) : section === "geral" ? (
            <DadosGeraisSection orgId={orgId} productId={productId} onDirtyChange={setDirty} registerSave={(fn) => setSaveFn(() => fn)} />
          ) : section === "variantes" ? (
            <ProdutoVariantesSection orgId={orgId} productId={productId} />
          ) : section === "cardapios" ? (
            <ProdutoCardapiosSection orgId={orgId} productId={productId} />
          ) : section === "adicionais" ? (
            <ProdutoAdicionaisSection orgId={orgId} productId={productId} />
          ) : (
            <ProdutoEstoqueSection orgId={orgId} productId={productId} />
          )}
        </SheetBody>

        {section === "geral" && product?.status !== "ARCHIVED" ? (
          <SheetFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button leftIcon="check" disabled={!dirty} loading={update.isPending} onClick={() => saveFn?.()}>
              Salvar alterações
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
