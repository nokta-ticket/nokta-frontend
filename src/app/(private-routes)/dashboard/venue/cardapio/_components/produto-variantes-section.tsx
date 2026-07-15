"use client";

import { useEffect, useState } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  VENUE_STOCK_CONTROL_LABEL,
  centsToBRL,
  type VenueProductVariant,
  type VenueStockControl,
} from "@/services/venue-menu";
import { useVenueVariantMutations, useVenueVariants } from "../_hooks/use-venue-variants";
import { ProductStatusBadge } from "./venue-status-badge";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { ConfirmDialog } from "./confirm-dialog";
import { MoneyField } from "./money-field";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function VariantFormDialog({
  open,
  onOpenChange,
  variant,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  variant: VenueProductVariant | null;
  onSubmit: (values: { nome: string; sku: string; priceCents: number; stockControl: VenueStockControl }) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(variant?.nome ?? "");
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [priceCents, setPriceCents] = useState(variant?.priceCents ?? 0);
  const [stockControl, setStockControl] = useState<VenueStockControl>(variant?.stockControl ?? "NONE");

  useEffect(() => {
    if (open) {
      setNome(variant?.nome ?? "");
      setSku(variant?.sku ?? "");
      setPriceCents(variant?.priceCents ?? 0);
      setStockControl(variant?.stockControl ?? "NONE");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variant?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{variant ? "Editar variação" : "Nova variação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="var-nome">Nome</Label>
              <Input id="var-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: 500ml" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="var-sku">SKU (opcional)</Label>
              <Input id="var-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nome.trim()}
            onClick={() => onSubmit({ nome: nome.trim(), sku: sku.trim(), priceCents, stockControl })}
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProdutoVariantesSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: variants, isLoading, isError, refetch } = useVenueVariants(orgId, productId);
  const { create, update, setDefault, archive, setAvailability, reorder } = useVenueVariantMutations(
    orgId,
    productId,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueProductVariant | null>(null);
  const [archiving, setArchiving] = useState<VenueProductVariant | null>(null);

  const list = variants ?? [];
  const activeCount = list.filter((v) => v.status !== "ARCHIVED").length;

  if (isError) {
    return <ErrorState description="Não foi possível carregar as variações." onRetry={() => refetch()} />;
  }
  if (isLoading) return <TableSkeleton />;

  const handleSubmit = (values: { nome: string; sku: string; priceCents: number; stockControl: VenueStockControl }) => {
    const payload = {
      nome: values.nome,
      sku: values.sku || undefined,
      priceCents: values.priceCents,
      stockControl: values.stockControl,
    };
    const mutation = editing
      ? update.mutateAsync({ variantId: editing.id, payload })
      : create.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Variação atualizada." : "Variação criada.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a variação.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const payload = buildSwapReorderPayload(list, index, target);
    reorder.mutate(payload, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")),
    });
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
        <Plus size={16} /> Nova variação
      </Button>

      <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
        {list.map((variant, i) => {
          const archived = variant.status === "ARCHIVED";
          const canArchive = !archived && activeCount > 1;
          return (
            <li key={variant.id} className="space-y-2 px-3 py-3">
              <div className="flex items-center gap-2">
                <ReorderControls
                  index={i}
                  total={list.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  disabled={reorder.isPending}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {variant.isDefault ? <Star size={13} className="fill-violet-500 text-violet-500" /> : null}
                    <p className="truncate text-sm font-medium text-gray-900">{variant.nome}</p>
                  </div>
                  <p className="text-xs text-black/50">
                    {variant.sku ? `SKU ${variant.sku} · ` : ""}
                    {centsToBRL(variant.priceCents)} · {VENUE_STOCK_CONTROL_LABEL[variant.stockControl]}
                  </p>
                </div>
                <ProductStatusBadge status={variant.status} />
              </div>

              <div className="flex flex-wrap gap-2 pl-8">
                <Button variant="outline" size="sm" onClick={() => { setEditing(variant); setFormOpen(true); }}>
                  Editar
                </Button>
                {!variant.isDefault && !archived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={setDefault.isPending}
                    onClick={() =>
                      setDefault.mutate(variant.id, {
                        onSuccess: () => toast.success("Variação definida como padrão."),
                        onError: (err) =>
                          toast.error(getErrorMessage(err, "Não foi possível definir como padrão.")),
                      })
                    }
                  >
                    Definir como padrão
                  </Button>
                ) : null}
                {!archived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={setAvailability.isPending}
                    onClick={() => {
                      const next = variant.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT";
                      setAvailability.mutate(
                        { variantId: variant.id, status: next },
                        {
                          onError: (err) =>
                            toast.error(getErrorMessage(err, "Não foi possível atualizar a disponibilidade.")),
                        },
                      );
                    }}
                  >
                    {variant.status === "SOLD_OUT" ? "Reativar" : "Marcar esgotada"}
                  </Button>
                ) : null}
                {canArchive ? (
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setArchiving(variant)}>
                    Arquivar
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <VariantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        variant={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar variação"
        description={
          archiving?.isDefault
            ? `"${archiving?.nome}" é a variação padrão. Ao arquivar, outra variação será promovida a padrão automaticamente.`
            : `Tem certeza que deseja arquivar "${archiving?.nome}"?`
        }
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() => {
          if (!archiving) return;
          archive.mutate(archiving.id, {
            onSuccess: () => { toast.success("Variação arquivada."); setArchiving(null); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar a variação.")),
          });
        }}
      />
    </div>
  );
}
