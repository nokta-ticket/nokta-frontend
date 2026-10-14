"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { formatDateBR } from "@/lib/format";
import { MEMBER_STATUS_LABEL, VENUE_ROLE_LABEL, type PermissionEffect, type VenueRoleKey } from "@/services/venue-team";
import { venueMenuApi, type VenuePreparationStation } from "@/services/venue-menu";
import { useVenuePermissionsCatalog, useVenueRolesCatalog, useVenueTeamMember, useVenueTeamMutations } from "../_hooks/use-venue-team";
import { useVenueAccess } from "@/context/VenueAccessContext";

type OverrideChoice = "INHERITED" | PermissionEffect;

const CATEGORY_LABEL: Record<string, string> = {
  organization: "Equipe e configurações",
  "venue.menu": "Cardápio",
  "venue.reservations": "Reservas",
  "venue.waitlist": "Reservas",
  "venue.operation": "Operação",
  "venue.stock": "Estoque",
  "venue.finance": "Financeiro",
  "venue.insights": "Insights",
  "venue.access": "Geral",
  "venue.dashboard": "Geral",
};

function categoryOf(key: string): string {
  const parts = key.split(".");
  const prefix2 = `${parts[0]}.${parts[1]}`;
  return CATEGORY_LABEL[prefix2] ?? CATEGORY_LABEL[parts[0]] ?? "Outros";
}

const SELECT_TRIGGER = "h-11 w-full rounded-input border-border bg-surface-2 px-3.5 md:h-10";

