"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BankAccountFormState } from "../types";

export function SectionContaRepasse({ value, onChange }: { value: BankAccountFormState; onChange: (next: BankAccountFormState) => void }) {
  const set = <K extends keyof BankAccountFormState>(key: K, val: BankAccountFormState[K]) => onChange({ ...value, [key]: val });

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Conta e repasse</CardTitle>
        <CardDescription>
          Conta bancária para onde os repasses da empresa serão transferidos. Precisa estar no mesmo CNPJ da organização. Split ≠ transferência automática:
          saques continuam sempre manuais, aprovados pela Nokta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="conta-titular">Nome do titular</Label>
          <Input id="conta-titular" value={value.holderName} onChange={(e) => set("holderName", e.target.value)} placeholder="Igual à razão social" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="conta-banco">Banco (código)</Label>
            <Input
              id="conta-banco"
              value={value.bank}
              onChange={(e) => set("bank", e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Ex.: 001"
              inputMode="numeric"
              maxLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conta-agencia">Agência</Label>
            <Input
              id="conta-agencia"
              value={value.branchNumber}
              onChange={(e) => set("branchNumber", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="0000"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conta-agencia-dv">Dígito da agência (opcional)</Label>
            <Input
              id="conta-agencia-dv"
              value={value.branchCheckDigit}
              onChange={(e) => set("branchCheckDigit", e.target.value.replace(/\D/g, "").slice(0, 1))}
              inputMode="numeric"
              maxLength={1}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="conta-numero">Conta</Label>
            <Input
              id="conta-numero"
              value={value.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 13))}
              placeholder="00000000"
              inputMode="numeric"
              maxLength={13}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conta-numero-dv">Dígito da conta</Label>
            <Input
              id="conta-numero-dv"
              value={value.accountCheckDigit}
              onChange={(e) => set("accountCheckDigit", e.target.value.replace(/[^0-9xX]/g, "").slice(0, 2))}
              inputMode="text"
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de conta</Label>
            <Select value={value.accountType} onValueChange={(v) => set("accountType", v as "checking" | "savings")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
