"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";

export interface CardFormValues {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  cep: string;
  city: string;
  state: string;
  number: string;
  street: string;
  neighborhood: string;
  complemento: string;
}

export const EMPTY_CARD_FORM: CardFormValues = { cardNumber: "", cardName: "", expiryDate: "", cvv: "", cep: "", city: "", state: "", number: "", street: "", neighborhood: "", complemento: "" };

export const formatCardNumber = (v: string) => (v.replace(/\D/g, "").match(/.{1,4}/g) ?? []).join(" ").slice(0, 19);
export const formatExpiry = (v: string) => {
  const c = v.replace(/\D/g, "");
  return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2, 4)}` : c;
};
export const formatCep = (v: string) => {
  const c = v.replace(/\D/g, "").slice(0, 8);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
};

/** Endereço de cobrança no formato que a Pagar.me espera (3DS e checkout). */
export function billingAddressFrom(form: CardFormValues) {
  return {
    country: "BR",
    state: form.state,
    city: form.city,
    zip_code: form.cep.replace(/\D/g, ""),
    line_1: `${form.number}, ${form.street}, ${form.neighborhood}`,
    line_2: form.complemento.trim() || "Sem complemento",
  };
}

/** Validade "MM/AA" → { month, year } com o ano em 4 dígitos. */
export function parseExpiry(expiryDate: string): { month: number; year: number } {
  const [month, year = ""] = expiryDate.split("/");
  return { month: Number(month), year: year.length === 2 ? 2000 + Number(year) : Number(year) };
}

export function hasBillingAddress(form: CardFormValues): boolean {
  return Boolean(form.cep.trim() && form.number.trim() && form.city.trim() && form.state.trim());
}

/**
 * Completa rua/bairro/cidade/UF pelo ViaCEP assim que o CEP tem 8 dígitos
 * (uma consulta por CEP). Falha em silêncio — o usuário completa à mão.
 */
export function useViaCep(cep: string, setForm: (updater: (prev: CardFormValues) => CardFormValues) => void) {
  const lastCepRef = useRef("");
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8 || digits === lastCepRef.current) return;
    lastCepRef.current = digits;
    axios
      .get(`https://viacep.com.br/ws/${digits}/json/`)
      .then((res) => {
        if (res.data?.erro) return;
        setForm((f) => ({
          ...f,
          state: res.data.uf ?? f.state,
          city: res.data.localidade ?? f.city,
          street: res.data.logradouro ?? f.street,
          neighborhood: res.data.bairro ?? f.neighborhood,
        }));
      })
      .catch(() => {});
  }, [cep, setForm]);
}

export interface InstallmentOption {
  n: number;
  label: string;
}

/**
 * Campos do cartão + parcelas + endereço de cobrança. Só campos — o botão de
 * pagar e o `<form>` ficam com quem usa (checkout do evento e revenda), pra
 * barra fixa / rodapé do diálogo conseguirem submeter via `form="…"`.
 * `inputmode`/`autocomplete` certos pra o teclado do celular e o preenchimento
 * automático do navegador.
 */
export function CardPaymentFields({ form, onChange, parcelas, onParcelasChange, installments, disabled, idPrefix = "card" }: { form: CardFormValues; onChange: (patch: Partial<CardFormValues>) => void; parcelas: number; onParcelasChange: (n: number) => void; installments: InstallmentOption[]; disabled?: boolean; idPrefix?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="space-y-4">
      <Field label="Número do cartão" htmlFor={id("number")}>
        <Input id={id("number")} leftIcon="credit-card" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" maxLength={19} value={form.cardNumber} onChange={(e) => onChange({ cardNumber: formatCardNumber(e.target.value) })} disabled={disabled} required />
      </Field>
      <Field label="Nome impresso no cartão" htmlFor={id("name")}>
        <Input id={id("name")} autoComplete="cc-name" autoCapitalize="characters" placeholder="Como está no cartão" className="uppercase placeholder:normal-case" value={form.cardName} onChange={(e) => onChange({ cardName: e.target.value })} disabled={disabled} required />
      </Field>
      <FieldGroup columns={2} className="grid-cols-2">
        <Field label="Validade" htmlFor={id("expiry")}>
          <Input id={id("expiry")} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5} value={form.expiryDate} onChange={(e) => onChange({ expiryDate: formatExpiry(e.target.value) })} disabled={disabled} required />
        </Field>
        <Field label="CVV" htmlFor={id("cvv")}>
          <Input id={id("cvv")} inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={form.cvv} onChange={(e) => onChange({ cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} disabled={disabled} required />
        </Field>
      </FieldGroup>
      {installments.length > 1 ? (
        <Field label="Parcelas" htmlFor={id("parcelas")}>
          <SelectInput id={id("parcelas")} value={String(parcelas)} onValueChange={(v) => onParcelasChange(Number(v))} options={installments.map((o) => ({ value: String(o.n), label: o.label }))} disabled={disabled} />
        </Field>
      ) : null}

      <h3 className="pt-2 text-sm font-semibold text-foreground">Endereço de cobrança</h3>
      <FieldGroup columns={2} className="grid-cols-[1.4fr_1fr]">
        <Field label="CEP" htmlFor={id("cep")}>
          <Input id={id("cep")} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} value={form.cep} onChange={(e) => onChange({ cep: formatCep(e.target.value) })} disabled={disabled} required />
        </Field>
        <Field label="Número" htmlFor={id("house")}>
          <Input id={id("house")} autoComplete="off" placeholder="123" value={form.number} onChange={(e) => onChange({ number: e.target.value })} disabled={disabled} required />
        </Field>
      </FieldGroup>
      <Field label="Rua" htmlFor={id("street")}>
        <Input id={id("street")} autoComplete="address-line1" placeholder="Preenche pelo CEP" value={form.street} onChange={(e) => onChange({ street: e.target.value })} disabled={disabled} />
      </Field>
      <Field label="Bairro" htmlFor={id("neighborhood")}>
        <Input id={id("neighborhood")} autoComplete="address-level3" value={form.neighborhood} onChange={(e) => onChange({ neighborhood: e.target.value })} disabled={disabled} />
      </Field>
      <FieldGroup columns={3} className="grid-cols-[2fr_1fr]">
        <Field label="Cidade" htmlFor={id("city")} className="sm:col-span-2">
          <Input id={id("city")} autoComplete="address-level2" value={form.city} onChange={(e) => onChange({ city: e.target.value })} disabled={disabled} required />
        </Field>
        <Field label="UF" htmlFor={id("state")}>
          <Input id={id("state")} autoComplete="address-level1" autoCapitalize="characters" placeholder="SP" maxLength={2} className="uppercase placeholder:normal-case" value={form.state} onChange={(e) => onChange({ state: e.target.value.toUpperCase().slice(0, 2) })} disabled={disabled} required />
        </Field>
      </FieldGroup>
      <Field label="Complemento" htmlFor={id("complement")} optional>
        <Input id={id("complement")} autoComplete="address-line2" placeholder="Apto, bloco…" value={form.complemento} onChange={(e) => onChange({ complemento: e.target.value })} disabled={disabled} />
      </Field>
    </div>
  );
}
