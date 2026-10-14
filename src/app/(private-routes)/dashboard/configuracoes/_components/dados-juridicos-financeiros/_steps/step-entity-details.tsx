"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCnpj, formatCpf, normalizeDigits, validateCnpj, validateCpf } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import type { LegalType } from "@/services/venue-legal-financial";
import { AddressFields } from "../_sections/address-fields";
import { PhoneFields } from "../_sections/phone-fields";
import { emptyAddress, emptyPhone, isPhoneComplete, maskMoney, missingAddressField, moneyToDecimal, type AddressForm, type PhoneForm } from "../types";

export interface EntityDetailsFormState {
  legalName: string;
  tradeName: string;
  document: string;
  siteUrl: string;
  annualRevenue: string;
  corporationType: string;
  foundingDate: string;
  phone: PhoneForm;
  /** Endereço da empresa (só PJ) — exigido pela Pagar.me para criar o recebedor. */
  address: AddressForm;
}

export function emptyEntityDetails(): EntityDetailsFormState {
  return { legalName: "", tradeName: "", document: "", siteUrl: "", annualRevenue: "", corporationType: "", foundingDate: "", phone: emptyPhone(), address: emptyAddress() };
}

export function StepEntityDetails({
  legalType,
  initialValue,
  savedDocumentMasked,
  onSubmit,
  onBack,
  submitting,
}: {
  legalType: LegalType;
  initialValue: EntityDetailsFormState;
  /** CPF/CNPJ já salvo no rascunho (mascarado). Com ele, o campo pode ficar em branco para manter o documento. */
  savedDocumentMasked: string | null;
  onSubmit: (value: EntityDetailsFormState) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const isCompany = legalType === "COMPANY";
  const set = <K extends keyof EntityDetailsFormState>(key: K, val: EntityDetailsFormState[K]) => setValue((v) => ({ ...v, [key]: val }));

  const documentDigits = normalizeDigits(value.document);
  const documentValid = isCompany ? validateCnpj(documentDigits) : validateCpf(documentDigits);
  const keepsSavedDocument = !documentDigits && !!savedDocumentMasked;
  const docLabel = isCompany ? "CNPJ" : "CPF";

  const annualRevenue = moneyToDecimal(value.annualRevenue);

  // Aponta o campo que falta: uma mensagem única para os quatro não dizia qual corrigir.
  const missing = (() => {
    if (value.legalName.trim().length < 2) return isCompany ? "Preencha a razão social." : "Preencha seu nome completo.";
    if (!documentValid && !keepsSavedDocument) return isCompany ? "Informe um CNPJ válido." : "Informe um CPF válido.";
    if (!isCompany) return null;
    if (!(Number(annualRevenue) > 0)) return "Informe o faturamento anual da empresa.";
    if (!isPhoneComplete(value.phone)) return "Informe o DDD e o telefone da empresa.";
    return missingAddressField(value.address);
  })();

  const handleSubmit = () => {
    if (missing) {
      toast.error(missing);
      return;
    }
    onSubmit({ ...value, annualRevenue });
  };

  const documentHint = keepsSavedDocument ? `${docLabel} já salvo. Deixe em branco para manter, ou digite outro para trocar.` : value.document && documentValid ? `${docLabel} válido.` : undefined;
  const documentError = value.document && !documentValid ? `${docLabel} inválido.` : undefined;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{isCompany ? "Dados da empresa" : "Seus dados"}</CardTitle>
          <CardDescription>{isCompany ? "Informações da pessoa jurídica exigidas pela Pagar.me." : "Nome legal e CPF."}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup columns={2}>
          <Field label={isCompany ? "Razão social" : "Nome completo"} htmlFor="entity-legal-name" required>
            <Input id="entity-legal-name" value={value.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder={isCompany ? "Empresa LTDA" : "Nome civil completo"} />
          </Field>
          {isCompany ? (
            <Field label="Nome fantasia" htmlFor="entity-trade-name" optional>
              <Input id="entity-trade-name" value={value.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
            </Field>
          ) : null}
        </FieldGroup>

        <Field label={docLabel} htmlFor="entity-document" required={!savedDocumentMasked} className="max-w-xs" hint={documentHint} error={documentError}>
          <Input id="entity-document" value={isCompany ? formatCnpj(value.document) : formatCpf(value.document)} onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, isCompany ? 14 : 11))} placeholder={savedDocumentMasked ?? (isCompany ? "00.000.000/0000-00" : "000.000.000-00")} inputMode="numeric" maxLength={isCompany ? 18 : 14} aria-invalid={documentError ? true : undefined} />
        </Field>

        {isCompany ? (
          <>
            <FieldGroup columns={2}>
              <Field label="Site" htmlFor="entity-site" optional>
                <Input id="entity-site" type="url" value={value.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} placeholder="https://minhaempresa.com.br" />
              </Field>
              <Field label="Faturamento anual" htmlFor="entity-revenue" required>
                <Input id="entity-revenue" prefix="R$" value={value.annualRevenue} onChange={(e) => set("annualRevenue", maskMoney(e.target.value))} placeholder="500.000,00" inputMode="numeric" />
              </Field>
              <Field label="Tipo societário" htmlFor="entity-corporation" optional>
                <Input id="entity-corporation" value={value.corporationType} onChange={(e) => set("corporationType", e.target.value)} placeholder="LTDA" />
              </Field>
              <Field label="Data de abertura" htmlFor="entity-founding" optional>
                <Input id="entity-founding" type="date" value={value.foundingDate} onChange={(e) => set("foundingDate", e.target.value)} />
              </Field>
            </FieldGroup>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Telefone da empresa</legend>
              <PhoneFields value={value.phone} onChange={(phone) => set("phone", phone)} idPrefix="empresa-telefone" />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">Endereço da empresa</legend>
              <AddressFields value={value.address} onChange={(address) => set("address", address)} idPrefix="empresa-endereco" />
            </fieldset>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting} leftIcon="arrow-left">
          Voltar
        </Button>
        <Button onClick={handleSubmit} loading={submitting} rightIcon="arrow-right">
          Continuar
        </Button>
      </CardFooter>
    </Card>
  );
}
