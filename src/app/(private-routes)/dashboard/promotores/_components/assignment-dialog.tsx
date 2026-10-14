"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { EventPromoterAssignment, OrganizationPromoter, PromoterOrganizationEvent, UpsertAssignmentPayload } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { SwitchRow } from "@/components/ui/switch-row";
import { usePromoterMutations } from "../_hooks/use-promoters";

interface FormState {
  organizationPromoterId: string;
  eventId: string;
  linkEnabled: boolean;
  codeEnabled: boolean;
  code: string;
  discountEnabled: boolean;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  discountScope: "ORDER" | "PER_TICKET";
  discountTrigger: "LINK" | "CODE" | "BOTH";
  discountMaxUses: string;
  discountMaxUsesPerCustomer: string;
  discountMaxDiscountValue: string;
  discountMaxTicketsPerUse: string;
  discountMinOrderValue: string;
  commissionEnabled: boolean;
  commissionType: "PERCENTAGE" | "FIXED_PER_TICKET";
  commissionValue: string;
  attributionWindowDays: string;
  startsAt: string;
  endsAt: string;
  eligibleTicketIds: number[];
}

const emptyForm: FormState = {
  organizationPromoterId: "",
  eventId: "",
  linkEnabled: true,
  codeEnabled: false,
  code: "",
  discountEnabled: false,
  discountType: "PERCENTAGE",
  discountValue: "",
  discountScope: "ORDER",
  discountTrigger: "BOTH",
  discountMaxUses: "",
  discountMaxUsesPerCustomer: "",
  discountMaxDiscountValue: "",
  discountMaxTicketsPerUse: "",
  discountMinOrderValue: "",
  commissionEnabled: false,
  commissionType: "PERCENTAGE",
  commissionValue: "",
  attributionWindowDays: "30",
  startsAt: "",
  endsAt: "",
  eligibleTicketIds: [],
};

