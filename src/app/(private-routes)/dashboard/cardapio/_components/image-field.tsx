"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { resolveMediaUrl } from "@/lib/media";
import { useImageUpload } from "../_hooks/use-image-upload";

/** Campo de imagem reutilizável (produto, categoria) — reaproveita POST /upload. */
export function ImageField({
  label = "Imagem",
  hint = "JPG, PNG ou WEBP. Quadrada fica melhor no cardápio.",
  value,
  onChange,
}: {
  label?: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useImageUpload();
  const src = value ? resolveMediaUrl(value) : null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2 hairline">
          {src ? (
            <Image src={src} alt="" fill sizes="64px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-subtle-foreground">
              <Icon name="image" size={18} />
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" leftIcon="upload" loading={uploading} onClick={() => inputRef.current?.click()}>
            {value ? "Trocar" : "Enviar imagem"}
          </Button>
          {value ? (
            <Button type="button" variant="subtle" size="sm" leftIcon="trash" onClick={() => onChange(null)}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}
