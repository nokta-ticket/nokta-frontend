"use client";

import { useEvento } from "@/context/EventoContext";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressFields, type EnderecoForm } from "./form/address-fields";
import { FormDivider, FormSection, SectionCard } from "../[id]/_components/section-ui";

export default function StepInfo() {
  const { setData, data } = useEvento();
  const updateEndereco = (patch: Partial<EnderecoForm>) => setData({ endereco: { ...data.endereco, ...patch } });

  return (
    <SectionCard title="Informações básicas" description="O que aparece primeiro na página pública: nome, descrição, data e endereço.">
      <FormSection title="Identidade">
        <Field label="Nome do evento" htmlFor="cr-nome" required>
          <Input id="cr-nome" value={data.nome} onChange={(e) => setData({ nome: e.target.value })} placeholder="Ex.: Baile Neon — All Night Long" autoFocus />
        </Field>
        <Field label="Descrição" htmlFor="cr-descricao" required hint="Uma boa descrição vende mais ingresso: conte o clima, o line-up e o que a pessoa vai viver.">
          <Textarea id="cr-descricao" rows={4} value={data.descricao} onChange={(e) => setData({ descricao: e.target.value })} placeholder="Fale do evento, das atrações e do que o público pode esperar…" />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Data e horário">
        <FieldGroup columns={2}>
          <Field label="Data" htmlFor="cr-data" required>
            <Input id="cr-data" type="date" value={data.data} onChange={(e) => setData({ data: e.target.value })} />
          </Field>
          <Field label="Horário de início" htmlFor="cr-horario" required>
            <Input id="cr-horario" type="time" value={data.horario} onChange={(e) => setData({ horario: e.target.value })} />
          </Field>
        </FieldGroup>
      </FormSection>

      <FormDivider />

      <FormSection title="Localização" description="Onde a festa acontece.">
        <AddressFields value={data.endereco} onChange={updateEndereco} idPrefix="cr-end" />
      </FormSection>
    </SectionCard>
  );
}
