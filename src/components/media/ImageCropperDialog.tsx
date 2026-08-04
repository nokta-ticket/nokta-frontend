"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Mesma lógica de recorte usada em (private-routes)/perfil/editar/page.tsx — extraída aqui pra reaproveitar em qualquer upload de imagem (logo/banner de organização, etc.), nunca duplicada. */
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop failed"))), "image/jpeg", 0.92));
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  cropShape = "rect",
  title = "Ajustar imagem",
  saving = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** data URL (FileReader.readAsDataURL) da imagem escolhida pelo usuário. */
  imageSrc: string | null;
  /** largura/altura do recorte final — 1 para logo circular, 4 (1600x400) para banner, etc. */
  aspect: number;
  cropShape?: "rect" | "round";
  title?: string;
  saving?: boolean;
  onConfirm: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    const blob = await getCroppedBlob(imageSrc, croppedArea);
    onConfirm(blob);
  };

  return (
    <Dialog
      open={open && Boolean(imageSrc)}
      onOpenChange={(v) => {
        if (!v) {
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedArea(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <>
            <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ height: 320 }}>
              {/* restrictPosition=false + minZoom bem baixo: usuário pediu liberdade total de arraste/zoom (o padrão da lib trava a imagem nos limites da área de recorte, impedindo mostrar espaço vazio nas bordas — não é o comportamento desejado aqui). */}
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.2}
                maxZoom={3}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={cropShape === "rect"}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <ZoomOut size={16} className="shrink-0 text-black/40" />
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-black"
                aria-label="Zoom"
              />
              <ZoomIn size={16} className="shrink-0 text-black/40" />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-black/60 transition hover:bg-black/5 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
