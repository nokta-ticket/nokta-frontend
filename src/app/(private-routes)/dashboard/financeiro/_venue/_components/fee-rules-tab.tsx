"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_PAYMENT_METHOD_LABEL, type VenuePaymentFeeRule, type VenuePaymentMethod } from "@/services/venue-finance";
import { useVenueFinanceFeeRuleMutations, useVenueFinanceFeeRules } from "../_hooks/use-venue-finance-fee-rules";
import { MethodChip, PAYMENT_METHODS, dateInputToIso, formatBps, formatFullDateSP, parseBRLToCents, todayInSaoPaulo } from "./finance-shared";

type Scope = "all" | "location";
type Errors = Partial<Record<"percentage" | "fixed" | "days" | "validFrom", string>>;

function parsePercentToBps(raw: string): number | null {
  const cleaned = raw.replace(/[%\s]/g, "").replace(",", ".");
  if (cleaned === "") return 0;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100);
}

function FeeRuleDialog({ orgId, locationId, locationName, open, onOpenChange }: { orgId: number; locationId: number; locationName: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useVenueFinanceFeeRuleMutations(orgId);
  const [method, setMethod] = useState<VenuePaymentMethod>("CREDIT_CARD");
  const [scope, setScope] = useState<Scope>("all");
  const [percentage, setPercentage] = useState("");
  const [fixed, setFixed] = useState("");
  const [days, setDays] = useState("0");
  const [validFrom, setValidFrom] = useState(todayInSaoPaulo());
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setMethod("CREDIT_CARD");
    setScope("all");
    setPercentage("");
    setFixed("");
    setDays("0");
    setValidFrom(todayInSaoPaulo());
    setErrors({});
  }, [open]);

  const handleSubmit = async () => {
    const next: Errors = {};
    const bps = parsePercentToBps(percentage);
    const fixedCents = fixed.trim() ? parseBRLToCents(fixed) : 0;
    const settlementDays = days.trim() === "" ? 0 : Number(days);
    if (bps === null) next.percentage = "Use um percentual entre 0 e 100.";
    if (fixedCents === null) next.fixed = "Informe um valor válido.";
    if (!Number.isInteger(settlementDays) || settlementDays < 0 || settlementDays > 365) next.days = "Dias inteiros, de 0 a 365.";
    if (!validFrom) next.validFrom = "Informe a data de início.";
    setErrors(next);
    if (Object.keys(next).length > 0 || bps === null || fixedCents === null) return;
    try {
      await create.mutateAsync({
        method,
        locationId: scope === "location" ? locationId : undefined,
        percentageBps: bps,
        fixedFeeCents: fixedCents,
        settlementDays,
        validFrom: dateInputToIso(validFrom),
      });
      toast.success("Regra criada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível criar a regra."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!create.isPending ? onOpenChange(v) : null)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nova regra de taxa</DialogTitle>
          <DialogDescription>Quanto a adquirente desconta e em quantos dias o dinheiro cai.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="fee-rule-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <Field label="Método de pagamento" htmlFor="fee-method" required>
              <NativeSelect id="fee-method" value={method} onChange={(e) => setMethod(e.target.value as VenuePaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {VENUE_PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Vale para" hint={scope === "location" ? `Só ${locationName ?? "esta unidade"} — tem prioridade sobre a regra geral.` : "Todas as unidades, a menos que uma tenha regra própria."}>
              <SegmentedControl fullWidth value={scope} onChange={setScope} options={[{ value: "all", label: "Todas as unidades", icon: "building" }, { value: "location", label: locationName ?? "Esta unidade", icon: "store" }]} />
            </Field>
            <FieldGroup columns={2}>
              <Field label="Taxa percentual" htmlFor="fee-percentage" error={errors.percentage} hint="Ex.: 3,49">
                <Input id="fee-percentage" inputMode="decimal" suffix="%" placeholder="0,00" value={percentage} onChange={(e) => setPercentage(e.target.value)} aria-invalid={Boolean(errors.percentage) || undefined} autoFocus />
              </Field>
              <Field label="Taxa fixa por venda" htmlFor="fee-fixed" error={errors.fixed} optional>
                <Input id="fee-fixed" inputMode="decimal" prefix="R$" placeholder="0,00" value={fixed} onChange={(e) => setFixed(e.target.value)} aria-invalid={Boolean(errors.fixed) || undefined} />
              </Field>
            </FieldGroup>
            <FieldGroup columns={2}>
              <Field label="Prazo de liquidação" htmlFor="fee-days" error={errors.days} hint="0 = cai no mesmo dia">
                <Input id="fee-days" type="number" min={0} max={365} step={1} suffix="dias" value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={Boolean(errors.days) || undefined} />
              </Field>
              <Field label="Vale a partir de" htmlFor="fee-valid-from" required error={errors.validFrom}>
                <Input id="fee-valid-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} aria-invalid={Boolean(errors.validFrom) || undefined} />
              </Field>
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="fee-rule-form" loading={create.isPending} leftIcon="plus">
            Criar regra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleStatus({ rule }: { rule: VenuePaymentFeeRule }) {
  return <StatusBadge tone={rule.active ? "success" : "neutral"}>{rule.active ? "Ativa" : "Inativa"}</StatusBadge>;
}

const scopeLabel = (rule: VenuePaymentFeeRule, locationName: string | null) => (rule.locationId === null ? "Todas as unidades" : (locationName ?? "Esta unidade"));
const validity = (rule: VenuePaymentFeeRule) => `${formatFullDateSP(rule.validFrom)}${rule.validUntil ? ` a ${formatFullDateSP(rule.validUntil)}` : " em diante"}`;

/** Regras de taxa por método: percentual, fixo, prazo e vigência. */
export function FeeRulesTab({ orgId, locationId, locationName }: { orgId: number; locationId: number; locationName: string | null }) {
  const [showInactive, setShowInactive] = useState<"active" | "all">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<VenuePaymentFeeRule | null>(null);
  const query = useVenueFinanceFeeRules(orgId, locationId);
  const { deactivate } = useVenueFinanceFeeRuleMutations(orgId);

  const all = [...(query.data ?? [])].sort((a, b) => Number(b.active) - Number(a.active) || a.method.localeCompare(b.method) || (a.locationId === null ? 1 : 0) - (b.locationId === null ? 1 : 0));
  const rows = showInactive === "all" ? all : all.filter((r) => r.active);
  const inactiveCount = all.filter((r) => !r.active).length;

  const handleDeactivate = async () => {
    if (!deactivating) return;
    try {
      await deactivate.mutateAsync(deactivating.id);
      toast.success("Regra desativada.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível desativar a regra."));
      throw err;
    }
  };

  const deactivateButton = (r: VenuePaymentFeeRule, labels = false) => (
    <Button variant="subtle" size={labels ? "sm" : "icon-sm"} aria-label="Desativar regra" title={r.active ? "Desativar regra" : "Regra já inativa"} disabled={!r.active} className={cn("hover:bg-danger-bg hover:text-danger", !r.active && "opacity-40")} onClick={() => setDeactivating(r)} leftIcon={labels ? "ban" : undefined}>
      {labels ? "Desativar" : <Icon name="ban" size={14} />}
    </Button>
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar className="justify-between">
        <SegmentedControl size="sm" value={showInactive} onChange={setShowInactive} options={[{ value: "active", label: "Ativas" }, { value: "all", label: inactiveCount ? "Todas" : "Todas", disabled: inactiveCount === 0 }]} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()}>
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
          <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
            Nova regra
          </Button>
        </div>
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState description="Não foi possível carregar as regras." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="percent"
          title="Nenhuma regra de taxa"
          description="Sem regras, o líquido estimado é igual ao bruto. Cadastre o que a maquininha e o Pix cobram."
          action={
            <Button leftIcon="plus" onClick={() => setFormOpen(true)}>
              Nova regra
            </Button>
          }
        />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Método</DataTableHeadCell>
                  <DataTableHeadCell>Vale para</DataTableHeadCell>
                  <DataTableHeadCell align="right">Taxa</DataTableHeadCell>
                  <DataTableHeadCell align="right">Fixo</DataTableHeadCell>
                  <DataTableHeadCell align="right">Prazo</DataTableHeadCell>
                  <DataTableHeadCell>Vigência</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={56}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((r, i) => (
                  <DataTableRow key={r.id} index={i} className={cn(!r.active && "text-muted-foreground")}>
                    <DataTableCell>
                      <MethodChip method={r.method} className="font-medium" />
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{scopeLabel(r, locationName)}</DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {formatBps(r.percentageBps)}
                    </DataTableCell>
                    <DataTableCell num>{r.fixedFeeCents ? formatBRLCents(r.fixedFeeCents) : <span className="text-subtle-foreground">—</span>}</DataTableCell>
                    <DataTableCell num>{r.settlementDays === 0 ? "No dia" : `D+${r.settlementDays}`}</DataTableCell>
                    <DataTableCell className="tnum whitespace-nowrap text-muted-foreground">{validity(r)}</DataTableCell>
                    <DataTableCell>
                      <RuleStatus rule={r} />
                    </DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      {deactivateButton(r)}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((r, i) => (
                <MobileCard
                  key={r.id}
                  index={i}
                  title={<MethodChip method={r.method} />}
                  subtitle={`${scopeLabel(r, locationName)} · ${validity(r)}`}
                  badge={<RuleStatus rule={r} />}
                  meta={[
                    { label: "Taxa", value: <span className="font-semibold">{formatBps(r.percentageBps)}</span>, num: true },
                    { label: "Fixo", value: r.fixedFeeCents ? formatBRLCents(r.fixedFeeCents) : "—", num: true },
                    { label: "Prazo", value: r.settlementDays === 0 ? "No dia" : `D+${r.settlementDays}`, num: true },
                  ]}
                  actions={r.active ? deactivateButton(r, true) : undefined}
                />
              ))}
            </MobileCardList>
          }
        />
      )}

      <FeeRuleDialog orgId={orgId} locationId={locationId} locationName={locationName} open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(v) => !v && setDeactivating(null)}
        danger
        icon="ban"
        title="Desativar essa regra?"
        description={deactivating ? `${VENUE_PAYMENT_METHOD_LABEL[deactivating.method]} · ${formatBps(deactivating.percentageBps)} · ${scopeLabel(deactivating, locationName)}. As próximas vendas deixam de usar essa taxa; as antigas não mudam.` : undefined}
        confirmLabel="Desativar"
        cancelLabel="Voltar"
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
