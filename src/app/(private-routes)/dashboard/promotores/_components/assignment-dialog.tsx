"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import type { EventPromoterAssignment, OrganizationPromoter, PromoterOrganizationEvent, UpsertAssignmentPayload } from "@/services/promoters";
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
  if (parts.length === 0) {
    return `${sentence}, a venda é atribuída ao promoter, mas sem desconto nem comissão configurados.`;
  }
  return `${sentence}, ${parts.join(" e ")}.`;
}

export function AssignmentDialog({
  orgId,
  open,
  onOpenChange,
  promoters,
  events,
  editingAssignment,
  fixedEventId,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  promoters: OrganizationPromoter[];
  events: PromoterOrganizationEvent[];
  editingAssignment: EventPromoterAssignment | null;
  fixedEventId?: number;
}) {
  const { createAssignment, updateAssignment } = usePromoterMutations(orgId);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (editingAssignment) {
      setForm(assignmentToForm(editingAssignment));
    } else {
      setForm({ ...emptyForm, eventId: fixedEventId ? String(fixedEventId) : "" });
    }
  }, [editingAssignment, fixedEventId, open]);

  const selectedEvent = events.find((e) => String(e.id) === form.eventId);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleEligibleTicket = (ticketId: number) => {
    setForm((f) => ({
      ...f,
      eligibleTicketIds: f.eligibleTicketIds.includes(ticketId) ? f.eligibleTicketIds.filter((id) => id !== ticketId) : [...f.eligibleTicketIds, ticketId],
    }));
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
      if (form.discountType === "PERCENTAGE") {
        payload.discountBasisPoints = Math.round(Number(form.discountValue.replace(",", ".")) * 100);
      } else {
        payload.discountFixedCents = Math.round(Number(form.discountValue.replace(",", ".")) * 100);
      }
      if (form.discountMaxUses) payload.discountMaxUses = Number(form.discountMaxUses);
      if (form.discountMaxUsesPerCustomer) payload.discountMaxUsesPerCustomer = Number(form.discountMaxUsesPerCustomer);
      if (form.discountMaxDiscountValue) payload.discountMaxDiscountCentsPerUse = Math.round(Number(form.discountMaxDiscountValue.replace(",", ".")) * 100);
      if (form.discountMaxTicketsPerUse) payload.discountMaxTicketsPerUse = Number(form.discountMaxTicketsPerUse);
      if (form.discountMinOrderValue) payload.discountMinOrderValueCents = Math.round(Number(form.discountMinOrderValue.replace(",", ".")) * 100);
    }

    if (form.commissionEnabled) {
      payload.commissionType = form.commissionType;
      if (form.commissionType === "PERCENTAGE") {
        payload.commissionPercentageBasisPoints = Math.round(Number(form.commissionValue.replace(",", ".")) * 100);
      } else {
        payload.commissionFixedCents = Math.round(Number(form.commissionValue.replace(",", ".")) * 100);
      }
    }

    try {
      if (editingAssignment) {
        await updateAssignment.mutateAsync({ assignmentId: editingAssignment.id, payload });
        toast.success("Vínculo atualizado.");
      } else {
        await createAssignment.mutateAsync({ ...payload, organizationPromoterId: Number(form.organizationPromoterId), eventId: Number(form.eventId) });
        toast.success("Vínculo criado.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar o vínculo."));
    }
  };

  const isPending = createAssignment.isPending || updateAssignment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAssignment ? "Editar vínculo" : "Novo vínculo promoter × evento"}</DialogTitle>
          <DialogDescription>Configure como este promoter atribui vendas neste evento — canais, desconto opcional e comissão opcional são independentes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {!editingAssignment ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Promoter</Label>
                <Select value={form.organizationPromoterId} onValueChange={(v) => set("organizationPromoterId", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {promoters.filter((p) => p.status === "ACTIVE").map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.promoterProfile?.displayName ?? p.inviteEmail}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Evento</Label>
                <Select value={form.eventId} onValueChange={(v) => set("eventId", v)} disabled={!!fixedEventId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Canais de atribuição</Label>
            <div className="flex items-center gap-2">
              <Checkbox id="linkEnabled" checked={form.linkEnabled} onCheckedChange={(v) => set("linkEnabled", !!v)} />
              <Label htmlFor="linkEnabled" className="font-normal">Link exclusivo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="codeEnabled" checked={form.codeEnabled} onCheckedChange={(v) => set("codeEnabled", !!v)} />
              <Label htmlFor="codeEnabled" className="font-normal">Código do promoter</Label>
            </div>
            {form.codeEnabled ? (
              <Input placeholder="Ex.: JOAO10" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="mt-1 max-w-xs" />
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border border-black/10 p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="discountEnabled" checked={form.discountEnabled} onCheckedChange={(v) => set("discountEnabled", !!v)} />
              <Label htmlFor="discountEnabled" className="font-normal">Oferecer desconto para quem compra</Label>
            </div>
            {form.discountEnabled ? (
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.discountType} onValueChange={(v) => set("discountType", v as FormState["discountType"])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor do desconto</Label>
                  <Input value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder={form.discountType === "PERCENTAGE" ? "10" : "20,00"} />
                </div>
                <div className="space-y-1.5">
                  <Label>Aplicado</Label>
                  <Select value={form.discountScope} onValueChange={(v) => set("discountScope", v as FormState["discountScope"])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDER">Uma vez por pedido</SelectItem>
                      <SelectItem value="PER_TICKET">Por ingresso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vale para</Label>
                  <Select value={form.discountTrigger} onValueChange={(v) => set("discountTrigger", v as FormState["discountTrigger"])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINK">Só quem veio pelo link</SelectItem>
                      <SelectItem value="CODE">Só quem digitou o código</SelectItem>
                      <SelectItem value="BOTH">Link ou código</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Limite total de usos</Label>
                  <Input value={form.discountMaxUses} onChange={(e) => set("discountMaxUses", e.target.value)} placeholder="Sem limite" />
                </div>
                <div className="space-y-1.5">
                  <Label>Limite por cliente</Label>
                  <Input value={form.discountMaxUsesPerCustomer} onChange={(e) => set("discountMaxUsesPerCustomer", e.target.value)} placeholder="Sem limite" />
                </div>
                <div className="space-y-1.5">
                  <Label>Teto de desconto por uso (R$)</Label>
                  <Input value={form.discountMaxDiscountValue} onChange={(e) => set("discountMaxDiscountValue", e.target.value)} placeholder="Sem teto" />
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. de ingressos por uso</Label>
                  <Input value={form.discountMaxTicketsPerUse} onChange={(e) => set("discountMaxTicketsPerUse", e.target.value)} placeholder="Sem limite" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pedido mínimo (R$)</Label>
                  <Input value={form.discountMinOrderValue} onChange={(e) => set("discountMinOrderValue", e.target.value)} placeholder="Sem mínimo" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border border-black/10 p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="commissionEnabled" checked={form.commissionEnabled} onCheckedChange={(v) => set("commissionEnabled", !!v)} />
              <Label htmlFor="commissionEnabled" className="font-normal">Gerar comissão para o promoter</Label>
            </div>
            {form.commissionEnabled ? (
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.commissionType} onValueChange={(v) => set("commissionType", v as FormState["commissionType"])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual do valor líquido (%)</SelectItem>
                      <SelectItem value="FIXED_PER_TICKET">Valor fixo por ingresso (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor da comissão</Label>
                  <Input value={form.commissionValue} onChange={(e) => set("commissionValue", e.target.value)} placeholder={form.commissionType === "PERCENTAGE" ? "10" : "5,00"} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Janela de atribuição (dias)</Label>
              <Input value={form.attributionWindowDays} onChange={(e) => set("attributionWindowDays", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Início da vigência</Label>
              <Input type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim da vigência</Label>
              <Input type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </div>
          </div>

          {selectedEvent && selectedEvent.tickets.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Restringir a lotes específicos (opcional — vazio = todos os lotes)</Label>
              <div className="flex flex-wrap gap-3 rounded-lg border border-black/10 p-3">
                {selectedEvent.tickets.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`ticket-${t.id}`}
                      checked={form.eligibleTicketIds.includes(t.id)}
                      onCheckedChange={() => toggleEligibleTicket(t.id)}
                    />
                    <Label htmlFor={`ticket-${t.id}`} className="font-normal">{t.nome ?? `Lote ${t.lote}`}</Label>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg bg-black/5 p-3 text-sm text-black/70">{previewSentence(form)}</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "Salvando…" : "Salvar vínculo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
