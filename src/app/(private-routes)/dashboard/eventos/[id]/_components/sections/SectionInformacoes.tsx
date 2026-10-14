"use client";

import { useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressFields, type EnderecoForm } from "../../../_components/form/address-fields";
import { FormDivider, FormSection, SaveBar, SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

export default function SectionInformacoes({ event, onRefresh }: SectionProps) {
  const [form, setForm] = useState({
    nome: event.nome ?? "",
    descricao: event.descricao ?? "",
    data: event.data ?? "",
    horario: event.horario ?? "",
    endereco: {
      cep: event.endereco?.cep ?? "",
      logradouro: event.endereco?.logradouro ?? "",
      bairro: event.endereco?.bairro ?? "",
      localidade: event.endereco?.localidade ?? "",
      numero: event.endereco?.numero ?? "",
      uf: event.endereco?.uf ?? "",
    } as EnderecoForm,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nome?: string; data?: string }>({});

  const updateEndereco = (patch: Partial<EnderecoForm>) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, ...patch } }));

  const handleSave = async () => {
    const next: typeof errors = {};
    if (!form.nome.trim()) next.nome = "Dê um nome pro evento.";
    if (!form.data) next.data = "Escolha a data do evento.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await api.put(`/produtor/eventos/${event.id}`, { nome: form.nome, descricao: form.descricao, data: form.data, horario: form.horario, endereco: form.endereco });
      toast.success("Informações salvas");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as informações."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Informações básicas" description="Nome, descrição, data e endereço — o que aparece primeiro na página pública." footer={<SaveBar onSave={handleSave} saving={saving} />}>
      <FormSection title="Identidade">
        <Field label="Nome do evento" htmlFor="ev-nome" required error={errors.nome}>
          <Input id="ev-nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Baile Neon — All Night Long" aria-invalid={Boolean(errors.nome)} />
        </Field>
        <Field label="Descrição" htmlFor="ev-descricao" hint="Uma boa descrição vende mais ingresso: conte o clima, o line-up e o que a pessoa vai viver.">
          <Textarea id="ev-descricao" rows={5} value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Fale do evento, das atrações e do que o público pode esperar…" />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Data e horário">
        <FieldGroup columns={2}>
          <Field label="Data" htmlFor="ev-data" required error={errors.data}>
            <Input id="ev-data" type="date" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} aria-invalid={Boolean(errors.data)} />
          </Field>
          <Field label="Horário de início" htmlFor="ev-horario">
            <Input id="ev-horario" type="time" value={form.horario} onChange={(e) => setForm((p) => ({ ...p, horario: e.target.value }))} />
          </Field>
        </FieldGroup>
      </FormSection>

      <FormDivider />

      <FormSection title="Localização" description="Onde a festa acontece.">
        <AddressFields value={form.endereco} onChange={updateEndereco} idPrefix="ev-end" />
      </FormSection>
    </SectionCard>
  );
}
