"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCnpj, validateCnpj } from "@/lib/br-data";
import { AddressFields } from "./address-fields";
import { PhoneFields } from "./phone-fields";
import type { CompanyFormState } from "../types";

export function SectionEmpresa({ value, onChange }: { value: CompanyFormState; onChange: (next: CompanyFormState) => void }) {
  const set = <K extends keyof CompanyFormState>(key: K, val: CompanyFormState[K]) => onChange({ ...value, [key]: val });
  const documentValid = validateCnpj(value.document);

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Empresa</CardTitle>
        <CardDescription>Dados da pessoa jurídica exigidos pela Pagar.me para criar o recebedor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="empresa-razao-social">Razão social</Label>
            <Input id="empresa-razao-social" value={value.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="Empresa LTDA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empresa-nome-fantasia">Nome fantasia</Label>
            <Input id="empresa-nome-fantasia" value={value.tradeName} onChange={(e) => set("tradeName", e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="empresa-cnpj">CNPJ</Label>
          <Input
            id="empresa-cnpj"
            value={formatCnpj(value.document)}
            onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, 14))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            maxLength={18}
          />
          {value.document ? (
            <p className={documentValid ? "text-xs text-green-600" : "text-xs text-red-500"}>{documentValid ? "CNPJ válido." : "CNPJ inválido."}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="empresa-site">Site (opcional)</Label>
            <Input id="empresa-site" value={value.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} placeholder="https://minhaempresa.com.br" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empresa-faturamento">Faturamento anual (R$)</Label>
            <Input
              id="empresa-faturamento"
              value={value.annualRevenue}
              onChange={(e) => set("annualRevenue", e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="500000.00"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="empresa-tipo-societario">Tipo societário (opcional)</Label>
            <Input id="empresa-tipo-societario" value={value.corporationType} onChange={(e) => set("corporationType", e.target.value)} placeholder="LTDA" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empresa-fundacao">Data de fundação (opcional)</Label>
            <Input id="empresa-fundacao" type="date" value={value.foundingDate} onChange={(e) => set("foundingDate", e.target.value)} />
          </div>
        </div>

        <div>
          <Label className="mb-3 block text-xs text-black/50">Endereço da empresa</Label>
          <AddressFields value={value.address} onChange={(address) => set("address", address)} idPrefix="empresa-endereco" />
        </div>

        <div>
          <Label className="mb-3 block text-xs text-black/50">Telefone da empresa</Label>
          <PhoneFields value={value.phone} onChange={(phone) => set("phone", phone)} idPrefix="empresa-telefone" />
        </div>
      </CardContent>
    </Card>
  );
}
