"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { BusinessNeedGroup } from "@/services/platform";

export interface BusinessNeedSelectionState {
  /** Grupos marcados (o card em si). */
  selectedGroupKeys: Set<string>;
  /** Capacidades desmarcadas dentro de um grupo selecionado — omitida (chave ausente) = todas ligadas (default). */
  deselectedCapabilityKeysByGroup: Map<string, Set<string>>;
}

export function createDefaultSelection(groups: BusinessNeedGroup[]): BusinessNeedSelectionState {
  const selectedGroupKeys = new Set(groups.filter((g) => g.defaultSelected).map((g) => g.key));
  return { selectedGroupKeys, deselectedCapabilityKeysByGroup: new Map() };
}

/** Achata a seleção para o payload de POST .../activate-business-needs (omite capabilityKeys quando nada foi desmarcado em nenhum grupo selecionado). */
export function flattenSelection(groups: BusinessNeedGroup[], selection: BusinessNeedSelectionState) {
  const businessNeedKeys = [...selection.selectedGroupKeys];
  const hasAnyDeselection = businessNeedKeys.some((key) => (selection.deselectedCapabilityKeysByGroup.get(key)?.size ?? 0) > 0);

  if (!hasAnyDeselection) {
    return { businessNeedKeys, capabilityKeys: undefined as string[] | undefined };
  }

  const capabilityKeys: string[] = [];
  for (const group of groups) {
    if (!selection.selectedGroupKeys.has(group.key)) continue;
    const deselected = selection.deselectedCapabilityKeysByGroup.get(group.key);
    for (const cap of group.capabilities) {
      if (!deselected?.has(cap.key)) capabilityKeys.push(cap.key);
    }
  }
  return { businessNeedKeys, capabilityKeys };
}