function centsToReaisString(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function basisPointsToPercentString(bp: number | null): string {
  if (bp === null) return "";
  return (bp / 100).toString();
}

function assignmentToForm(a: EventPromoterAssignment): FormState {
  const discountType = a.discountType ?? "PERCENTAGE";
  const commissionType = a.commissionType ?? "PERCENTAGE";
  return {
    organizationPromoterId: String(a.organizationPromoter.id),
    eventId: String(a.eventId),
    linkEnabled: a.linkEnabled,
    codeEnabled: a.codeEnabled,
    code: a.code ?? "",
    discountEnabled: a.discountEnabled,
    discountType,
    discountValue: discountType === "PERCENTAGE" ? basisPointsToPercentString(a.discountBasisPoints) : centsToReaisString(a.discountFixedCents),
    discountScope: a.discountScope ?? "ORDER",
    discountTrigger: a.discountTrigger ?? "BOTH",
    discountMaxUses: a.discountMaxUses !== null ? String(a.discountMaxUses) : "",
    discountMaxUsesPerCustomer: a.discountMaxUsesPerCustomer !== null ? String(a.discountMaxUsesPerCustomer) : "",
    discountMaxDiscountValue: centsToReaisString(a.discountMaxDiscountCentsPerUse),
    discountMaxTicketsPerUse: a.discountMaxTicketsPerUse !== null ? String(a.discountMaxTicketsPerUse) : "",
    discountMinOrderValue: centsToReaisString(a.discountMinOrderValueCents),
    commissionEnabled: a.commissionEnabled,
    commissionType,
    commissionValue: commissionType === "PERCENTAGE" ? basisPointsToPercentString(a.commissionPercentageBasisPoints) : centsToReaisString(a.commissionFixedCents),
    attributionWindowDays: String(a.attributionWindowDays ?? 30),
    startsAt: a.startsAt ? a.startsAt.slice(0, 10) : "",
    endsAt: a.endsAt ? a.endsAt.slice(0, 10) : "",
    eligibleTicketIds: a.eligibleTickets.map((t) => t.eventTicketId),
  };
}

function previewSentence(form: FormState): string {
  const channels: string[] = [];
  if (form.linkEnabled) channels.push("o link exclusivo");
  if (form.codeEnabled) channels.push(form.code ? `o código "${form.code}"` : "um código");
  if (channels.length === 0) return "Nenhum canal ativo — este vínculo não vai atribuir vendas a ninguém ainda.";

  const sentence = `Quando alguém usa ${channels.join(" ou ")} para comprar`;
  const parts: string[] = [];
  if (form.discountEnabled && form.discountValue) {
    const unit = form.discountType === "PERCENTAGE" ? "%" : "R$";
    const scope = form.discountScope === "ORDER" ? "no pedido" : "por ingresso";
    parts.push(`quem compra ganha ${form.discountValue}${unit} de desconto ${scope}`);
  }
  if (form.commissionEnabled && form.commissionValue) {
    const unit = form.commissionType === "PERCENTAGE" ? "% do valor líquido" : "por ingresso vendido";
    parts.push(`o promoter acumula ${form.commissionValue}${form.commissionType === "PERCENTAGE" ? "" : " reais"}${unit === "% do valor líquido" ? unit : ` ${unit}`} em comissão pendente`);
  }
  if (parts.length === 0) return `${sentence}, a venda é atribuída ao promoter, mas sem desconto nem comissão configurados.`;
  return `${sentence}, ${parts.join(" e ")}.`;
}

export function AssignmentDialog({ orgId, open, onOpenChange, promoters, events, editingAssignment, fixedEventId }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void; promoters: OrganizationPromoter[]; events: PromoterOrganizationEvent[]; editingAssignment: EventPromoterAssignment | null; fixedEventId?: number }) {
  const { createAssignment, updateAssignment } = usePromoterMutations(orgId);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (editingAssignment) setForm(assignmentToForm(editingAssignment));
    else setForm({ ...emptyForm, eventId: fixedEventId ? String(fixedEventId) : "" });
  }, [editingAssignment, fixedEventId, open]);

  const selectedEvent = events.find((e) => String(e.id) === form.eventId);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleEligibleTicket = (ticketId: number) => {
    setForm((f) => ({ ...f, eligibleTicketIds: f.eligibleTicketIds.includes(ticketId) ? f.eligibleTicketIds.filter((id) => id !== ticketId) : [...f.eligibleTicketIds, ticketId] }));
  };

  const handleSubmit = async () => {
    if (!editingAssignment && (!form.organizationPromoterId || !form.eventId)) {
      toast.error("Selecione o promoter e o evento.");
      return;
    }
    if (form.codeEnabled && !form.code.trim()) {
      toast.error("Informe o código, já que o canal por código está ativo.");
      return;
    }

    const payload: UpsertAssignmentPayload = {
      linkEnabled: form.linkEnabled,
      codeEnabled: form.codeEnabled,
      ...(form.codeEnabled ? { code: form.code.trim().toUpperCase() } : {}),
      discountEnabled: form.discountEnabled,
      commissionEnabled: form.commissionEnabled,
      attributionWindowDays: Number(form.attributionWindowDays) || 30,
      ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
      ...(form.endsAt ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
      eligibleTicketIds: form.eligibleTicketIds,
    };

    if (form.discountEnabled) {
      payload.discountType = form.discountType;
      payload.discountScope = form.discountScope;
      payload.discountTrigger = form.discountTrigger;
      if (form.discountType === "PERCENTAGE") payload.discountBasisPoints = Math.round(Number(form.discountValue.replace(",", ".")) * 100);
      else payload.discountFixedCents = Math.round(Number(form.discountValue.replace(",", ".")) * 100);
      if (form.discountMaxUses) payload.discountMaxUses = Number(form.discountMaxUses);
      if (form.discountMaxUsesPerCustomer) payload.discountMaxUsesPerCustomer = Number(form.discountMaxUsesPerCustomer);
      if (form.discountMaxDiscountValue) payload.discountMaxDiscountCentsPerUse = Math.round(Number(form.discountMaxDiscountValue.replace(",", ".")) * 100);
      if (form.discountMaxTicketsPerUse) payload.discountMaxTicketsPerUse = Number(form.discountMaxTicketsPerUse);
      if (form.discountMinOrderValue) payload.discountMinOrderValueCents = Math.round(Number(form.discountMinOrderValue.replace(",", ".")) * 100);
    }

    if (form.commissionEnabled) {
      payload.commissionType = form.commissionType;
      if (form.commissionType === "PERCENTAGE") payload.commissionPercentageBasisPoints = Math.round(Number(form.commissionValue.replace(",", ".")) * 100);
      else payload.commissionFixedCents = Math.round(Number(form.commissionValue.replace(",", ".")) * 100);
    }

    try {
      if (editingAssignment) {
        await updateAssignment.mutateAsync({ assignmentId: editingAssignment.id, payload });
        toast.success("Vínculo atualizado");
      } else {
        await createAssignment.mutateAsync({ ...payload, organizationPromoterId: Number(form.organizationPromoterId), eventId: Number(form.eventId) });
        toast.success("Vínculo criado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar o vínculo."));
    }
  };

  const isPending = createAssignment.isPending || updateAssignment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editingAssignment ? "Editar vínculo" : "Novo vínculo promoter × evento"}</DialogTitle>
          <DialogDescription>Como este promoter atribui vendas neste evento — canais, desconto e comissão são independentes.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {!editingAssignment ? (
            <FieldGroup columns={2}>
              <Field label="Promoter" htmlFor="vinc-promoter" required>
                <SelectInput id="vinc-promoter" value={form.organizationPromoterId} onValueChange={(v) => set("organizationPromoterId", v)} placeholder="Selecione" options={promoters.filter((p) => p.status === "ACTIVE").map((p) => ({ value: String(p.id), label: p.promoterProfile?.displayName ?? p.inviteEmail }))} />
              </Field>
              <Field label="Evento" htmlFor="vinc-evento" required>
                <SelectInput id="vinc-evento" value={form.eventId} onValueChange={(v) => set("eventId", v)} disabled={!!fixedEventId} placeholder="Selecione" options={events.map((e) => ({ value: String(e.id), label: e.nome }))} />
              </Field>
            </FieldGroup>
          ) : null}

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Canais de atribuição</h4>
            <SwitchRow label="Link exclusivo" description="Um link com ?ref= do promoter" checked={form.linkEnabled} onCheckedChange={(v) => set("linkEnabled", v)} />
            <SwitchRow label="Código do promoter" description="Quem compra digita no checkout" checked={form.codeEnabled} onCheckedChange={(v) => set("codeEnabled", v)} />
            {form.codeEnabled ? (
              <Field label="Código" htmlFor="vinc-code" required className="sm:max-w-xs">
                <Input id="vinc-code" placeholder="Ex.: JOAO10" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono uppercase" />
              </Field>
            ) : null}
          </section>

          <section className="space-y-3">
            <SwitchRow label="Oferecer desconto pra quem compra" checked={form.discountEnabled} onCheckedChange={(v) => set("discountEnabled", v)} />
            {form.discountEnabled ? (
              <FieldGroup columns={2} className={cn("rounded-xl border border-border p-4")}>
                <Field label="Tipo" htmlFor="desc-tipo">
                  <SelectInput id="desc-tipo" value={form.discountType} onValueChange={(v) => set("discountType", v as FormState["discountType"])} options={[{ value: "PERCENTAGE", label: "Percentual (%)" }, { value: "FIXED", label: "Valor fixo (R$)" }]} />
                </Field>
                <Field label="Valor do desconto" htmlFor="desc-valor">
                  <Input id="desc-valor" inputMode="decimal" prefix={form.discountType === "PERCENTAGE" ? "%" : "R$"} value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder={form.discountType === "PERCENTAGE" ? "10" : "20,00"} />
                </Field>
                <Field label="Aplicado" htmlFor="desc-scope">
                  <SelectInput id="desc-scope" value={form.discountScope} onValueChange={(v) => set("discountScope", v as FormState["discountScope"])} options={[{ value: "ORDER", label: "Uma vez por pedido" }, { value: "PER_TICKET", label: "Por ingresso" }]} />
                </Field>
                <Field label="Vale para" htmlFor="desc-trigger">
                  <SelectInput id="desc-trigger" value={form.discountTrigger} onValueChange={(v) => set("discountTrigger", v as FormState["discountTrigger"])} options={[{ value: "LINK", label: "Só quem veio pelo link" }, { value: "CODE", label: "Só quem digitou o código" }, { value: "BOTH", label: "Link ou código" }]} />
                </Field>
                <Field label="Limite total de usos" htmlFor="desc-max" optional>
                  <Input id="desc-max" inputMode="numeric" value={form.discountMaxUses} onChange={(e) => set("discountMaxUses", e.target.value)} placeholder="Sem limite" />
                </Field>
                <Field label="Limite por cliente" htmlFor="desc-max-cli" optional>
                  <Input id="desc-max-cli" inputMode="numeric" value={form.discountMaxUsesPerCustomer} onChange={(e) => set("discountMaxUsesPerCustomer", e.target.value)} placeholder="Sem limite" />
                </Field>
                <Field label="Teto de desconto por uso" htmlFor="desc-teto" optional>
                  <Input id="desc-teto" inputMode="decimal" prefix="R$" value={form.discountMaxDiscountValue} onChange={(e) => set("discountMaxDiscountValue", e.target.value)} placeholder="Sem teto" />
                </Field>
                <Field label="Máx. de ingressos por uso" htmlFor="desc-max-ing" optional>
                  <Input id="desc-max-ing" inputMode="numeric" value={form.discountMaxTicketsPerUse} onChange={(e) => set("discountMaxTicketsPerUse", e.target.value)} placeholder="Sem limite" />
                </Field>
                <Field label="Pedido mínimo" htmlFor="desc-min" optional>
                  <Input id="desc-min" inputMode="decimal" prefix="R$" value={form.discountMinOrderValue} onChange={(e) => set("discountMinOrderValue", e.target.value)} placeholder="Sem mínimo" />
                </Field>
              </FieldGroup>
            ) : null}
          </section>

          <section className="space-y-3">
            <SwitchRow label="Gerar comissão pro promoter" checked={form.commissionEnabled} onCheckedChange={(v) => set("commissionEnabled", v)} />
            {form.commissionEnabled ? (
              <FieldGroup columns={2} className="rounded-xl border border-border p-4">
                <Field label="Tipo" htmlFor="com-tipo">
                  <SelectInput id="com-tipo" value={form.commissionType} onValueChange={(v) => set("commissionType", v as FormState["commissionType"])} options={[{ value: "PERCENTAGE", label: "Percentual do valor líquido (%)" }, { value: "FIXED_PER_TICKET", label: "Valor fixo por ingresso (R$)" }]} />
                </Field>
                <Field label="Valor da comissão" htmlFor="com-valor">
                  <Input id="com-valor" inputMode="decimal" prefix={form.commissionType === "PERCENTAGE" ? "%" : "R$"} value={form.commissionValue} onChange={(e) => set("commissionValue", e.target.value)} placeholder={form.commissionType === "PERCENTAGE" ? "10" : "5,00"} />
                </Field>
              </FieldGroup>
            ) : null}
          </section>

          <FieldGroup columns={3}>
            <Field label="Janela de atribuição (dias)" htmlFor="vinc-janela">
              <Input id="vinc-janela" inputMode="numeric" value={form.attributionWindowDays} onChange={(e) => set("attributionWindowDays", e.target.value)} />
            </Field>
            <Field label="Início da vigência" htmlFor="vinc-inicio" optional>
              <Input id="vinc-inicio" type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Fim da vigência" htmlFor="vinc-fim" optional>
              <Input id="vinc-fim" type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
          </FieldGroup>

          {selectedEvent && selectedEvent.tickets.length > 0 ? (
            <Field label="Restringir a lotes específicos" optional hint="Vazio = todos os lotes.">
              <div className="flex flex-wrap gap-2 rounded-xl border border-border p-3">
                {selectedEvent.tickets.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-caption font-medium text-foreground">
                    <Checkbox id={`ticket-${t.id}`} checked={form.eligibleTicketIds.includes(t.id)} onCheckedChange={() => toggleEligibleTicket(t.id)} />
                    {t.nome ?? `Lote ${t.lote}`}
                  </label>
                ))}
              </div>
            </Field>
          ) : null}

          <Callout tone="info" icon="lightbulb">
            {previewSentence(form)}
          </Callout>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button leftIcon="save" onClick={handleSubmit} loading={isPending}>
            Salvar vínculo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
