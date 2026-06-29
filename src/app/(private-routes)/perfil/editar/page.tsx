"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, ShieldCheck, User, ZoomIn, ZoomOut } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

function getInitials(nome: string, sobrenome: string): string {
  return ((nome?.[0] ?? "") + (sobrenome?.[0] ?? "")).toUpperCase();
}

async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = src; });

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop failed"))), "image/jpeg", 0.92));
}

export default function EditarFotoPerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        setNome(res.data.nome ?? "");
        setSobrenome(res.data.sobrenome ?? "");
        setFotoPerfil(res.data.fotoPerfil ?? null);
      })
      .catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedArea) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      const formData = new FormData();
      formData.append("foto", blob, "profile.jpg");
      const res = await api.patch("/auth/me/foto", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFotoPerfil(res.data.fotoPerfil);
      setImageSrc(null);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao enviar foto.");
    } finally {
      setUploading(false);
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
  const fotoSrc = fotoPerfil && fotoPerfil.startsWith("http") ? fotoPerfil : null;

  return (
    <main className="min-h-screen bg-white text-[#0f172a]">
      <section className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition hover:bg-purple-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar foto do perfil</h1>
            <p className="text-sm text-slate-500">Adicione ou altere sua foto de perfil.</p>
          </div>
        </div>

        {/* Crop modal */}
        {imageSrc ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="relative w-full" style={{ height: 320 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-3 border-t">
              <ZoomOut size={16} className="text-slate-400" />
              <input
                type="range" min={1} max={3} step={0.05} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-purple-600"
              />
              <ZoomIn size={16} className="text-slate-400" />
            </div>
            <div className="flex gap-3 px-5 pb-4">
              <button onClick={() => setImageSrc(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={handleSaveCrop} disabled={uploading}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {uploading ? "Salvando…" : "Salvar foto"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-100 text-2xl font-black text-purple-600 overflow-hidden">
                {fotoSrc ? (
                  <img src={fotoSrc} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  initials || <User size={28} />
                )}
                <button type="button"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white text-purple-600 shadow-md transition hover:scale-105"
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera size={14} />
                </button>
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Foto de perfil</h2>
                <p className="mt-0.5 text-sm text-slate-500">Adicione uma foto para personalizar sua conta.</p>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50">
                  <Camera size={15} />
                  Alterar foto
                </button>
                <p className="mt-1.5 text-xs text-slate-400">JPG, PNG ou WebP. Máx. 5MB.</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        )}

        <div className="rounded-2xl bg-purple-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-purple-700">Seus dados estão seguros</h3>
              <p className="mt-1 text-sm text-slate-500">Utilizamos criptografia e boas práticas para proteger suas informações.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
