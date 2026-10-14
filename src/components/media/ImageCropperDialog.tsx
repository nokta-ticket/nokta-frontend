"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Nenhum dos usos deste cropper (logo/banner de organização, avatar de
 * perfil) precisa de mais que 1200px no lado maior pra exibição em tela —
 * sem esse teto, o canvas final saía na resolução ORIGINAL da foto (uma
 * foto de celular moderno facilmente teria 3000-4000px+ no lado maior),
 * gerando arquivos de vários MB servidos com <Image unoptimized> no
 * cardápio público. Reduzir aqui, na origem, corrige pra qualquer imagem
 * futura.
 */
const MAX_OUTPUT_DIMENSION = 1200;

/**
 * PNG é compressão sem perdas — ótimo pra logo com poucas cores, péssimo
 * pra foto/arte complexa. A maioria dos PNGs enviados aqui não tem nenhum
 * pixel transparente de verdade; checar os pixels reais do canvas é a única
 * forma confiável de saber se há transparência — só aí vale manter PNG;
 * sem nenhum pixel com alpha < 255, converte pra JPEG e ganha a compressão.
 */
function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

async function getCroppedBlob(src: string, area: Area, sourceMimeType: string): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = src;
  });

  // Escala pra baixo (nunca pra cima) se o crop exceder o teto — mantém a
  // proporção exata do retângulo recortado.
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(area.width, area.height));
  const outputWidth = Math.round(area.width * scale);
  const outputHeight = Math.round(area.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outputWidth, outputHeight);

  // Decide o formato ANTES de qualquer fundo — a checagem precisa ler os
  // pixels como a imagem realmente os desenhou.
  const canPreserveAlpha = sourceMimeType === "image/png" || sourceMimeType === "image/webp" || sourceMimeType === "image/gif";
  const mimeType = canPreserveAlpha && canvasHasTransparency(ctx, outputWidth, outputHeight) ? sourceMimeType : "image/jpeg";

  // Canvas novo nasce transparente — qualquer px não coberto viraria PRETO
  // ao exportar como JPEG. Só entra quando o resultado final É JPEG; pinta o
  // branco ATRÁS da imagem já pronta ("destination-over").
  if (mimeType === "image/jpeg") {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  const quality = mimeType === "image/jpeg" ? 0.85 : undefined;
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop failed"))), mimeType, quality));
}

/** Extensão de arquivo a partir do mime type do blob recortado — para nomear o File antes do upload (nunca fixar ".jpg" quando o blob pode ser PNG/WEBP). */
export function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

/** imageSrc é uma data URL (novo upload) ou uma URL remota (reabrindo a imagem original já salva) — nos dois casos dá pra inferir o formato de origem sem carregar o arquivo. */
function detectSourceMimeType(imageSrc: string): string | null {
  const dataUrlMatch = /^data:([^;]+);/.exec(imageSrc);
  if (dataUrlMatch) return dataUrlMatch[1];

  const extensionMatch = /\.(png|webp|gif|jpe?g)(\?|$)/i.exec(imageSrc);
  if (!extensionMatch) return null;
  const ext = extensionMatch[1].toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

/**
 * Recorte de imagem (logo, banner, avatar). Fundo em xadrez pra transparência
 * aparecer durante o ajuste; `cropShape="round"` pra avatar. A API é usada
 * pelo painel também — não mudar as props.
 */
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
  /** largura/altura do recorte final — 1 para logo circular, 430/190 para banner, etc. */
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
    const blob = await getCroppedBlob(imageSrc, croppedArea, detectSourceMimeType(imageSrc) ?? "image/jpeg");
    onConfirm(blob);
  };

  return (
    <Dialog
      open={open && Boolean(imageSrc)}
      onOpenChange={(v) => {
        if (saving) return;
        if (!v) {
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedArea(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <>
            <DialogBody className="gap-4">
              {/* Xadrez (padrão de editor de imagem pra transparência) em vez de fundo sólido — um fundo escuro escondia lettering preto de logos transparentes. */}
              <div
                className="relative w-full overflow-hidden rounded-xl"
                style={{
                  height: 320,
                  backgroundColor: "var(--surface)",
                  backgroundImage: "linear-gradient(45deg, var(--surface-3) 25%, transparent 25%), linear-gradient(-45deg, var(--surface-3) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--surface-3) 75%), linear-gradient(-45deg, transparent 75%, var(--surface-3) 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                }}
              >
                {/* restrictPosition=true (padrão): a imagem nunca fica menor que a área de recorte nem sai dela — senão o canvas desenhava a faixa vazia como preto. */}
                <Cropper image={imageSrc} crop={crop} zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} aspect={aspect} cropShape={cropShape} showGrid={cropShape === "rect"} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Diminuir zoom" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))} className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                  <Icon name="minus" size={12} />
                </button>
                <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer accent-brand" aria-label="Zoom" />
                <button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))} className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                  <Icon name="plus" size={12} />
                </button>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} loading={saving} leftIcon={saving ? undefined : "check"}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
