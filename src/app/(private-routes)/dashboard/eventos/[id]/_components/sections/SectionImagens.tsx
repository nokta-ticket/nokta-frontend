"use client";

import { useCallback, useRef, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { ImageCropperDialog, extensionForMimeType } from "@/components/media/ImageCropperDialog";
import { Callout } from "@/components/ui/callout";
import { ImageGrid } from "../../../_components/form/image-grid";
import { SaveBar, SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Mesma proporção já anunciada na tela ("Tamanho recomendado: 818 × 355 px").
const BANNER_ASPECT = 818 / 355;

export default function SectionImagens({ event, onRefresh }: SectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // paths: mix of existing (db paths) and newly uploaded paths
  const [paths, setPaths] = useState<string[]>(event.thumbnails?.map((t) => t.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fila de arquivos aguardando recorte (upload permite múltiplos de uma
  // vez, mas o cropper é 1 imagem por vez) + a data URL da imagem atual
  // sendo ajustada. Sem o cropper, banners de vários MB iam pro storage sem
  // redução (teto de 1200px, PNG opaco vira JPEG ~0.85 — ver ImageCropperDialog).
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const hasChanges = JSON.stringify(paths) !== JSON.stringify(event.thumbnails?.map((t) => t.url) ?? []);

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const selected = Array.from(e.target.files);
      const valid = selected.filter((f) => {
        const ok = ALLOWED_TYPES.includes(f.type);
        if (!ok) toast.error(`Formato inválido: ${f.name}. Use JPEG, PNG ou WebP.`);
        return ok;
      });
      const quota = MAX_IMAGES - paths.length;
      const accepted = valid.slice(0, quota);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (accepted.length === 0) return;
      loadNextInQueue(accepted);
    },
    [paths, loadNextInQueue],
  );

  const handleConfirmCrop = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      try {
        const file = new File([blob], `evento.${extensionForMimeType(blob.type)}`, { type: blob.type });
        const formData = new FormData();
        formData.append("files", file, file.name);
        const res = await api.post<{ data: string[] }>("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setPaths((prev) => [...prev, ...res.data.data]);
      } catch {
        toast.error("Erro ao fazer upload da imagem.");
      } finally {
        setUploading(false);
        loadNextInQueue(cropQueue);
      }
    },
    [cropQueue, loadNextInQueue],
  );

  const handleSave = async () => {
    if (paths.length === 0) return toast.error("Adicione pelo menos 1 imagem antes de salvar.");
    setSaving(true);
    try {
      await api.put(`/produtor/eventos/${event.id}`, { thumbnails: paths });
      toast.success("Imagens salvas");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as imagens."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Imagens do evento" description={`Até ${MAX_IMAGES} imagens. A primeira é a capa, no banner 818 × 355 da página pública.`} footer={<SaveBar onSave={handleSave} saving={saving} disabled={paths.length === 0} label="Salvar imagens" hint={hasChanges ? "Alterações ainda não salvas" : undefined} />}>
      <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(",")} multiple onChange={handleFileChange} className="sr-only" tabIndex={-1} />

      {hasChanges ? (
        <Callout tone="warning" title="Você tem alterações não salvas">
          Clique em “Salvar imagens” pra confirmar.
        </Callout>
      ) : null}

      <ImageGrid paths={paths} max={MAX_IMAGES} uploading={uploading} onAdd={() => fileInputRef.current?.click()} onRemove={(idx) => setPaths((prev) => prev.filter((_, i) => i !== idx))} onMakeCover={(idx) => setPaths((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)])} />

      <ImageCropperDialog
        open={Boolean(imageSrc)}
        onOpenChange={(v) => {
          // Fechar sem confirmar pula pra próxima da fila (se houver) em vez
          // de descartar o restante do lote selecionado.
          if (!v) loadNextInQueue(cropQueue);
        }}
        imageSrc={imageSrc}
        aspect={BANNER_ASPECT}
        cropShape="rect"
        title="Ajustar imagem do evento"
        saving={uploading}
        onConfirm={handleConfirmCrop}
      />
    </SectionCard>
  );
}
