"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCnpj, formatCpf, normalizeDigits, validateCnpj, validateCpf } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import type { LegalType } from "@/services/venue-legal-financial";
import { PhoneFields } from "../_sections/phone-fields";
import { emptyPhone, isPhoneComplete, type PhoneForm } from "../types";

export interface EntityDetailsFormState {
  legalName: string;
  tradeName: string;
  document: string;
  siteUrl: string;
  annualRevenue: string;
  corporationType: string;
  foundingDate: string;
  phone: PhoneForm;
}

export function emptyEntityDetails(): EntityDetailsFormState {
  return { legalName: "", tradeName: "", document: "", siteUrl: "", annualRevenue: "", corporationType: "", foundingDate: "", phone: emptyPhone() };
}

export function StepEntityDetails({
  legalType,
  initialValue,
  onSubmit,
  onBack,
  submitting,
}: {
  legalType: LegalType;
  initialValue: EntityDetailsFormState;
  onSubmit: (value: EntityDetailsFormState) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const isCompany = legalType === "COMPANY";
  const set = <K extends keyof EntityDetailsFormState>(key: K, val: EntityDetailsFormState[K]) => setValue((v) => ({ ...v, [key]: val }));

  const documentDigits = normalizeDigits(value.document);
  const documentValid = isCompany ? validateCnpj(documentDigits) : validateCpf(documentDigits);

  const canAdvance = value.legalName.trim().length >= 2 && documentValid && (!isCompany || (Number(value.annualRevenue.replace(",", ".")) > 0 && isPhoneComplete(value.phone)));

  const handleSubmit = () => {
    if (!canAdvance) {
      toast.error(isCompany ? "Preencha razão social, CNPJ válido, faturamento e telefone." : "Preencha seu nome completo e um CPF válido.");
      return;
    }
    onSubmit(value);
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
            placeholder={isCompany ? "00.000.000/0000-00" : "000.000.000-00"}
            inputMode="numeric"
            maxLength={isCompany ? 18 : 14}
          />
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
                <Input value={value.annualRevenue} onChange={(e) => set("annualRevenue", e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="500000.00" inputMode="decimal" />
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
