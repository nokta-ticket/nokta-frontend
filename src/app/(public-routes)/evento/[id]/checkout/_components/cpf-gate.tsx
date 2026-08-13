"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

// ─── Validation ───────────────────────────────────────────────────────────────

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
  if (!date) return "Data obrigatória";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Data inválida";
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 0) return "Data no futuro";
  if (age < 14) return "Você deve ter pelo menos 14 anos";
  if (age > 120) return "Data de nascimento inválida";
  return "";
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CpfGateProps {
  onComplete: (cpf: string, dataNascimento: string) => void;
}

export function CpfGate({ onComplete }: CpfGateProps) {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [cpfTouched, setCpfTouched] = useState(false);
  const [dataTouched, setDataTouched] = useState(false);

  const cpfRaw = cpf.replace(/\D/g, "");
  const cpfValid = validateCPF(cpfRaw);
  const dateErr = birthdateError(dataNascimento);
  const isValid = cpfValid && !dateErr;

  const cpfErrMsg = cpfTouched
    ? cpfRaw.length === 0 ? "CPF obrigatório"
    : cpfRaw.length < 11 ? "CPF incompleto"
    : !cpfValid ? "CPF inválido — verifique os dígitos"
    : ""
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpfTouched(true);
    setDataTouched(true);
    if (!isValid) return;

    setLoading(true);
    try {
      await api.put("/auth/me", { cpf: cpfRaw, dataNascimento });
      onComplete(cpfRaw, dataNascimento);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
              <Shield className="h-7 w-7 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quase lá!</h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                Precisamos do seu CPF e data de nascimento para emitir seu ingresso. Isso só é pedido uma vez.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* CPF */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">CPF</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                onBlur={() => setCpfTouched(true)}
                className={`h-11 rounded-xl transition-colors ${
                  cpfTouched && !cpfValid && cpf ? "border-red-400 focus-visible:ring-red-400"
                  : cpfTouched && cpfValid ? "border-green-400 focus-visible:ring-green-400"
                  : ""
                }`}
                maxLength={14}
                autoComplete="off"
              />
              {cpfErrMsg && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {cpfErrMsg}
                </p>
              )}
              {cpfTouched && cpfValid && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 size={12} /> CPF válido
                </p>
              )}
            </div>

            {/* Data de nascimento */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Data de nascimento</label>
              <Input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                onBlur={() => setDataTouched(true)}
                className={`h-11 rounded-xl transition-colors ${
                  dataTouched && dateErr ? "border-red-400 focus-visible:ring-red-400"
                  : dataTouched && !dateErr && dataNascimento ? "border-green-400 focus-visible:ring-green-400"
                  : ""
                }`}
                max={new Date().toISOString().split("T")[0]}
              />
              {dataTouched && dateErr && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {dateErr}
                </p>
              )}
              {dataTouched && !dateErr && dataNascimento && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 size={12} /> Data válida
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? "Salvando…" : "Continuar para compra"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 leading-relaxed">
            Seus dados são protegidos conforme a{" "}
            <a href="/privacidade" className="underline hover:text-gray-600">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
