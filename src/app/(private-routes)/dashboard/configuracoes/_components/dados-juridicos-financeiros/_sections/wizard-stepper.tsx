"use client";

import { Check } from "lucide-react";
import type { DraftStep } from "@/services/venue-legal-financial";

/** Mesmo padrão visual do OnboardingStepper (dashboard/onboarding/page.tsx), estendido com rótulo por etapa — aqui as etapas têm nome, lá não. */
export function WizardStepper({ steps, currentStep }: { steps: { key: DraftStep; label: string }[]; currentStep: DraftStep }) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mx-auto mb-8 flex w-full max-w-2xl items-start justify-center">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center last:flex-initial">
            <div className="flex w-full items-center">
              <div
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  isDone
                    ? "border-transparent bg-[#6d28d9] text-white"
                    : isActive
                      ? "border-transparent bg-gradient-to-br from-violet-600 to-[#6d28d9] text-white shadow-[0_3px_8px_rgba(109,40,217,0.3)]"
                      : "border-[#e7e5ee] bg-white text-[#b4b2be]"
                }`}
              >
                {isDone ? <Check size={13} /> : index + 1}
              </div>
              {index < steps.length - 1 && <div className="mx-1 h-[1.5px] flex-1 bg-[#e7e5ee]" />}
            </div>
            <span className={`mt-1.5 text-center text-[10.5px] leading-tight ${isActive ? "font-semibold text-[#1a1626]" : "text-[#b4b2be]"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
