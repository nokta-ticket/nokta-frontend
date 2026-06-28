"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, ShieldCheck, User } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

function getInitials(nome: string, sobrenome: string): string {
  const a = nome?.[0] ?? "";
  const b = sobrenome?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function EditarFotoPerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setNome(res.data.nome ?? "");
        setSobrenome(res.data.sobrenome ?? "");
        setFotoPerfil(res.data.fotoPerfil ?? null);
      })
      .catch((err: any) => toast.error(err?.message ?? "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition hover:bg-purple-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar foto do perfil</h1>
            <p className="text-sm text-slate-500">Adicione ou altere sua foto de perfil.</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-5">
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

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
