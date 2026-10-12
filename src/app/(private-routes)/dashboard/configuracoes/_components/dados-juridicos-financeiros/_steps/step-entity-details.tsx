"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCompany ? "Dados da empresa" : "Seus dados"}</CardTitle>
        <CardDescription>{isCompany ? "Informações da pessoa jurídica exigidas pela Pagar.me." : "Nome legal e CPF."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{isCompany ? "Razão social" : "Nome completo"}</Label>
            <Input value={value.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder={isCompany ? "Empresa LTDA" : "Nome civil completo"} />
          </div>
          {isCompany ? (
            <div className="space-y-1.5">
              <Label>Nome fantasia</Label>
              <Input value={value.tradeName} onChange={(e) => set("tradeName", e.target.value)} placeholder="Opcional" />
            </div>
          ) : null}
        </div>

        <div className="max-w-xs space-y-1.5">
          <Label>{isCompany ? "CNPJ" : "CPF"}</Label>
          <Input
            value={isCompany ? formatCnpj(value.document) : formatCpf(value.document)}
            onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, isCompany ? 14 : 11))}
            placeholder={savedDocumentMasked ?? (isCompany ? "00.000.000/0000-00" : "000.000.000-00")}
            inputMode="numeric"
            maxLength={isCompany ? 18 : 14}
          />
          {keepsSavedDocument ? (
            <p className="text-xs text-black/50">{isCompany ? "CNPJ" : "CPF"} já salvo. Deixe em branco para manter, ou digite outro para trocar.</p>
          ) : null}
          {value.document ? (
            <p className={documentValid ? "text-xs text-green-600" : "text-xs text-red-500"}>
              {documentValid ? `${isCompany ? "CNPJ" : "CPF"} válido.` : `${isCompany ? "CNPJ" : "CPF"} inválido.`}
            </p>
          ) : null}
        </div>

        {isCompany ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Site (opcional)</Label>
                <Input value={value.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} placeholder="https://minhaempresa.com.br" />
              </div>
              <div className="space-y-1.5">
                <Label>Faturamento anual (R$)</Label>
                <Input value={value.annualRevenue} onChange={(e) => set("annualRevenue", maskMoney(e.target.value))} placeholder="500.000,00" inputMode="numeric" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo societário (opcional)</Label>
                <Input value={value.corporationType} onChange={(e) => set("corporationType", e.target.value)} placeholder="LTDA" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de abertura (opcional)</Label>
                <Input type="date" value={value.foundingDate} onChange={(e) => set("foundingDate", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-3 block text-xs text-black/50">Telefone da empresa</Label>
              <PhoneFields value={value.phone} onChange={(phone) => set("phone", phone)} idPrefix="empresa-telefone" />
            </div>
            <div>
              <Label className="mb-3 block text-xs text-black/50">Endereço da empresa</Label>
              <AddressFields value={value.address} onChange={(address) => set("address", address)} idPrefix="empresa-endereco" />
            </div>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Salvando…" : "Continuar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
