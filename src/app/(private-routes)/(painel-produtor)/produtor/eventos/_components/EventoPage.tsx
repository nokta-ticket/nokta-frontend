"use client";

import StepInfo from "./StepInfo";
import StepDetails from "./StepDetails";
import StepTickets from "./StepTickets";
import StepMedia from "./StepMedia";
import { useState } from "react";
import { useEvento } from "@/context/EventoContext";
import { cn } from "@/lib/utils";
import { MapPin, FileText, Ticket, ImageIcon, Check } from "lucide-react";

const STEPS = [
  { id: "info",    label: "Informações", description: "Dados básicos",     icon: MapPin },
  { id: "details", label: "Detalhes",    description: "Atrações e regras", icon: FileText },
  { id: "tickets", label: "Ingressos",   description: "Lotes e preços",    icon: Ticket },
  { id: "media",   label: "Finalizar",   description: "Imagens e publish", icon: ImageIcon },
];

export default function EventoPage() {
  const { data } = useEvento();
  const [activeTab, setActiveTab] = useState("info");
  const activeIndex = STEPS.findIndex((s) => s.id === activeTab);

  function nextTab() { if (activeIndex < STEPS.length - 1) setActiveTab(STEPS[activeIndex + 1].id); }
  function prevTab() { if (activeIndex > 0) setActiveTab(STEPS[activeIndex - 1].id); }

  return (
    <section className="nokta-page-glow max-w-[860px] mx-auto space-y-8 pb-12">
      {/* Header da página */}
      <div className="space-y-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-gray-900 leading-tight">
          {data.id ? "Editar Evento" : "Criar Novo Evento"}
        </h1>
        <p className="text-sm text-gray-500">
          Preencha as etapas abaixo para {data.id ? "atualizar seu" : "publicar um novo"} evento na plataforma Nokta.
        </p>
      </div>

      {/* Stepper */}
      <div className="relative py-2">
        {/* Linha de fundo */}
        <div
          className="absolute top-[24px] h-[2px] bg-gray-200 hidden sm:block"
          style={{ left: "24px", right: "24px", zIndex: 0 }}
        />
        {/* Linha de progresso */}
        <div
          className="absolute top-[24px] h-[2px] bg-primary hidden sm:block transition-all duration-500 ease-out"
          style={{
            left: "24px",
            zIndex: 1,
            width: activeIndex === 0
              ? "0%"
              : `calc(${(activeIndex / (STEPS.length - 1)) * 100}% - 3rem)`,
          }}
        />

        <div className="relative flex items-start justify-between" style={{ zIndex: 2 }}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2.5 flex-1">
                <button
                  onClick={() => isCompleted && setActiveTab(step.id)}
                  disabled={isPending}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && [
                      "bg-primary border-primary text-primary-foreground cursor-pointer",
                      "hover:scale-105 hover:shadow-[0_4px_16px_-2px_oklch(0.606_0.25_292.717/0.45)]",
                    ],
                    isActive && [
                      "bg-primary border-primary text-primary-foreground",
                      "shadow-[0_4px_20px_-2px_oklch(0.606_0.25_292.717/0.45)]",
                      "ring-4 ring-primary/15",
                    ],
                    isPending && "bg-white border-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isCompleted
                    ? <Check className="w-5 h-5" strokeWidth={2.5} />
                    : <Icon className="w-5 h-5" />}
                </button>

                <div className="text-center hidden sm:block">
                  <p className={cn(
                    "text-xs font-semibold leading-tight transition-colors duration-200",
                    isActive ? "text-gray-900" : isCompleted ? "text-primary" : "text-gray-400"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden md:block">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="transition-all duration-200">
        {activeTab === "info"    && <StepInfo nextTab={nextTab} />}
        {activeTab === "details" && <StepDetails nextTab={nextTab} prevTab={prevTab} />}
        {activeTab === "tickets" && <StepTickets nextTab={nextTab} prevTab={prevTab} />}
        {activeTab === "media"   && <StepMedia prevTab={prevTab} />}
      </div>
    </section>
  );
}
