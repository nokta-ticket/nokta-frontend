"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueProductModifierGroup } from "@/services/venue-menu";
import { useVenueModifierGroups } from "../_hooks/use-venue-modifier-groups";
import {
  useVenueProductModifierGroupMutations,
  useVenueProductModifierGroups,
} from "../_hooks/use-venue-product-modifier-groups";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "../../../_components/states/empty-state";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function validateRules(required: boolean, minSelect: number, maxSelect: number | null, activeOptions: number) {
  if (minSelect < 0) return "Mínimo não pode ser negativo.";
  if (maxSelect !== null && maxSelect < minSelect) return "Máximo deve ser maior ou igual ao mínimo.";
  if (required && minSelect < 1) return "Grupo obrigatório exige mínimo de pelo menos 1.";
  if (maxSelect !== null && maxSelect > activeOptions) {
    return `Máximo (${maxSelect}) não pode ser maior que as opções ativas do grupo (${activeOptions}).`;
  }
  return null;
}

function LinkRow({
  orgId,
  productId,
  link,
  onRequestRemove,
}: {
  orgId: number;
  productId: number;
  link: VenueProductModifierGroup;
  onRequestRemove: () => void;
}) {
  const { update } = useVenueProductModifierGroupMutations(orgId, productId);
  const [required, setRequired] = useState(link.required);
  const [minSelect, setMinSelect] = useState(String(link.minSelect));
  const [maxSelect, setMaxSelect] = useState(link.maxSelect !== null ? String(link.maxSelect) : "");

  const activeOptions = link.group.options.filter((o) => o.active).length;

  const save = () => {
    const min = Number(minSelect) || 0;
    const max = maxSelect.trim() === "" ? null : Number(maxSelect);
    const error = validateRules(required, min, max, activeOptions);
    if (error) {
      toast.error(error);
      return;
    }
    update.mutate(
      { linkId: link.id, payload: { required, minSelect: min, maxSelect: max ?? undefined } },
      {
        onSuccess: () => toast.success("Regras do grupo atualizadas."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar as regras.")),
      },
    );
  };

  return (
    <li className="space-y-3 rounded-xl border border-black/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{link.group.nome}</p>
          <p className="text-xs text-black/50">{activeOptions} opções ativas</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Remover vínculo" onClick={onRequestRemove}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Obrigatório</Label>
          <Switch checked={required} onCheckedChange={setRequired} />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs">Mínimo</Label>
          <Input
            type="number"
            min={0}
            value={minSelect}
            onChange={(e) => setMinSelect(e.target.value)}
          />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs">Máximo</Label>
          <Input
            type="number"
            min={0}
            placeholder="Sem limite"
            value={maxSelect}
            onChange={(e) => setMaxSelect(e.target.value)}
          />
        </div>
        <Button size="sm" disabled={update.isPending} onClick={save}>
          Salvar regras
        </Button>
      </div>
    </li>
  );
}

export function ProdutoAdicionaisSection({ orgId, productId }: { orgId: number; productId: number }) {
  const { data: links, isLoading, isError, refetch } = useVenueProductModifierGroups(orgId, productId);
  const { data: allGroups } = useVenueModifierGroups(orgId);
  const { create, remove } = useVenueProductModifierGroupMutations(orgId, productId);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [removing, setRemoving] = useState<VenueProductModifierGroup | null>(null);

  if (isError) {
    return <ErrorState description="Não foi possível carregar os adicionais do produto." onRetry={() => refetch()} />;
  }
  if (isLoading) return <BlockSkeleton className="h-64" />;

  const list = links ?? [];
  const linkedGroupIds = new Set(list.map((l) => l.modifierGroupId));
  const availableGroups = (allGroups ?? []).filter((g) => !linkedGroupIds.has(g.id) && g.active);

  const handleAdd = () => {
    if (!selectedGroupId) return;
    create.mutate(
      { modifierGroupId: Number(selectedGroupId) },
      {
        onSuccess: () => {
          toast.success("Grupo vinculado ao produto.");
          setSelectedGroupId("");
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível vincular o grupo.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <EmptyState
          title="Nenhum adicional vinculado"
          description="Vincule grupos de adicionais (cadastrados na aba Adicionais) para oferecer personalizações neste produto."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((link) => (
            <LinkRow
              key={link.id}
              orgId={orgId}
              productId={productId}
              link={link}
              onRequestRemove={() => setRemoving(link)}
            />
          ))}
        </ul>
      )}

      {availableGroups.length > 0 ? (
        <div className="flex items-end gap-2 rounded-xl border border-dashed border-black/20 p-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Vincular grupo existente</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
              <SelectContent>
                {availableGroups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={!selectedGroupId || create.isPending} onClick={handleAdd}>
            <Plus size={14} /> Vincular
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remover vínculo de adicional"
        description={`Remover "${removing?.group.nome}" deste produto? O grupo continua existindo para uso em outros produtos.`}
        confirmLabel="Remover"
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => { toast.success("Vínculo removido."); setRemoving(null); },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível remover o vínculo.")),
          });
        }}
      />
    </div>
  );
}
