"use client";

import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { formatCep } from "@/lib/br-data";
import { useCepLookup } from "../_hooks/use-cep-lookup";
import type { AddressForm } from "../types";

/** Bloco de endereço estruturado (main_address / managing_partners[].address do payload v5) — reusado para empresa/pessoa e representante, cada um com seu próprio CEP. */
export function AddressFields({ value, onChange, idPrefix }: { value: AddressForm; onChange: (next: AddressForm) => void; idPrefix: string }) {
  const { lookup, loading } = useCepLookup();

  const set = <K extends keyof AddressForm>(key: K, val: AddressForm[K]) => onChange({ ...value, [key]: val });

  const handleCepBlur = async () => {
    const result = await lookup(value.zipCode);
    if (!result) return;
    onChange({
      ...value,
      street: value.street || result.street,
      neighborhood: value.neighborhood || result.neighborhood,
      city: value.city || result.city,
      state: value.state || result.state,
    });
  };

  return (
    <FieldGroup columns={2}>
      <Field label="CEP" htmlFor={`${idPrefix}-zip`} hint={loading ? "Buscando endereço…" : "Preenche rua, bairro e cidade automaticamente."}>
        <Input id={`${idPrefix}-zip`} value={formatCep(value.zipCode)} onChange={(e) => set("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))} onBlur={handleCepBlur} placeholder="00000-000" inputMode="numeric" maxLength={9} suffix={loading ? <Icon name="loader" size={13} className="animate-spin" /> : <Icon name="search" size={13} />} />
      </Field>
      <Field label="Rua" htmlFor={`${idPrefix}-street`}>
        <Input id={`${idPrefix}-street`} value={value.street} onChange={(e) => set("street", e.target.value)} />
      </Field>
      <Field label="Número" htmlFor={`${idPrefix}-number`}>
        <Input id={`${idPrefix}-number`} value={value.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
      </Field>
      <Field label="Complemento" htmlFor={`${idPrefix}-complementary`} hint='Sem complemento? Escreva "Casa".'>
        <Input id={`${idPrefix}-complementary`} value={value.complementary} onChange={(e) => set("complementary", e.target.value)} placeholder="Apto, bloco…" />
      </Field>
      <Field label="Bairro" htmlFor={`${idPrefix}-neighborhood`}>
        <Input id={`${idPrefix}-neighborhood`} value={value.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
      </Field>
      <Field label="Cidade" htmlFor={`${idPrefix}-city`}>
        <Input id={`${idPrefix}-city`} value={value.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label="UF" htmlFor={`${idPrefix}-state`} className="max-w-[120px]">
        <Input id={`${idPrefix}-state`} value={value.state} onChange={(e) => set("state", e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase())} placeholder="SP" maxLength={2} />
      </Field>
      <Field label="Ponto de referência" htmlFor={`${idPrefix}-reference`} className="sm:col-span-2">
        <Input id={`${idPrefix}-reference`} value={value.referencePoint} onChange={(e) => set("referencePoint", e.target.value)} placeholder="Ex.: perto do metrô" />
      </Field>
    </FieldGroup>
  );
}
