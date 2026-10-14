"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
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

type CapabilityState = "active" | "selected" | "required" | "available";

function CapabilityCard({
  capability,
  state,
  groupSelected,
  index,
  onToggle,
  onDeactivate,
  deactivating,
}: {
  capability: BusinessNeedGroup["capabilities"][number];
  state: CapabilityState;
  groupSelected: boolean;
  index: number;
  onToggle: () => void;
  onDeactivate?: () => void;
  deactivating?: boolean;
}) {
  const interactive = state === "selected" || state === "available";
  const checked = state === "selected" || state === "required";

  const badge =
    state === "active" ? (
      <StatusBadge tone="success">Ativa</StatusBadge>
    ) : state === "selected" ? (
      <StatusBadge tone="brand">Marcada</StatusBadge>
    ) : state === "required" ? (
      <StatusBadge tone="neutral" dot={false}>
        <Icon name="lock" size={9} />
        Necessária
      </StatusBadge>
    ) : (
      <StatusBadge tone="neutral">Disponível</StatusBadge>
    );

  return (
    <Card
      interactive={interactive}
      accent={state === "active"}
      role={interactive ? "checkbox" : undefined}
      aria-checked={interactive ? checked : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onToggle : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      className={cn("fade-up gap-3 p-4 text-left", interactive && "cursor-pointer", state === "selected" && "border-brand/40 ring-1 ring-brand-ring", !groupSelected && state === "available" && "opacity-80")}
      style={{ ["--i" as string]: index } as never}
    >
      <div className="flex items-start justify-between gap-3">
        {badge}
        {interactive ? (
          <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", checked ? "border-brand bg-brand text-brand-foreground" : "border-border-strong bg-surface-2")}>
            {checked ? <Icon name="check" size={10} /> : null}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{capability.label}</p>
        <p className="mt-1 text-caption leading-snug text-muted-foreground">{capability.description}</p>
        {state === "required" && capability.requiredReason ? <p className="mt-2 text-caption text-brand">{capability.requiredReason}</p> : null}
      </div>
      {state === "active" && onDeactivate ? (
        <div className="mt-auto flex justify-end border-t border-border pt-3">
          <Button variant="subtle" size="sm" loading={deactivating} onClick={onDeactivate} className="hover:bg-danger-bg hover:text-danger">
            Desativar
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Catálogo de necessidades do negócio (tela Explore): cada grupo é uma seção
 * com a grade das suas capacidades em cards. Marcar o grupo liga tudo;
 * clicar num card marca/desmarca só aquela capacidade (num grupo ainda
 * desmarcado, o primeiro clique liga o grupo só com aquela capacidade —
 * mesma regra do painel de personalização do onboarding). Capacidades já
 * ACTIVE aparecem travadas com "Ativa" e o botão de desativar na linha.
 */
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
    }
    onChange({ ...selection, selectedGroupKeys: nextGroups, deselectedCapabilityKeysByGroup: nextDeselected });
  };

  const toggleCapability = (group: BusinessNeedGroup, capability: BusinessNeedGroup["capabilities"][number]) => {
    if (capability.required || activeCapabilityKeys?.has(capability.key)) return;

    if (!selection.selectedGroupKeys.has(group.key)) {
      // Grupo ainda desmarcado: liga o grupo só com esta capacidade (as
      // demais, exceto as `required`, entram como desmarcadas).
      const nextGroups = new Set(selection.selectedGroupKeys);
      nextGroups.add(group.key);
      const nextByGroup = new Map(selection.deselectedCapabilityKeysByGroup);
      nextByGroup.set(group.key, new Set(group.capabilities.filter((c) => !c.required && c.key !== capability.key && !activeCapabilityKeys?.has(c.key)).map((c) => c.key)));
      onChange({ ...selection, selectedGroupKeys: nextGroups, deselectedCapabilityKeysByGroup: nextByGroup });
      return;
    }

    const nextByGroup = new Map(selection.deselectedCapabilityKeysByGroup);
    const current = new Set(nextByGroup.get(group.key) ?? []);
    if (current.has(capability.key)) {
      current.delete(capability.key);
    } else {
      current.add(capability.key);
    }
    nextByGroup.set(group.key, current);
    onChange({ ...selection, deselectedCapabilityKeysByGroup: nextByGroup });
  };

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const selected = selection.selectedGroupKeys.has(group.key);
        const deselected = selection.deselectedCapabilityKeysByGroup.get(group.key) ?? new Set<string>();
        const activeCount = activeCapabilityKeys ? group.capabilities.filter((c) => activeCapabilityKeys.has(c.key)).length : 0;
        const allActive = activeCount === group.capabilities.length;

        return (
          <section key={group.key} aria-labelledby={`need-${group.key}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 id={`need-${group.key}`} className="flex flex-wrap items-center gap-2 text-title font-semibold tracking-tight text-foreground">
                  {group.label}
                  {activeCount > 0 ? (
                    <StatusBadge tone="success" dot={false}>
                      {activeCount} de {group.capabilities.length} ativa{activeCount > 1 ? "s" : ""}
                    </StatusBadge>
                  ) : null}
                </h2>
                <p className="mt-1 text-body text-muted-foreground">{group.description}</p>
              </div>
              {!allActive ? (
                <Button size="sm" variant={selected ? "secondary" : "outline"} leftIcon={selected ? "check" : "plus"} onClick={() => toggleGroup(group.key)} aria-pressed={selected} className="shrink-0 self-start sm:self-auto">
                  {selected ? "Grupo marcado" : "Marcar grupo inteiro"}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.capabilities.map((capability, index) => {
                const alreadyActive = activeCapabilityKeys?.has(capability.key) ?? false;
                const state: CapabilityState = alreadyActive ? "active" : selected && capability.required ? "required" : selected && !deselected.has(capability.key) ? "selected" : "available";
                return (
                  <CapabilityCard
                    key={capability.key}
                    capability={capability}
                    state={state}
                    groupSelected={selected}
                    index={index}
                    onToggle={() => toggleCapability(group, capability)}
                    onDeactivate={onDeactivateCapability ? () => onDeactivateCapability(capability.key) : undefined}
                    deactivating={deactivatingKey === capability.key}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
