"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Nenhum dos 3 usos deste cropper (logo/banner de organização, avatar de
 * perfil) precisa de mais que 1200px no lado maior pra exibição em tela —
 * sem esse teto, o canvas final saía na resolução ORIGINAL da foto (uma
 * foto de celular moderno facilmente teria 3000-4000px+ no lado maior),
 * gerando arquivos de vários MB salvos sem nenhuma compressão de tamanho
 * no Supabase Storage e servidos com <Image unoptimized> no cardápio
 * público (necessário pra fotos de terceiros como Unsplash/Wikimedia, que
 * não têm otimização automática do Next configurada) — resultado:
 * logo/banner demoravam visivelmente pra carregar no cardápio, sobretudo
 * em rede móvel (relatado pelo usuário). Reduzir aqui, na origem, corrige
 * pra qualquer imagem futura sem depender de mexer em otimização de
 * imagem remota nem arriscar quebrar hosts externos já configurados.
 */
const MAX_OUTPUT_DIMENSION = 1200;

/**
 * PNG é compressão sem perdas — ótimo pra logo com poucas cores/texto
 * nítido, péssimo pra foto/arte gráfica complexa (gradientes, muitas
 * cores): um banner de evento em PNG a 1200x530 ainda pesava 1.3MB depois
 * do cap de resolução, porque PNG não consegue comprimir esse tipo de
 * conteúdo como JPEG consegue. Decidir isso só pelo formato de ORIGEM
 * (PNG entrava, PNG saía, versão anterior desta função) não bastava — a
 * maioria dos PNGs
 * enviados aqui na prática não tem nenhum pixel transparente de verdade
 * (banner exportado do Canva/Photoshop como PNG "por padrão", não porque
 * precisa de alfa). Checar os pixels reais do canvas é a única forma
 * confiável de saber se há transparência de verdade — só aí vale manter
 * PNG; sem nenhum pixel com alpha < 255, converte pra JPEG e ganha a
 * compressão sem perder nada (nunca haveria transparência visível mesmo).
 */
function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

/** Mesma lógica de recorte usada em (private-routes)/perfil/editar/page.tsx — extraída aqui pra reaproveitar em qualquer upload de imagem (logo/banner de organização, etc.), nunca duplicada. */
async function getCroppedBlob(src: string, area: Area, sourceMimeType: string): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = src;
  });

  // Escala pra baixo (nunca pra cima) se o crop exceder o teto — mantém a
  // proporção exata do retângulo recortado, só reduz a densidade de
  // pixels final.
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(area.width, area.height));
  const outputWidth = Math.round(area.width * scale);
  const outputHeight = Math.round(area.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outputWidth, outputHeight);

  const canPreserveAlpha = sourceMimeType === "image/png" || sourceMimeType === "image/webp" || sourceMimeType === "image/gif";
  const mimeType = canPreserveAlpha && canvasHasTransparency(ctx, outputWidth, outputHeight) ? sourceMimeType : "image/jpeg";
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

/** imageSrc é uma data URL (novo upload, prefixo data:mime;base64) ou uma URL remota (reabrindo a partir da imagem original já salva) — nos dois casos dá pra inferir o formato de origem sem precisar carregar o arquivo. */
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
            {/* Fundo em xadrez (padrão de qualquer editor de imagem pra indicar transparência) em vez de bg-black sólido — um bg-black escondia lettering preto de logos com fundo transparente durante o ajuste, mesmo sem afetar o arquivo final salvo. */}
            <div
              className="relative w-full overflow-hidden rounded-xl"
              style={{
                height: 320,
                backgroundImage:
                  "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                backgroundColor: "#fff",
              }}
            >
              {/* restrictPosition=true (padrão da lib): a imagem nunca pode ficar menor que a área de recorte nem sair arrastada pra fora dela — com restrictPosition=false, era possível deixar uma faixa "vazia" dentro da área (fora dos limites reais da imagem), e getCroppedBlob desenha isso como preto sólido no canvas (bordas pretas no banner salvo, mesmo o preview do cropper parecendo correto). */}
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.2}
                maxZoom={3}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={cropShape === "rect"}
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