export function MemberDetailSheet({ orgId, memberId, onOpenChange }: { orgId: number; memberId: number | null; onOpenChange: (v: boolean) => void }) {
  const { data: member, isLoading } = useVenueTeamMember(orgId, memberId);
  const { data: roles } = useVenueRolesCatalog(orgId);
  const { data: permissionsCatalog } = useVenuePermissionsCatalog(orgId);
  const { venueRole: actorRole } = useVenueAccess();
  const { updateRole, setPermissions, assignStations } = useVenueTeamMutations(orgId);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [choices, setChoices] = useState<Record<string, OverrideChoice>>({});
  const [stations, setStations] = useState<VenuePreparationStation[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);

  useEffect(() => {
    if (!member) return;
    const initial: Record<string, OverrideChoice> = {};
    for (const o of member.overrides) initial[o.permissionKey] = o.effect;
    setChoices(initial);
    setSelectedStationIds(member.preparationStations.map((s) => s.id));
  }, [member]);

  useEffect(() => {
    if (member?.venueRole === "KITCHEN_BAR") {
      venueMenuApi
        .listStations(orgId)
        .then(setStations)
        .catch(() => setStations([]));
    }
  }, [orgId, member?.venueRole]);

  if (!memberId) return null;

  const actorIsOwnerLevel = actorRole === "OWNER";
  const assignableRoles = roles?.filter((r) => actorIsOwnerLevel || (r.key !== "OWNER" && r.key !== "MANAGER"));

  const handleRoleChange = async (roleKey: VenueRoleKey) => {
    try {
      await updateRole.mutateAsync({ memberId, roleKey });
      toast.success("Papel atualizado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o papel."));
    }
  };

  const handleSavePermissions = async () => {
    const overrides = Object.entries(choices)
      .filter(([, v]) => v !== "INHERITED")
      .map(([permissionKey, effect]) => ({ permissionKey, effect: effect as PermissionEffect }));
    try {
      await setPermissions.mutateAsync({ memberId, payload: { overrides } });
      toast.success("Permissões atualizadas.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as permissões."));
    }
  };

  const handleSaveStations = async () => {
    try {
      await assignStations.mutateAsync({ memberId, stationIds: selectedStationIds });
      toast.success("Estações atualizadas.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as estações."));
    }
  };

  const grouped = new Map<string, typeof permissionsCatalog>();
  for (const p of permissionsCatalog ?? []) {
    const cat = categoryOf(p.key);
    grouped.set(cat, [...(grouped.get(cat) ?? []), p]);
  }

  const statusTone = member?.status === "ACTIVE" ? "success" : member?.status === "SUSPENDED" ? "warning" : "danger";

  return (
    <Sheet open={memberId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{member?.nome ?? "Membro"}</SheetTitle>
          <SheetDescription>{member?.email ?? "Carregando…"}</SheetDescription>
        </SheetHeader>

        <SheetBody>
          {isLoading || !member ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-40 rounded-pill" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={statusTone}>{MEMBER_STATUS_LABEL[member.status]}</StatusBadge>
                {member.isOrgOwner ? (
                  <StatusBadge tone="warning" dot={false}>
                    <Icon name="crown" size={10} />
                    Proprietário
                  </StatusBadge>
                ) : null}
                <span className="text-caption text-muted-foreground">Entrou em {formatDateBR(member.createdAt)}</span>
              </div>

              <SheetSection title="Papel na operação">
                {member.isOrgOwner ? (
                  <p className="text-sm text-muted-foreground">Proprietário da organização — acesso total, não pode ser alterado por aqui.</p>
                ) : (
                  <Field hint="Define o conjunto padrão de permissões. Ajustes finos ficam em permissões personalizadas.">
                    <Select value={member.venueRole ?? undefined} onValueChange={(v) => handleRoleChange(v as VenueRoleKey)} disabled={updateRole.isPending}>
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder="Sem papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {(assignableRoles ?? []).map((r) => (
                          <SelectItem key={r.key} value={r.key}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </SheetSection>

              {member.venueRole === "KITCHEN_BAR" ? (
                <SheetSection title="Estações de preparo">
                  <p className="text-caption text-muted-foreground">Sem nenhuma marcada, este membro não vê pedido nenhum na fila de preparo.</p>
                  <div className="mt-3 space-y-2">
                    {stations.length === 0 ? (
                      <p className="text-sm text-subtle-foreground">Nenhuma estação cadastrada no Cardápio.</p>
                    ) : (
                      stations.map((s) => (
                        <label key={s.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-surface-2">
                          <Checkbox checked={selectedStationIds.includes(s.id)} onCheckedChange={(checked) => setSelectedStationIds((prev) => (checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))} />
                          {s.nome}
                        </label>
                      ))
                    )}
                  </div>
                  <Button size="sm" variant="secondary" className="mt-3" onClick={handleSaveStations} loading={assignStations.isPending}>
                    Salvar estações
                  </Button>
                </SheetSection>
              ) : null}

              <SheetSection title="Permissões efetivas">
                {member.effectivePermissions.length === 0 ? (
                  <p className="text-sm text-subtle-foreground">Nenhuma.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {member.effectivePermissions.map((p) => (
                      <span key={p} className="rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-micro text-muted-foreground">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </SheetSection>

              {!member.isOrgOwner ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-foreground">Permissões personalizadas</h4>
                    <Button size="sm" variant="ghost" onClick={() => setShowAdvanced((v) => !v)} rightIcon={showAdvanced ? "chevron-up" : "chevron-down"}>
                      {showAdvanced ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>

                  {showAdvanced ? (
                    <div className="surface-inset space-y-5 rounded-xl p-4">
                      {[...grouped.entries()].map(([cat, perms]) => (
                        <div key={cat} className="space-y-2">
                          <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">{cat}</p>
                          {perms?.map((p) => (
                            <div key={p.key} className="flex items-center justify-between gap-3 text-sm">
                              <span className="min-w-0 flex-1 truncate text-foreground" title={p.description}>
                                {p.description}
                              </span>
                              <Select value={choices[p.key] ?? "INHERITED"} onValueChange={(v) => setChoices((prev) => ({ ...prev, [p.key]: v as OverrideChoice }))}>
                                <SelectTrigger className="h-9 w-32 shrink-0 rounded-input border-border bg-surface-2 text-caption">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INHERITED">Herdado</SelectItem>
                                  <SelectItem value="ALLOW">Permitido</SelectItem>
                                  <SelectItem value="DENY">Negado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      ))}
                      <Button size="sm" onClick={handleSavePermissions} loading={setPermissions.isPending}>
                        Salvar permissões
                      </Button>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
