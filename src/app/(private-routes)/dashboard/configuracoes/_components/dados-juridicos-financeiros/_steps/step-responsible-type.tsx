"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import type { LegalType } from "@/services/venue-legal-financial";

const OPTIONS: { type: LegalType; icon: IconName; title: string; description: string }[] = [
  { type: "INDIVIDUAL", icon: "user", title: "Pessoa física", description: "Vou vender e receber pelo meu CPF." },
  { type: "COMPANY", icon: "building", title: "Pessoa jurídica", description: "A empresa venderá e receberá pelo CNPJ." },
];

export function StepResponsibleType({ onChoose, submitting }: { onChoose: (legalType: LegalType) => void; submitting: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Quem será o responsável financeiro pelas vendas deste workspace?</CardTitle>
          <CardDescription>O local do evento não interfere aqui — o que importa é quem efetivamente vai vender e receber os valores: você ou sua empresa.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <button key={option.type} type="button" disabled={submitting} onClick={() => onChoose(option.type)} className="card-hover flex flex-col items-start gap-3 rounded-card border border-border bg-surface-2/60 p-5 text-left transition-colors hover:border-brand disabled:opacity-50">
            <Icon name={option.icon} size={20} className="text-brand" />
            <span>
              <span className="block text-base font-semibold text-foreground">{option.title}</span>
              <span className="mt-1 block text-caption text-muted-foreground">{option.description}</span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
