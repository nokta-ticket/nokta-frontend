"use client";

import { useEvento } from "@/context/EventoContext";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputPhone } from "./form/input-phone";
import { FormDivider, FormSection, SectionCard } from "../[id]/_components/section-ui";

export default function StepDetails() {
  const { setData, data } = useEvento();

  return (
    <SectionCard title="Detalhes do evento" description="Atrações, programação, regras e como o público fala com você.">
      <FormSection title="Atrações e programação">
        <Field label="Atrações" htmlFor="cr-atracoes" optional>
          <Textarea id="cr-atracoes" rows={3} value={data.atracoes} onChange={(e) => setData({ atracoes: e.target.value })} placeholder="Ex.: DJ Alok, Banda XYZ, show de abertura…" />
        </Field>
        <Field label="Programação" htmlFor="cr-programacao" optional hint="Uma linha por horário.">
          <Textarea id="cr-programacao" rows={4} value={data.programacao} onChange={(e) => setData({ programacao: e.target.value })} placeholder={"20h – Abertura dos portões\n21h – Show de abertura\n23h – Atração principal"} />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Políticas" description="Regras que o público precisa saber antes de comprar.">
        <Field label="Meia-entrada" htmlFor="cr-meia" optional>
          <Textarea id="cr-meia" rows={3} value={data.politicaMeiaEntrada} onChange={(e) => setData({ politicaMeiaEntrada: e.target.value })} placeholder="Ex.: estudantes com carteirinha válida, idosos acima de 60 anos, PCD…" />
        </Field>
        <Field label="Cancelamento e reembolso" htmlFor="cr-cancel" optional>
          <Textarea id="cr-cancel" rows={3} value={data.politicaCancelamento} onChange={(e) => setData({ politicaCancelamento: e.target.value })} placeholder="Ex.: reembolso em até 7 dias úteis pra cancelamentos com no mínimo 48h de antecedência…" />
        </Field>
        <Field label="Classificação etária" htmlFor="cr-idade" optional className="sm:max-w-xs">
          <Input id="cr-idade" value={data.classificacaoEtaria} onChange={(e) => setData({ classificacaoEtaria: e.target.value })} placeholder="Ex.: 18+, Livre, 16+ com acompanhante" />
        </Field>
      </FormSection>

      <FormDivider />

      <FormSection title="Contato de suporte" description="Aparece na página do evento pra quem tiver dúvida.">
        <FieldGroup columns={2}>
          <Field label="WhatsApp" htmlFor="cr-whatsapp">
            <InputPhone id="cr-whatsapp" name="whatsapp" value={data.whatsapp} onChange={(e) => setData({ whatsapp: e.target.value })} required />
          </Field>
          <Field label="E-mail" htmlFor="cr-email" optional>
            <Input id="cr-email" type="email" leftIcon="mail" value={data.email} onChange={(e) => setData({ email: e.target.value })} placeholder="contato@seuevento.com" />
          </Field>
          <Field label="Instagram" htmlFor="cr-instagram" optional>
            <Input id="cr-instagram" prefix="@" value={data.instagram} onChange={(e) => setData({ instagram: e.target.value })} placeholder="seuevento" />
          </Field>
        </FieldGroup>
      </FormSection>
    </SectionCard>
  );
}
