"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, Mail, Phone, ArrowLeft, ArrowRight, Users, FileText, ShieldCheck, Headphones } from "lucide-react";
import { useEvento } from "../../../../../../context/EventoContext";
import { InputPhone } from "../../_components/form/input-phone";
import { cn } from "@/lib/utils";

interface Props {
  nextTab: () => void;
  prevTab: () => void;
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

function FieldLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <label className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
      {Icon && <Icon className="w-3 h-3 text-gray-400" />}
      {children}
    </label>
  );
}

const inputCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400"
);

const textareaCls = cn(
  "px-4 text-[14px] rounded-xl border-gray-200 bg-white resize-none",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400"
);

export default function StepDetails({ nextTab, prevTab }: Props) {
  const { setData, data } = useEvento();
  const [selected, setSelected] = useState<number[]>([]);
  const [form, setForm] = useState({ whatsapp: "", email: "", instagram: "" });

  useEffect(() => {
    const tipo = selected[0];
    if (!tipo) return;
    let contato = "";
    if (tipo === 0) contato = form.whatsapp;
    if (tipo === 1) contato = form.email;
    if (tipo === 2) contato = form.instagram;
    setData({ tipoContato: tipo as any, contatoSuporte: contato });
  }, [selected, form, setData]);

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Detalhes do Evento</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Atrações, programação e políticas</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Atrações e Programação */}
        <Section icon={Users} title="Atrações e Programação" description="O que acontecerá no evento">
          <div>
            <FieldLabel>Atrações</FieldLabel>
            <Textarea
              placeholder="Ex: DJ Alok, Banda XYZ, Show de abertura..."
              rows={3}
              value={data.atracoes}
              onChange={(e) => setData({ atracoes: e.target.value })}
              className={textareaCls}
            />
          </div>
          <div>
            <FieldLabel>Programação</FieldLabel>
            <Textarea
              placeholder={"20h – Abertura dos portões\n21h – Show de abertura\n23h – Atração principal"}
              rows={4}
              value={data.programacao}
              onChange={(e) => setData({ programacao: e.target.value })}
              className={textareaCls}
            />
          </div>
        </Section>

        <div className="border-t border-gray-100" />

        {/* Políticas */}
        <Section icon={ShieldCheck} title="Políticas" description="Regras que os participantes precisam conhecer">
          <div>
            <FieldLabel>Política de Meia Entrada</FieldLabel>
            <Textarea
              placeholder="Ex: Estudantes com carteirinha válida, idosos acima de 60 anos, PCD..."
              rows={3}
              value={data.politicaMeiaEntrada}
              onChange={(e) => setData({ politicaMeiaEntrada: e.target.value })}
              className={textareaCls}
            />
          </div>
          <div>
            <FieldLabel>Política de Cancelamento</FieldLabel>
            <Textarea
              placeholder="Ex: Reembolso em até 7 dias úteis para cancelamentos com no mínimo 48h de antecedência..."
              rows={3}
              value={data.politicaCancelamento}
              onChange={(e) => setData({ politicaCancelamento: e.target.value })}
              className={textareaCls}
            />
          </div>
          <div className="max-w-[280px]">
            <FieldLabel>Classificação Etária</FieldLabel>
            <Input
              placeholder="Ex: 18+, Livre, 16+ com acompanhante"
              value={data.classificacaoEtaria}
              onChange={(e) => setData({ classificacaoEtaria: e.target.value })}
              className={inputCls}
            />
          </div>
        </Section>

        <div className="border-t border-gray-100" />

        {/* Contato de Suporte */}
        <Section icon={Headphones} title="Contato de Suporte" description="Como os participantes falam com a organização">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={Phone}>WhatsApp</FieldLabel>
              <InputPhone
                name="whatsapp"
                value={data.whatsapp}
                onChange={(e) => setData({ whatsapp: e.target.value })}
                required
              />
            </div>
            <div>
              <FieldLabel icon={Mail}>E-mail de suporte</FieldLabel>
              <Input
                type="email"
                placeholder="contato@serevento.com"
                value={data.email}
                onChange={(e) => setData({ email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel icon={Instagram}>Instagram</FieldLabel>
              <Input
                placeholder="@seuevento"
                value={data.instagram}
                onChange={(e) => setData({ instagram: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevTab}
          className={cn(
            "h-11 px-5 gap-2 rounded-xl text-[13px] font-medium text-gray-500",
            "hover:text-gray-900 hover:bg-gray-100/70",
            "active:scale-[0.97] transition-all duration-150"
          )}
        >
          <ArrowLeft className="w-4 h-4" /> Etapa anterior
        </Button>
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
