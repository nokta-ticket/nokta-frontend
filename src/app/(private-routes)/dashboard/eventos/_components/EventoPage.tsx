"use client";

import { useState } from "react";
import { useEvento } from "@/context/EventoContext";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import StepInfo from "./StepInfo";
import StepDetails from "./StepDetails";
import StepTickets from "./StepTickets";
import StepMedia from "./StepMedia";

const STEPS = [
  { id: "info", label: "Informações", description: "Nome, data e endereço" },
  { id: "details", label: "Detalhes", description: "Atrações e regras" },
  { id: "tickets", label: "Ingressos", description: "Lotes e preços" },
  { id: "media", label: "Finalizar", description: "Imagens e publicação" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/**
 * Wizard de criação em 4 etapas. O estado vive no EventoContext (layout de
 * /dashboard/eventos); a barra de ações fica fixa embaixo no celular.
 */
export default function EventoPage() {
  const { data, thumbnails, submit } = useEvento();
  const [activeTab, setActiveTab] = useState<StepId>("info");
  const [submitting, setSubmitting] = useState(false);
  const activeIndex = STEPS.findIndex((s) => s.id === activeTab);
  const isLast = activeIndex === STEPS.length - 1;

  const nextTab = () => {
    if (activeIndex < STEPS.length - 1) setActiveTab(STEPS[activeIndex + 1].id);
  };
  const prevTab = () => {
    if (activeIndex > 0) setActiveTab(STEPS[activeIndex - 1].id);
  };

  const handleSubmit = async () => {
    if (thumbnails.length === 0) return toast.warn("Adicione pelo menos 1 imagem.");
    setSubmitting(true);
    try {
      await submit();
    } finally {
      setSubmitting(false);
    }
  };

  const steps: StepperStep[] = STEPS.map((s, i) => ({
    label: (
      <button type="button" disabled={i > activeIndex} onClick={() => setActiveTab(s.id)} className={cn("text-left outline-none", i < activeIndex && "cursor-pointer hover:text-brand", i > activeIndex && "cursor-default")}>
        {s.label}
      </button>
    ),
    description: s.description,
    status: i < activeIndex ? "done" : i === activeIndex ? "current" : "upcoming",
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-24 lg:pb-0">
      <PageHeader back="/dashboard/eventos" title={data.id ? "Editar evento" : "Criar evento"} description={`Etapa ${activeIndex + 1} de ${STEPS.length} · ${STEPS[activeIndex].label}`} />

      <Stepper steps={steps} orientation="horizontal" className="rounded-card border border-border bg-surface px-5 pt-5 shadow-card md:py-5" />

      <div key={activeTab} className="route-enter">
        {activeTab === "info" && <StepInfo />}
        {activeTab === "details" && <StepDetails />}
        {activeTab === "tickets" && <StepTickets />}
        {activeTab === "media" && <StepMedia />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4 pb-safe shadow-2 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <Button variant="ghost" leftIcon="arrow-left" onClick={prevTab} disabled={activeIndex === 0 || submitting} className="h-11 lg:h-10">
            Voltar
          </Button>
          {isLast ? (
            <Button leftIcon="check-circle" onClick={handleSubmit} loading={submitting} disabled={thumbnails.length === 0} className="h-11 flex-1 sm:flex-none lg:h-10">
              Publicar evento
            </Button>
          ) : (
            <Button rightIcon="arrow-right" onClick={nextTab} className="h-11 flex-1 sm:flex-none lg:h-10">
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
