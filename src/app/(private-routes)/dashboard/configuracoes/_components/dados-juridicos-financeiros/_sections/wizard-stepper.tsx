"use client";

import { Stepper } from "@/components/ui/stepper";
import type { DraftStep } from "@/services/venue-legal-financial";

/** Etapas do wizard jurídico/financeiro em cima do Stepper canônico (horizontal no desktop, vertical no celular). */
export function WizardStepper({ steps, currentStep }: { steps: { key: DraftStep; label: string }[]; currentStep: DraftStep }) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <Stepper
      orientation="horizontal"
      // No desktop a linha entre etapas fica fina (o primitivo mantém min-h-6 da versão vertical).
      className="rounded-card border border-border bg-surface px-5 py-4 shadow-card md:[&_span[aria-hidden]]:min-h-0"
      steps={steps.map((step, index) => ({
        label: step.label,
        status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
      }))}
    />
  );
}
