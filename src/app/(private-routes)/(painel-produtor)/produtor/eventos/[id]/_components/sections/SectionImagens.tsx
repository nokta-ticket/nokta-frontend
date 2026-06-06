"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X, Upload, ImageIcon, Save, AlertCircle } from "lucide-react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { SectionProps } from "../types"

const MAX_IMAGES   = 3
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
      {children}
    </div>
  )
}

export default function SectionImagens({ event, onRefresh }: SectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // paths: mix of existing (db paths) and newly uploaded paths
  const [paths, setPaths] = useState<string[]>(
    event.thumbnails?.map((t) => t.url) ?? []
  )
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const canAddMore = paths.length < MAX_IMAGES
  const hasChanges = JSON.stringify(paths) !== JSON.stringify(event.thumbnails?.map((t) => t.url) ?? [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return
      const selected = Array.from(e.target.files)

      const valid = selected.filter((f) => {
        const ok = ALLOWED_TYPES.includes(f.type)
        if (!ok) toast.error(`Formato inválido: ${f.name}`)
        return ok
      })

      const quota    = MAX_IMAGES - paths.length
      const accepted = valid.slice(0, quota)
      if (accepted.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        accepted.forEach((f) => formData.append("files", f, f.name))

        const res = await api.post<{ data: string[] }>("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        setPaths((prev) => [...prev, ...res.data.data])
      } catch {
        toast.error("Erro ao fazer upload da imagem.")
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [paths]
  )

  const removeImage = (idx: number) => {
    setPaths((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (paths.length === 0) return toast.error("Adicione pelo menos 1 imagem antes de salvar.")
    setSaving(true)
    try {
      await api.put(`/produtor/eventos/${event.id}`, { thumbnails: paths })
      toast.success("Imagens salvas com sucesso!")
      onRefresh()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao salvar imagens"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CardShell>
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <ImageIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Imagens do Evento</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Adicione até {MAX_IMAGES} imagens — a primeira será a capa</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <Input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Info quando há mudanças não salvas */}
        {hasChanges && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[12px] text-amber-700 font-medium">
              Você tem alterações não salvas. Clique em "Salvar imagens" para confirmar.
            </p>
          </div>
        )}

        {/* Grid de imagens */}
        {paths.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">
                Imagens adicionadas
              </p>
              <span className="text-[11px] text-gray-400">{paths.length} de {MAX_IMAGES}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paths.map((src, i) => (
                <div
                  key={`${i}-${src}`}
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

                  {i === 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-semibold bg-black/65 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Capa principal
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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

        {/* Upload vazio */}
        {paths.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || paths.length === 0}
          className={cn(
            "h-11 px-7 gap-2 rounded-xl text-[13px] font-semibold",
            "bg-primary text-white shadow-sm",
            "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
            "active:scale-[0.97] transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />Salvando...</>
          ) : (
            <><Save className="w-4 h-4" />Salvar imagens</>
          )}
        </Button>
      </div>
    </CardShell>
  )
}