function GroupCapabilityRow({
  capability,
  checked,
  alreadyActive,
  locked,
  groupSelected,
  onToggle,
  onDeactivate,
  deactivating,
}: {
  capability: BusinessNeedGroup["capabilities"][number];
  checked: boolean;
  alreadyActive: boolean;
  /** Não pode ser alternada pelo usuário (já ativa, ou obrigatória com o grupo selecionado). */
  locked: boolean;
  /** Grupo pai desmarcado — item aparece apagado/não interativo, mesmo sendo "Necessário" quando o grupo estiver ligado. */
  groupSelected: boolean;
  onToggle: () => void;
  onDeactivate?: () => void;
  deactivating?: boolean;
}) {
  const interactive = !locked && groupSelected;
  const dimmed = !groupSelected && !alreadyActive;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        dimmed ? "border-black/5 bg-black/[0.02] opacity-50" : locked ? "border-black/5 bg-black/[0.02]" : "border-black/10 hover:border-violet-300 hover:bg-violet-50/40"
      }`}
    >
      <label className={`flex flex-1 items-start gap-2.5 ${interactive ? "cursor-pointer" : "cursor-default"}`}>
        <Checkbox checked={checked} disabled={!interactive} onCheckedChange={onToggle} className="mt-0.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-gray-900">{capability.label}</span>
            {alreadyActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                <CheckCircle2 size={9} /> Ativa
              </span>
            ) : capability.required && groupSelected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black/50">
                <Lock size={9} /> Necessário
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs text-black/50">{capability.description}</span>
          {!alreadyActive && capability.required && groupSelected && capability.requiredReason ? (
            <span className="mt-1 block text-xs text-violet-700">{capability.requiredReason}</span>
          ) : null}
        </span>
      </label>
      {alreadyActive && onDeactivate ? (
        <Button variant="outline" size="sm" onClick={onDeactivate} disabled={deactivating} className="shrink-0">
          {deactivating ? "Desativando…" : "Desativar"}
        </Button>
      ) : null}
    </div>
  );
}

function GroupCard({
  group,
  selected,
  expanded,
  onToggleExpanded,
  deselectedKeys,
  activeCapabilityKeys,
  onToggleGroup,
  onToggleCapability,
  onDeactivateCapability,
  deactivatingKey,
  forceOpen,
}: {
  group: BusinessNeedGroup;
  selected: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  deselectedKeys: Set<string>;
  activeCapabilityKeys: Set<string> | null;
  onToggleGroup: () => void;
  onToggleCapability: (capabilityKey: string) => void;
  onDeactivateCapability?: (capabilityKey: string) => void;
  deactivatingKey?: string | null;
  forceOpen: boolean;
}) {
  const open = expanded || forceOpen;
  const activeCount = activeCapabilityKeys ? group.capabilities.filter((c) => activeCapabilityKeys.has(c.key)).length : 0;

  return (
    <Collapsible open={open}>
      <div className={`rounded-2xl border transition-colors ${selected ? "border-violet-300 bg-violet-50/30" : "border-black/10 bg-white"}`}>
        <div className="flex items-start gap-3 p-4">
          <Checkbox checked={selected} onCheckedChange={onToggleGroup} className="mt-0.5 shrink-0" aria-label={`Selecionar ${group.label}`} />
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex flex-1 items-start gap-3 text-left"
            aria-expanded={open}
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-gray-900">{group.label}</span>
                {activeCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                    {activeCount} ativa{activeCount > 1 ? "s" : ""}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-sm text-black/50">{group.description}</span>
            </span>
            <ChevronDown size={16} className={`mt-1 shrink-0 text-black/30 transition-transform ${open ? "rotate-180 text-violet-600" : ""}`} />
          </button>
        </div>

        <CollapsibleContent>
          <div className="space-y-2 px-4 pb-4">
            {group.capabilities.map((capability) => {
              const alreadyActive = activeCapabilityKeys?.has(capability.key) ?? false;
              // Item segue o grupo pai: grupo desmarcado = todos os itens
              // aparecem desmarcados (mesmo os "Necessário", que só fazem
              // sentido como obrigatórios quando o grupo está selecionado).
              const checked = alreadyActive || (selected && (capability.required || !deselectedKeys.has(capability.key)));
              return (
                <GroupCapabilityRow
                  key={capability.key}
                  capability={capability}
                  alreadyActive={alreadyActive}
                  checked={checked}
                  locked={alreadyActive || (selected && capability.required)}
                  groupSelected={selected}
                  onToggle={() => onToggleCapability(capability.key)}
                  onDeactivate={onDeactivateCapability ? () => onDeactivateCapability(capability.key) : undefined}
                  deactivating={deactivatingKey === capability.key}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function BusinessNeedGroupsPicker({
  groups,
  selection,
  onChange,
  activeCapabilityKeys,
  onDeactivateCapability,
  deactivatingKey,
}: {
  groups: BusinessNeedGroup[];
  selection: BusinessNeedSelectionState;
  onChange: (next: BusinessNeedSelectionState) => void;
  /** Quando informado (tela Explore), capacidades já ACTIVE aparecem travadas com badge "Ativa" em vez de checkbox editável. */
  activeCapabilityKeys?: Set<string>;
  /** Tela Explore: permite desativar uma capacidade já ativa diretamente na linha. */
  onDeactivateCapability?: (capabilityKey: string) => void;
  deactivatingKey?: string | null;
}) {
  // Expandir/recolher é puramente visual (ver o que tem dentro do grupo) —
  // deliberadamente separado de `selection`: clicar no card pra abrir não
  // pode desmarcar o grupo sem querer (só o checkbox faz isso).
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(selection.selectedGroupKeys));

  const toggleExpanded = (groupKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const toggleGroup = (groupKey: string) => {
    const nextGroups = new Set(selection.selectedGroupKeys);
    // Marcar ou desmarcar o grupo sempre reseta as exceções individuais
    // dele: selecionar o grupo liga todas as capacidades (default limpo),
    // desmarcar tira todas — sem sobras de uma seleção parcial anterior.
    const nextDeselected = new Map(selection.deselectedCapabilityKeysByGroup);
    nextDeselected.delete(groupKey);

    if (nextGroups.has(groupKey)) {
      nextGroups.delete(groupKey);
    } else {
      nextGroups.add(groupKey);
      setExpandedKeys((prev) => new Set(prev).add(groupKey));
    }
    onChange({ ...selection, selectedGroupKeys: nextGroups, deselectedCapabilityKeysByGroup: nextDeselected });
  };

  const toggleCapability = (groupKey: string, capability: BusinessNeedGroup["capabilities"][number]) => {
    if (capability.required || activeCapabilityKeys?.has(capability.key)) return;
    const nextByGroup = new Map(selection.deselectedCapabilityKeysByGroup);
    const current = new Set(nextByGroup.get(groupKey) ?? []);
    if (current.has(capability.key)) {
      current.delete(capability.key);
    } else {
      current.add(capability.key);
    }
    nextByGroup.set(groupKey, current);
    onChange({ ...selection, deselectedCapabilityKeysByGroup: nextByGroup });
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard
          key={group.key}
          group={group}
          selected={selection.selectedGroupKeys.has(group.key)}
          expanded={expandedKeys.has(group.key)}
          onToggleExpanded={() => toggleExpanded(group.key)}
          deselectedKeys={selection.deselectedCapabilityKeysByGroup.get(group.key) ?? new Set()}
          activeCapabilityKeys={activeCapabilityKeys ?? null}
          forceOpen={Boolean(activeCapabilityKeys) && group.capabilities.some((c) => activeCapabilityKeys?.has(c.key))}
          onToggleGroup={() => toggleGroup(group.key)}
          onToggleCapability={(capKey) => {
            const capability = group.capabilities.find((c) => c.key === capKey);
            if (capability) toggleCapability(group.key, capability);
          }}
          onDeactivateCapability={onDeactivateCapability}
          deactivatingKey={deactivatingKey}
        />
      ))}
    </div>
  );
}
