"use client";

import { useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputPhone } from "../../../_components/form/input-phone";
import { FormDivider, FormSection, SaveBar, SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

export default function SectionDetalhes({ event, onRefresh }: SectionProps) {
  const [form, setForm] = useState({
    atracoes: event.atracoes ?? "",
    programacao: event.programacao ?? "",
    politicaMeiaEntrada: event.politicaMeiaEntrada ?? "",
    politicaCancelamento: event.politicaCancelamento ?? "",
    classificacaoEtaria: event.classificacaoEtaria ?? "",
    whatsapp: event.whatsapp ?? "",
    email: event.email ?? "",
    instagram: event.instagram ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/produtor/eventos/${event.id}`, form);
      toast.success("Detalhes salvos");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar os detalhes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Detalhes do evento" description="Atrações, programação, regras e como o público fala com você." footer={<SaveBar onSave={handleSave} saving={saving} />}>
      <FormSection title="Atrações e programação">
        <Field label="Atrações" htmlFor="ev-atracoes" optional>
          <Textarea id="ev-atracoes" rows={3} value={form.atracoes} onChange={set("atracoes")} placeholder="Ex.: DJ Alok, Banda XYZ, show de abertura…" />
        </Field>
        <Field label="Programação" htmlFor="ev-programacao" optional hint="Uma linha por horário.">
          <Textarea id="ev-programacao" rows={4} value={form.programacao} onChange={set("programacao")} placeholder={"20h – Abertura dos portões\n21h – Show de abertura\n23h – Atração principal"} />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Políticas" description="Regras que o público precisa saber antes de comprar.">
        <Field label="Meia-entrada" htmlFor="ev-meia" optional>
          <Textarea id="ev-meia" rows={3} value={form.politicaMeiaEntrada} onChange={set("politicaMeiaEntrada")} placeholder="Ex.: estudantes com carteirinha válida, idosos acima de 60 anos, PCD…" />
        </Field>
        <Field label="Cancelamento e reembolso" htmlFor="ev-cancel" optional>
          <Textarea id="ev-cancel" rows={3} value={form.politicaCancelamento} onChange={set("politicaCancelamento")} placeholder="Ex.: reembolso em até 7 dias úteis pra cancelamentos com no mínimo 48h de antecedência…" />
        </Field>
        <Field label="Classificação etária" htmlFor="ev-idade" optional className="sm:max-w-xs">
          <Input id="ev-idade" value={form.classificacaoEtaria} onChange={set("classificacaoEtaria")} placeholder="Ex.: 18+, Livre, 16+ com acompanhante" />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Contato de suporte" description="Aparece na página do evento pra quem tiver dúvida.">
        <FieldGroup columns={2}>
          <Field label="WhatsApp" htmlFor="ev-whatsapp">
            <InputPhone id="ev-whatsapp" name="whatsapp" value={form.whatsapp} onChange={set("whatsapp")} required />
          </Field>
          <Field label="E-mail" htmlFor="ev-email" optional>
            <Input id="ev-email" type="email" leftIcon="mail" value={form.email} onChange={set("email")} placeholder="contato@seuevento.com" />
          </Field>
          <Field label="Instagram" htmlFor="ev-instagram" optional>
            <Input id="ev-instagram" prefix="@" value={form.instagram} onChange={set("instagram")} placeholder="seuevento" />
          </Field>
        </FieldGroup>
      </FormSection>
    </SectionCard>
  );
}
