"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle, Loader2, ShieldCheck, User } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

function getInitials(nome: string, sobrenome: string): string {
  const a = nome?.[0] ?? "";
  const b = sobrenome?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function EditarPerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [nomeTouched, setNomeTouched] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

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
        setNome(res.data.nome ?? "");
        setSobrenome(res.data.sobrenome ?? "");
        setFotoPerfil(res.data.fotoPerfil ?? null);
        const e = res.data.endereco;
        if (e) {
          setEndCep(e.cep ?? "");
          setEndRua(e.logradouro ?? "");
          setEndNumero(e.numero ?? "");
          setEndBairro(e.bairro ?? "");
          setEndCidade(e.cidade ?? "");
          setEndUf(e.uf ?? "");
          setEndComplemento(e.complemento ?? "");
        }
      })
      .catch((err: any) => toast.error(err?.message ?? "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local imediato
    setFotoPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("foto", file);

    setUploadingFoto(true);
    try {
      const res = await api.patch("/auth/me/foto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFotoPerfil(res.data.fotoPerfil);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao enviar foto.");
      setFotoPreview(null);
    } finally {
      setUploadingFoto(false);
      // Limpa o input para permitir re-envio do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatCep = (v: string) => { const c = v.replace(/\D/g, "").slice(0, 8); return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c; };

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
    setNomeTouched(true);
    if (!nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
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
      router.push("/perfil");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar. Tente novamente.");
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

  const initials = getInitials(nome, sobrenome);
  const fotoSrc = fotoPreview ?? (fotoPerfil ? `${API_URL.replace("/api", "")}/uploads/${fotoPerfil}` : null);

  return (
    <main className="min-h-screen bg-white text-[#0f172a]">
      <section className="mx-auto max-w-lg px-4 py-8">

        {/* Título */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition hover:bg-purple-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>
            <p className="text-sm text-slate-500">Atualize suas informações pessoais.</p>
          </div>
        </div>

        {/* Card de foto */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-100 text-2xl font-black text-purple-600 overflow-hidden">
              {fotoSrc ? (
                <img src={fotoSrc} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                initials || <User size={28} />
              )}
              {uploadingFoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-purple-600 shadow-md transition hover:scale-105"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <h2 className="font-semibold text-slate-800">Foto de perfil</h2>
              <p className="mt-0.5 text-sm text-slate-500">Adicione uma foto para personalizar sua conta.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50 disabled:opacity-60"
              >
                {uploadingFoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={15} />}
                {uploadingFoto ? "Enviando…" : "Alterar foto"}
              </button>
              <p className="mt-1.5 text-xs text-slate-400">JPG, PNG ou WebP. Máx. 5MB.</p>
            </div>
          </div>

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Card de formulário */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Informações pessoais</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
              <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 ${nomeTouched && !nome.trim() ? "border-red-400" : "border-slate-200"}`}>
                <User size={17} className="text-purple-600 shrink-0" />
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={() => setNomeTouched(true)}
                  placeholder="Seu nome"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              {nomeTouched && !nome.trim() && (
                <p className="mt-1 text-xs text-red-500">O nome é obrigatório</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Sobrenome</label>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100">
                <User size={17} className="text-purple-600 shrink-0" />
                <input
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  placeholder="Seu sobrenome"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card de endereço */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Endereço de cobrança</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">CEP</label>
                <input value={endCep} onChange={(e) => { const v = formatCep(e.target.value); setEndCep(v); buscarCep(v); }} maxLength={9} placeholder="00000-000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Número</label>
                <input value={endNumero} onChange={(e) => setEndNumero(e.target.value)} placeholder="Nº" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Rua</label>
              <input value={endRua} onChange={(e) => setEndRua(e.target.value)} placeholder="Logradouro" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Bairro</label>
              <input value={endBairro} onChange={(e) => setEndBairro(e.target.value)} placeholder="Bairro" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cidade</label>
                <input value={endCidade} onChange={(e) => setEndCidade(e.target.value)} placeholder="Cidade" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">UF</label>
                <input value={endUf} onChange={(e) => setEndUf(e.target.value.toUpperCase())} maxLength={2} placeholder="UF" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Complemento (opcional)</label>
              <input value={endComplemento} onChange={(e) => setEndComplemento(e.target.value)} placeholder="Apto, bloco..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-purple-200 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>

        {/* Card de segurança */}
        <div className="rounded-2xl bg-purple-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-purple-700">Seus dados estão seguros</h3>
              <p className="mt-1 text-sm text-slate-500">
                Utilizamos criptografia e boas práticas para proteger suas informações.
              </p>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
