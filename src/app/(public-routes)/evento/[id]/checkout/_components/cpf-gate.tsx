"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import api, { getErrorMessage } from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { todayInBrasilia } from "@/lib/format";

// ─── Validação ───────────────────────────────────────────────────────────────

function validateCPF(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n - 1; i++) s += parseInt(d[i]) * (n - i);
    const r = (s * 10) % 11;
    return r === 10 || r === 11 ? 0 : r;
  };
  return calc(10) === parseInt(d[9]) && calc(11) === parseInt(d[10]);
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function birthdateError(date: string): string {
  if (!date) return "Informe sua data de nascimento";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Data inválida";
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 0) return "A data não pode ser no futuro";
  if (age < 14) return "Você precisa ter pelo menos 14 anos";
  if (age > 120) return "Data de nascimento inválida";
  return "";
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Pede CPF + nascimento uma única vez (PUT /auth/me) antes de emitir o
 * ingresso. Bloqueia o checkout até salvar.
 */
export function CpfGate({ onComplete }: { onComplete: (cpf: string, dataNascimento: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [cpfTouched, setCpfTouched] = useState(false);
  const [dataTouched, setDataTouched] = useState(false);

  const cpfRaw = cpf.replace(/\D/g, "");
  const cpfValid = validateCPF(cpfRaw);
  const dateErr = birthdateError(dataNascimento);
  const isValid = cpfValid && !dateErr;

  const cpfErrMsg = cpfTouched ? (cpfRaw.length === 0 ? "Informe seu CPF" : cpfRaw.length < 11 ? "CPF incompleto" : !cpfValid ? "CPF inválido — confira os dígitos" : "") : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCpfTouched(true);
    setDataTouched(true);
    if (!isValid) return;

    setLoading(true);
    try {
      await api.put("/auth/me", { cpf: cpfRaw, dataNascimento });
      onComplete(cpfRaw, dataNascimento);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não deu pra salvar seus dados. Tente de novo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10">
      <Card accent className="slide-up w-full p-6 sm:p-8">
        <h1 className="flex items-center gap-2.5 text-title font-semibold tracking-tight text-foreground">
          <Icon name="shield" size={20} className="text-brand" />
          Quase lá!
        </h1>
        <p className="mt-2 text-body text-muted-foreground">Precisamos do seu CPF e data de nascimento pra emitir o ingresso no seu nome. É pedido só uma vez.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Field label="CPF" htmlFor="cpf-gate-cpf" error={cpfErrMsg || undefined} hint={cpfTouched && cpfValid ? "CPF válido" : undefined}>
            <Input id="cpf-gate-cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" maxLength={14} value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} onBlur={() => setCpfTouched(true)} aria-invalid={Boolean(cpfErrMsg) || undefined} />
          </Field>
          <Field label="Data de nascimento" htmlFor="cpf-gate-birth" error={dataTouched && dateErr ? dateErr : undefined}>
            <Input id="cpf-gate-birth" type="date" autoComplete="bday" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} onBlur={() => setDataTouched(true)} max={todayInBrasilia()} aria-invalid={(dataTouched && Boolean(dateErr)) || undefined} />
          </Field>
          <Button type="submit" size="full" loading={loading} className="mt-2">
            Continuar pra compra
          </Button>
        </form>

        <p className="mt-5 text-center text-caption text-subtle-foreground">
          Seus dados são protegidos conforme a{" "}
          <Link href="/privacidade" className="underline underline-offset-2 hover:text-foreground">
            Política de Privacidade
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
