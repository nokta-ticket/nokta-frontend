"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, Calendar, FileText, ArrowRight } from "lucide-react";
import { useEvento } from "@/context/EventoContext";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  nextTab: () => void;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
      {children}
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: {
  icon: any; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-gray-800 leading-tight">{title}</h3>
          {description && <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 pl-[2.5rem]">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

const inputCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400"
);

const readonlyCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed",
  "placeholder:text-gray-400"
);

export default function StepInfo({ nextTab }: Props) {
  const { setData, data } = useEvento();
  const [loadingCep, setLoadingCep] = useState(false);

  const buscarCep = async () => {
    const cep = data.endereco.cep;
    if (!cep || cep.length < 8) return toast.error("CEP inválido");

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const cepData = await res.json();

      if (cepData.erro) return alert("CEP não encontrado");

      setData({
        endereco: {
          ...data.endereco,
          logradouro: cepData.logradouro || "",
          bairro: cepData.bairro || "",
          localidade: cepData.localidade || "",
          uf: cepData.uf || "",
          cep,
        },
      });
    } catch {
      toast.error("Erro ao buscar endereço");
    } finally {
      setLoadingCep(false);
    }
  };

  const hasAddress = !!data.endereco.logradouro;

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Informações Básicas</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Identidade e localização do evento</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-8">
        {/* Identidade */}
        <Section icon={FileText} title="Identidade do Evento" description="Como seu evento será apresentado na plataforma">
          <div>
            <FieldLabel required>Nome do Evento</FieldLabel>
            <Input
              value={data.nome}
              onChange={(e) => setData({ nome: e.target.value })}
              placeholder="Ex: Festa Universitária 2025"
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel required>Descrição</FieldLabel>
            <Textarea
              value={data.descricao}
              onChange={(e) => setData({ descricao: e.target.value })}
              placeholder="Fale mais sobre o seu evento, o que os participantes podem esperar..."
              rows={4}
              className={cn(
                "px-4 text-[14px] rounded-xl border-gray-200 bg-white resize-none",
                "hover:border-gray-300 transition-all duration-150",
                "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                "placeholder:text-gray-400"
              )}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Uma boa descrição aumenta a conversão de ingressos.
            </p>
          </div>
        </Section>

        <div className="border-t border-gray-100" />

        {/* Data e Horário */}
        <Section icon={Calendar} title="Data e Horário" description="Quando o evento acontecerá">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Data</FieldLabel>
              <Input
                type="date"
                value={data.data}
                onChange={(e) => setData({ data: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel required>Horário de início</FieldLabel>
              <Input
                type="time"
                value={data.horario}
                onChange={(e) => setData({ horario: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        <div className="border-t border-gray-100" />

        {/* Localização */}
        <Section icon={MapPin} title="Localização" description="Onde o evento acontecerá">
          {/* CEP */}
          <div>
            <FieldLabel required>CEP</FieldLabel>
            <div className="flex gap-2.5">
              <Input
                placeholder="00000-000"
                value={data.endereco.cep}
                onChange={(e) =>
                  setData({ endereco: { ...data.endereco, cep: e.target.value } })
                }
                maxLength={9}
                className={cn(inputCls, "max-w-[160px]")}
              />
              <Button
                type="button"
                onClick={buscarCep}
                disabled={loadingCep}
                variant="outline"
                className={cn(
                  "h-12 px-4 gap-2 rounded-xl text-[13px] font-medium",
                  "border-primary/40 text-primary",
                  "hover:bg-primary/5 hover:border-primary hover:shadow-sm",
                  "active:scale-[0.97] transition-all duration-150"
                )}
              >
                {loadingCep ? (
                  <><Loader2 className="animate-spin w-4 h-4" />Buscando...</>
                ) : (
                  <><Search className="w-4 h-4" />Buscar CEP</>
                )}
              </Button>
            </div>
          </div>

          {/* Endereço */}
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300",
            hasAddress ? "opacity-100" : "opacity-40"
          )}>
            <div className="sm:col-span-2">
              <FieldLabel>Rua / Logradouro</FieldLabel>
              <Input
                value={data.endereco.logradouro}
                readOnly
                placeholder="Preenchido via CEP"
                className={readonlyCls}
              />
            </div>
            <div>
              <FieldLabel required>Número</FieldLabel>
              <Input
                placeholder="Ex: 123"
                value={data.endereco.numero}
                onChange={(e) =>
                  setData({ endereco: { ...data.endereco, numero: e.target.value } })
                }
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>Bairro</FieldLabel>
              <Input value={data.endereco.bairro} readOnly placeholder="Preenchido via CEP" className={readonlyCls} />
            </div>
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <Input value={data.endereco.localidade} readOnly placeholder="Preenchido via CEP" className={readonlyCls} />
            </div>
            <div>
              <FieldLabel>Estado</FieldLabel>
              <Input value={data.endereco.uf} readOnly placeholder="UF" className={readonlyCls} />
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex justify-end">
        <Button
          onClick={nextTab}
          className={cn(
            "h-11 px-7 gap-2 rounded-xl text-[13px] font-semibold",
            "bg-primary text-white shadow-sm",
            "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
            "active:scale-[0.97] transition-all duration-200"
          )}
        >
          Próxima etapa <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </CardShell>
  );
}
