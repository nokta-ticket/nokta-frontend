"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCpf, validateCpf } from "@/lib/br-data";
import { AddressFields } from "./address-fields";
import { PhoneFields } from "./phone-fields";
import type { RepresentativeFormState } from "../types";

/** Representante legal — sempre o próprio usuário autenticado (dono/criador do workspace, mesma regra de startProfile PF): quem sacar é sempre a mesma conta que criou o workspace. */
export function SectionRepresentante({
  value,
  onChange,
  representativeName,
  representativeEmail,
}: {
  value: RepresentativeFormState;
  onChange: (next: RepresentativeFormState) => void;
  representativeName: string;
  representativeEmail: string;
}) {
  const set = <K extends keyof RepresentativeFormState>(key: K, val: RepresentativeFormState[K]) => onChange({ ...value, [key]: val });
  const documentValid = validateCpf(value.document);

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Representante legal</CardTitle>
        <CardDescription>A Pagar.me exige um representante legal vinculado ao quadro societário — sempre você, dono deste workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-xl bg-black/[0.03] p-3.5 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-black/50">Nome</Label>
            <p className="text-sm font-medium">{representativeName}</p>
          </div>
          <div>
            <Label className="text-xs text-black/50">E-mail</Label>
            <p className="text-sm font-medium">{representativeEmail}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rep-cpf">CPF</Label>
            <Input
              id="rep-cpf"
              value={formatCpf(value.document)}
              onChange={(e) => set("document", e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
            />
            {value.document ? (
              <p className={documentValid ? "text-xs text-green-600" : "text-xs text-red-500"}>{documentValid ? "CPF válido." : "CPF inválido."}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-nascimento">Data de nascimento</Label>
            <Input id="rep-nascimento" type="date" value={value.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rep-mae">Nome da mãe</Label>
          <Input id="rep-mae" value={value.motherName} onChange={(e) => set("motherName", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rep-renda">Renda mensal (R$)</Label>
            <Input
              id="rep-renda"
              value={value.monthlyIncome}
              onChange={(e) => set("monthlyIncome", e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="15000.00"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep-ocupacao">Ocupação profissional</Label>
            <Input id="rep-ocupacao" value={value.professionalOccupation} onChange={(e) => set("professionalOccupation", e.target.value)} placeholder="Empresária" />
          </div>
        </div>

        <div>
          <Label className="mb-3 block text-xs text-black/50">Endereço do representante</Label>
          <AddressFields value={value.address} onChange={(address) => set("address", address)} idPrefix="rep-endereco" />
        </div>

        <div>
          <Label className="mb-3 block text-xs text-black/50">Telefone do representante</Label>
          <PhoneFields value={value.phone} onChange={(phone) => set("phone", phone)} idPrefix="rep-telefone" />
        </div>
      </CardContent>
    </Card>
  );
}
