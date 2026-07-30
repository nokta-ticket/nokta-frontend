"use client";

import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep } from "@/lib/br-data";
import { useCepLookup } from "../_hooks/use-cep-lookup";
import type { CompanyAddressForm } from "../types";

/** Bloco de endereço estruturado (main_address / managing_partners[].address do payload v5) — reusado para empresa e representante, cada um com seu próprio CEP. */
export function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: CompanyAddressForm;
  onChange: (next: CompanyAddressForm) => void;
  idPrefix: string;
}) {
  const { lookup, loading } = useCepLookup();

  const set = <K extends keyof CompanyAddressForm>(key: K, val: CompanyAddressForm[K]) => onChange({ ...value, [key]: val });

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
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-zip`}>CEP</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-zip`}
            value={formatCep(value.zipCode)}
            onChange={(e) => set("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
          {loading ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-black/40" /> : <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30" />}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-street`}>Rua</Label>
        <Input id={`${idPrefix}-street`} value={value.street} onChange={(e) => set("street", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-number`}>Número</Label>
        <Input id={`${idPrefix}-number`} value={value.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-complementary`}>Complemento</Label>
        <Input
          id={`${idPrefix}-complementary`}
          value={value.complementary}
          onChange={(e) => set("complementary", e.target.value)}
          placeholder="Sala, bloco, etc."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-neighborhood`}>Bairro</Label>
        <Input id={`${idPrefix}-neighborhood`} value={value.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-city`}>Cidade</Label>
        <Input id={`${idPrefix}-city`} value={value.city} onChange={(e) => set("city", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-state`}>UF</Label>
        <Input
          id={`${idPrefix}-state`}
          value={value.state}
          onChange={(e) => set("state", e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase())}
          placeholder="SP"
          maxLength={2}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-reference`}>Ponto de referência</Label>
        <Input
          id={`${idPrefix}-reference`}
          value={value.referencePoint}
          onChange={(e) => set("referencePoint", e.target.value)}
          placeholder="Ex.: perto do metrô"
        />
      </div>
    </div>
  );
}
