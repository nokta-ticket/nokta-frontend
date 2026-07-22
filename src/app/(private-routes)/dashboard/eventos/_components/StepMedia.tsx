"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, ImageIcon, CheckCircle2, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEvento } from "@/context/EventoContext";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
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

export default function StepMedia({ prevTab }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setThumbnails, submit, thumbnails } = useEvento();

  const makePreviews = useCallback(
    (fs: File[]) => fs.map((f) => URL.createObjectURL(f)),
    []
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const selected = Array.from(e.target.files);

      const valid = selected.filter((f) => {
        const ok = ALLOWED_TYPES.includes(f.type);
        if (!ok) toast.error(`Formato inválido: ${f.name}`);
        return ok;
      });

      const quota = MAX_IMAGES - thumbnails.length;
      const accepted = valid.slice(0, quota);

      if (accepted.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        accepted.forEach((el) => formData.append("files", el, el.name));

        const res = await api.post<{ data: string[] }>("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const nextFiles = [...thumbnails, ...res.data.data];
        const nextPreviews = [...previews, ...makePreviews(accepted)];
        setPreviews(nextPreviews);
        setThumbnails(nextFiles);
      } catch {
        toast.error("Erro ao fazer upload da imagem.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [thumbnails, previews, makePreviews, setThumbnails]
  );

  const removeImage = useCallback(
    (idx: number) => {
      // @ts-expect-error setThumbnails é tipado em EventoContext para receber o array
      // direto, não uma função atualizadora — mas em runtime é um setState do React,
      // que aceita as duas formas. Erro pré-existente corrigido na Fase 4 da unificação.
      setThumbnails((prev: string[]) => {
        const next = prev.filter((_: any, i: number) => i !== idx);
        setThumbnails(next);
        return next;
      });
      setPreviews((prev) => {
        URL.revokeObjectURL(prev[idx]);
        return prev.filter((_, i) => i !== idx);
      });
    },
    [setThumbnails]
  );

  const triggerInput = () => fileInputRef.current?.click();

  const handleSubmit = async () => {
    if (thumbnails.length === 0) return toast.warn("Adicione pelo menos 1 imagem.");
    setSubmitting(true);
    try { await submit(); } finally { setSubmitting(false); }
  };

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  const canAddMore = thumbnails.length < MAX_IMAGES;
  const readyToPublish = thumbnails.length > 0;

  const checklist = [
    { label: "Informações básicas preenchidas", done: true },
    { label: "Endereço do evento configurado", done: true },
    { label: "Lotes de ingressos criados", done: true },
    {
      label: thumbnails.length > 0
        ? `${thumbnails.length} imagem${thumbnails.length > 1 ? "s" : ""} adicionada${thumbnails.length > 1 ? "s" : ""}`
        : "Adicione ao menos 1 imagem",
      done: thumbnails.length > 0,
    },
  ];

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <ImageIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Imagens e Finalização</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Adicione imagens e publique o evento na plataforma</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Input oculto */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleChange}
          className="hidden"
        />

        {/* Grid de imagens */}
        {thumbnails.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">
                Imagens adicionadas
              </p>
              <span className="text-[11px] text-gray-400">{thumbnails.length} de {MAX_IMAGES}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {thumbnails.map((src, i) => (
                <div
                  key={`${i}-image`}
                  className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group"
                >
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={process.env.NEXT_PUBLIC_STORAGE_URL + src}
                      alt={`Imagem ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  </AspectRatio>

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className={cn(
                      "absolute right-2 top-2 rounded-full bg-white/90 backdrop-blur-sm p-1 text-gray-600 shadow-md",
                      "opacity-0 group-hover:opacity-100 transition-all duration-200",
                      "hover:bg-red-500 hover:text-white hover:scale-105"
                    )}
                  >
                    <X size={14} />
                  </button>

                  {/* Badge capa */}
                  {i === 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-semibold bg-black/65 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Capa principal
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Slot adicionar mais */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={triggerInput}
                  disabled={uploading}
                  className={cn(
                    "rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/40 min-h-[100px]",
                    "flex flex-col items-center justify-center gap-1.5 cursor-pointer",
                    "hover:border-primary/40 hover:bg-primary/5 transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-[11px] text-gray-500 font-medium">Adicionar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Tamanho recomendado: 818 × 355 px · Formatos: JPEG, PNG, WebP
            </p>
          </div>
        )}

        {/* Zona de upload vazia */}
        {thumbnails.length === 0 && (
          <button
            type="button"
            onClick={triggerInput}
            disabled={uploading}
            className={cn(
              "w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/30 py-16",
              "flex flex-col items-center gap-4 cursor-pointer group",
              "hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {uploading ? (
              <>
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-gray-500">Enviando imagens...</p>
              </>
            ) : (
              <>
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center",
                  "group-hover:bg-primary/10 transition-colors duration-200"
                )}>
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-gray-800 mb-1">
                    Clique para adicionar imagens
                  </p>
                  <p className="text-[12px] text-gray-500">
                    JPEG, PNG ou WebP · Recomendado 818 × 355 px
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Até {MAX_IMAGES} imagens por evento</p>
                </div>
              </>
            )}
          </button>
        )}

        {/* Checklist de publicação */}
        <div className={cn(
          "rounded-xl border px-5 py-4 space-y-3 transition-all duration-300",
          readyToPublish
            ? "border-primary/20 bg-primary/[0.04]"
            : "border-gray-200 bg-gray-50/50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={cn("w-4 h-4", readyToPublish ? "text-primary" : "text-gray-400")} />
            <p className="text-[13px] font-semibold text-gray-800">
              {readyToPublish ? "Tudo pronto para publicar!" : "Quase lá..."}
            </p>
          </div>
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                )}
                <span className={cn(
                  "text-[12px] leading-tight",
                  item.done ? "text-gray-700" : "text-amber-600 font-medium"
                )}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
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
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !readyToPublish}
          className={cn(
            "h-12 px-8 gap-2.5 rounded-xl text-[14px] font-bold",
            "bg-primary text-white",
            "hover:bg-primary/90 hover:shadow-[0_8px_28px_-4px_oklch(0.606_0.25_292.717/0.55)]",
            "hover:scale-[1.01] active:scale-[0.98] transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
          )}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Publicar evento
            </>
          )}
        </Button>
      </div>
    </CardShell>
  );
}
