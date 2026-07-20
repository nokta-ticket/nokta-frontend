"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
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

export function MemberDetailSheet({
  orgId,
  memberId,
  onOpenChange,
}: {
  orgId: number;
  memberId: number | null;
  onOpenChange: (v: boolean) => void;
}) {
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
      venueMenuApi.listStations(orgId).then(setStations).catch(() => setStations([]));
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

  return (
    <Sheet open={memberId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{member?.nome ?? "Membro"}</SheetTitle>
          <SheetDescription>{member?.email}</SheetDescription>
        </SheetHeader>

        {isLoading || !member ? (
          <div className="px-4"><BlockSkeleton className="h-64" /></div>
        ) : (
          <div className="space-y-6 px-4 pb-6">
            <div className="flex items-center gap-2">
              <GenericStatusBadge
                label={MEMBER_STATUS_LABEL[member.status]}
                tone={member.status === "ACTIVE" ? "success" : member.status === "SUSPENDED" ? "warning" : "danger"}
              />
              <span className="text-xs text-black/40">Entrou em {new Date(member.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Papel no Venue</p>
              {member.isOrgOwner ? (
                <p className="text-sm text-black/50">Proprietário da organização — acesso total, não pode ser alterado por aqui.</p>
              ) : (
                <Select value={member.venueRole ?? undefined} onValueChange={(v) => handleRoleChange(v as VenueRoleKey)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Sem papel" /></SelectTrigger>
                  <SelectContent>
                    {(assignableRoles ?? []).map((r) => (
                      <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {member.venueRole === "KITCHEN_BAR" ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Estações de preparo</p>
                <p className="text-xs text-black/50">Sem nenhuma marcada, este membro não vê pedido nenhum na fila de preparo.</p>
                <div className="space-y-2 rounded-lg border border-black/10 p-3">
                  {stations.length === 0 ? (
                    <p className="text-sm text-black/40">Nenhuma estação cadastrada no Cardápio.</p>
                  ) : (
                    stations.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedStationIds.includes(s.id)}
                          onCheckedChange={(checked) =>
                            setSelectedStationIds((prev) => (checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                          }
                        />
                        {s.nome}
                      </label>
                    ))
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={handleSaveStations} disabled={assignStations.isPending}>
                  Salvar estações
                </Button>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Permissões efetivas</p>
              <div className="flex flex-wrap gap-1">
                {member.effectivePermissions.length === 0 ? (
                  <p className="text-sm text-black/40">Nenhuma.</p>
                ) : (
                  member.effectivePermissions.map((p) => (
                    <span key={p} className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60">{p}</span>
                  ))
                )}
              </div>
            </div>

            {!member.isOrgOwner ? (
              <div className="space-y-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAdvanced((v) => !v)}>
                  {showAdvanced ? "Ocultar" : "Mostrar"} permissões personalizadas
                </Button>

                {showAdvanced ? (
                  <div className="space-y-4 rounded-lg border border-black/10 p-3">
                    {[...grouped.entries()].map(([cat, perms]) => (
                      <div key={cat} className="space-y-1.5">
                        <p className="text-xs font-semibold text-black/50">{cat}</p>
                        {perms?.map((p) => (
                          <div key={p.key} className="flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate" title={p.description}>{p.description}</span>
                            <Select
                              value={choices[p.key] ?? "INHERITED"}
                              onValueChange={(v) => setChoices((prev) => ({ ...prev, [p.key]: v as OverrideChoice }))}
                            >
                              <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
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
                    <Button size="sm" onClick={handleSavePermissions} disabled={setPermissions.isPending}>
                      Salvar permissões
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
