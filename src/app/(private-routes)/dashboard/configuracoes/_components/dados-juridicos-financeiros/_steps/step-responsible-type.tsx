"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, User } from "lucide-react";
import type { LegalType } from "@/services/venue-legal-financial";

export function StepResponsibleType({ onChoose, submitting }: { onChoose: (legalType: LegalType) => void; submitting: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quem será o responsável financeiro pelas vendas deste workspace?</CardTitle>
        <CardDescription>
          O local do evento não interfere aqui — o que importa é quem efetivamente vai vender e receber os valores: você ou sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onChoose("INDIVIDUAL")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-[#ecebf1] bg-white p-5 text-left transition-colors hover:border-[#6d28d9] disabled:opacity-50"
        >
          <User size={22} className="text-[#6d28d9]" />
          <span className="font-semibold text-[#1a1626]">Pessoa física</span>
          <span className="text-xs text-black/50">Vou vender e receber pelo meu CPF.</span>
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => onChoose("COMPANY")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-[#ecebf1] bg-white p-5 text-left transition-colors hover:border-[#6d28d9] disabled:opacity-50"
        >
          <Building2 size={22} className="text-[#6d28d9]" />
          <span className="font-semibold text-[#1a1626]">Pessoa jurídica</span>
          <span className="text-xs text-black/50">A empresa venderá e receberá pelo CNPJ.</span>
        </button>
      </CardContent>
    </Card>
  );
}
