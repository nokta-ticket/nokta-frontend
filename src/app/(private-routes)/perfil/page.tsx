"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Camera, Lock, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiBaseUrl } from "@/lib/surfaces";

// Fase 5: API resolvida por host, não uma NEXT_PUBLIC_API_URL fixa.
const API_URL = getApiBaseUrl();

interface EnderecoData {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  complemento?: string | null;
}

interface UserMe {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string | null;
  telefoneVerificado?: boolean | null;
  createdAt: string;
  fotoPerfil?: string | null;
  endereco?: EnderecoData | null;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getInitials(nome: string, sobrenome: string): string {
  const a = nome?.[0] ?? "";
  const b = sobrenome?.[0] ?? "";
  return (a + b).toUpperCase();
}

function InfoRow({
  label,
  value,
  extra,
}: {
  label: string;
  value?: string | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800">
          {value || <span className="text-gray-300 italic">Não informado</span>}
        </p>
      </div>
      {extra}
    </div>
  );
}

function formatCep(v: string) { const c = v.replace(/\D/g, "").slice(0, 8); return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c; }

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados editáveis
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [endCep, setEndCep] = useState("");
  const [endRua, setEndRua] = useState("");
  const [endNumero, setEndNumero] = useState("");
  const [endBairro, setEndBairro] = useState("");
  const [endCidade, setEndCidade] = useState("");
  const [endUf, setEndUf] = useState("");
  const [endComplemento, setEndComplemento] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const d = res.data;
        setUser(d);
        setNome(d.nome ?? "");
        setSobrenome(d.sobrenome ?? "");
        const e = d.endereco;
        if (e) {
          setEndCep(e.cep ? formatCep(e.cep) : "");
          setEndRua(e.logradouro ?? "");
          setEndNumero(e.numero ?? "");
          setEndBairro(e.bairro ?? "");
          setEndCidade(e.cidade ?? "");
          setEndUf(e.uf ?? "");
          setEndComplemento(e.complemento ?? "");
        }
      })
      .catch((err: any) => toast.error(err?.message ?? "Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, []);

  const buscarCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setEndRua(d.logradouro ?? "");
        setEndBairro(d.bairro ?? "");
        setEndCidade(d.localidade ?? "");
        setEndUf(d.uf ?? "");
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error("O nome é obrigatório."); return; }
    setSaving(true);
    try {
      await api.put("/auth/me", {
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        endereco: {
          cep: endCep.replace(/\D/g, ""),
          logradouro: endRua,
          numero: endNumero,
          bairro: endBairro,
          cidade: endCidade,
          uf: endUf,
          complemento: endComplemento,
        },
      });
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) return null;

  const initials = getInitials(user.nome, user.sobrenome);
  const nomeCompleto = [user.nome, user.sobrenome].filter(Boolean).join(" ");
  const fotoSrc = user.fotoPerfil ? (user.fotoPerfil.startsWith("http") ? user.fotoPerfil : `${API_URL.replace("/api", "")}/uploads/${user.fotoPerfil}`) : null;

  const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Avatar + foto */}
      <div className="flex flex-col items-center gap-3 py-6">
        <Avatar className="h-24 w-24 text-2xl">
          {fotoSrc && <AvatarImage src={fotoSrc} alt={nomeCompleto} className="object-cover" />}
          <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-lg font-semibold text-gray-900">{nomeCompleto}</p>
        <button
          onClick={() => router.push("/perfil/editar")}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <Camera size={14} /> Editar foto do perfil
        </button>
      </div>

      {/* Info (read-only) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow
          label="Telefone"
          value={user.telefone ? formatPhone(user.telefone) : null}
          extra={
            user.telefone ? (
              user.telefoneVerificado ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 size={14} /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                  <XCircle size={14} /> Não verificado
                </span>
              )
            ) : undefined
          }
        />
        <InfoRow label="Membro desde" value={formatDate(user.createdAt)} />
      </div>

      {/* Dados pessoais (editáveis) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Dados pessoais</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Sobrenome</label>
            <input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Sobrenome" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Endereço (editável) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Endereço</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">CEP</label>
            <input value={endCep} onChange={(e) => { const v = formatCep(e.target.value); setEndCep(v); buscarCep(v); }} maxLength={9} placeholder="00000-000" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Número</label>
            <input value={endNumero} onChange={(e) => setEndNumero(e.target.value)} placeholder="Nº" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Rua</label>
          <input value={endRua} onChange={(e) => setEndRua(e.target.value)} placeholder="Logradouro" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bairro</label>
          <input value={endBairro} onChange={(e) => setEndBairro(e.target.value)} placeholder="Bairro" className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Cidade</label>
            <input value={endCidade} onChange={(e) => setEndCidade(e.target.value)} placeholder="Cidade" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">UF</label>
            <input value={endUf} onChange={(e) => setEndUf(e.target.value.toUpperCase())} maxLength={2} placeholder="UF" className={`${inputCls} uppercase`} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Complemento (opcional)</label>
          <input value={endComplemento} onChange={(e) => setEndComplemento(e.target.value)} placeholder="Apto, bloco..." className={inputCls} />
        </div>
      </div>

      {/* Botão salvar */}
      <Button
        className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
        {saving ? "Salvando…" : "Salvar alterações"}
      </Button>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
          onClick={() => router.push("/alterar-senha")}
        >
          <Lock size={16} className="mr-2" />
          Alterar senha
        </Button>

        <Button
          variant="ghost"
          className="w-full h-12 rounded-xl text-red-500 font-medium hover:bg-red-50 hover:text-red-600"
          onClick={() => router.push("/excluir-conta")}
        >
          <Trash2 size={16} className="mr-2" />
          Excluir conta
        </Button>
      </div>
    </div>
  );
}
