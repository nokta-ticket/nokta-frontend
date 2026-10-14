"use client";

import { useCallback, useRef, useState } from "react";
import { useEvento } from "@/context/EventoContext";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { ImageCropperDialog, extensionForMimeType } from "@/components/media/ImageCropperDialog";
import { Icon } from "@/components/ui/icon";
import { SectionCard } from "../[id]/_components/section-ui";
import { ImageGrid } from "./form/image-grid";

const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BANNER_ASPECT = 818 / 355;

export default function StepMedia() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { setThumbnails, thumbnails, data, lotes } = useEvento();

  // Mesmo fluxo da seção Imagens do editor: cada arquivo passa pelo cropper
  // (banner 818×355, teto de resolução) antes de subir pro /upload.
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const loadNextInQueue = useCallback((queue: File[]) => {
    const [next, ...rest] = queue;
    if (!next) {
      setCropQueue([]);
      setImageSrc(null);
      return;
    }
    setCropQueue(rest);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(next);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const selected = Array.from(e.target.files);
      const valid = selected.filter((f) => {
        const ok = ALLOWED_TYPES.includes(f.type);
        if (!ok) toast.error(`Formato inválido: ${f.name}. Use JPEG, PNG ou WebP.`);
        return ok;
      });
      const quota = MAX_IMAGES - thumbnails.length;
      const accepted = valid.slice(0, quota);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (accepted.length === 0) return;
      loadNextInQueue(accepted);
    },
    [thumbnails, loadNextInQueue],
  );

  const handleConfirmCrop = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      try {
        const file = new File([blob], `evento.${extensionForMimeType(blob.type)}`, { type: blob.type });
        const formData = new FormData();
        formData.append("files", file, file.name);
        const res = await api.post<{ data: string[] }>("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setThumbnails([...thumbnails, ...res.data.data]);
      } catch {
        toast.error("Erro ao fazer upload da imagem.");
      } finally {
        setUploading(false);
        loadNextInQueue(cropQueue);
      }
    },
    [thumbnails, cropQueue, loadNextInQueue, setThumbnails],
  );

  const removeImage = (idx: number) => setThumbnails(thumbnails.filter((_, i) => i !== idx));
  const makeCover = (idx: number) => setThumbnails([thumbnails[idx], ...thumbnails.filter((_, i) => i !== idx)]);

  const checklist = [
    { label: "Nome, data e descrição", done: Boolean(data.nome && data.data && data.descricao) },
    { label: "Endereço do evento", done: Boolean(data.endereco.logradouro && data.endereco.numero) },
    { label: "Ao menos um lote de ingressos", done: lotes.length > 0 },
    { label: thumbnails.length > 0 ? `${thumbnails.length} ${thumbnails.length > 1 ? "imagens adicionadas" : "imagem adicionada"}` : "Ao menos uma imagem de capa", done: thumbnails.length > 0 },
  ];
  const ready = checklist.every((c) => c.done);

  return (
    <div className="space-y-4">
      <SectionCard title="Imagens do evento" description={`Até ${MAX_IMAGES} imagens. A primeira é a capa, no banner 818 × 355 da página pública.`}>
        <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(",")} multiple onChange={handleChange} className="sr-only" tabIndex={-1} />
        <ImageGrid paths={thumbnails} max={MAX_IMAGES} uploading={uploading} onAdd={() => fileInputRef.current?.click()} onRemove={removeImage} onMakeCover={makeCover} />
      </SectionCard>

      <section className={cn("rounded-card border p-5 shadow-card transition-colors", ready ? "card-accent border-border bg-surface" : "border-border bg-surface")}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon name={ready ? "magic" : "clipboard-check"} size={14} className={ready ? "text-brand" : "text-muted-foreground"} />
          {ready ? "Tudo pronto pra publicar!" : "Quase lá…"}
        </h3>
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-sm">
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", item.done ? "bg-success text-white" : "bg-warning-bg text-warning")}>
                <Icon name={item.done ? "check" : "warning"} size={9} />
              </span>
              <span className={item.done ? "text-muted-foreground" : "font-medium text-foreground"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <ImageCropperDialog
        open={Boolean(imageSrc)}
        onOpenChange={(v) => {
          if (!v) loadNextInQueue(cropQueue);
        }}
        imageSrc={imageSrc}
        aspect={BANNER_ASPECT}
        cropShape="rect"
        title="Ajustar imagem do evento"
        saving={uploading}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}
