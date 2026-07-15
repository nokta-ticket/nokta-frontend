"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resolveMediaUrl } from "@/lib/media";
import { useImageUpload } from "../_hooks/use-image-upload";

/** Campo de imagem reutilizável (produto, categoria) — reaproveita POST /upload. */
export function ImageField({
  label = "Imagem",
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
          {value ? (
            <Image
              src={resolveMediaUrl(value) ?? "/logo.png"}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-black/30">
              <ImagePlus size={20} />
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover imagem"
            onClick={() => onChange(null)}
          >
            <X size={16} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
