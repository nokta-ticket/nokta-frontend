"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Download, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

/**
 * QR code do link público do cardápio, pra o produtor imprimir e colocar
 * no ambiente (mesa, balcão, entrada) — o cliente aponta a câmera e cai
 * direto no cardápio digital, sem digitar nada. Reaproveita o mesmo padrão
 * de export de imagem já usado em meus-ingressos/[id] (html-to-image
 * renderizando um cartão em DOM real e baixando como PNG) — nunca gera o
 * PNG a partir do <QRCode> isolado, porque perderia nome/margem/instrução
 * de uso que ajudam a identificar o cartaz impresso.
 */
export function MenuQrCodeDialog({
  publicUrl,
  orgName,
}: {
  publicUrl: string | null;
  orgName: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!posterRef.current || !publicUrl) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      const link = document.createElement("a");
      link.download = `qr-code-cardapio-${orgName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!publicUrl}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-black/50 hover:bg-black/[0.02] disabled:opacity-40"
        aria-label="Gerar QR code do cardápio"
      >
        <QrCode size={16} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR code do cardápio</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center py-2">
            {/* Cartaz exportado — fundo branco sólido e margem generosa em
            volta do QR (zona de silêncio), sem isso alguns leitores de
            câmera falham ao escanear perto da borda impressa. */}
            <div
              ref={posterRef}
              className="flex w-full flex-col items-center gap-4 rounded-2xl bg-white px-8 py-8"
            >
              <p className="text-center font-poppins text-base font-semibold text-[#141414]">{orgName}</p>
              {publicUrl ? (
                <div className="rounded-xl border border-black/10 p-4">
                  <QRCode value={publicUrl} size={200} fgColor="#000000" bgColor="#ffffff" />
                </div>
              ) : null}
              <p className="text-center text-sm font-medium text-[#141414]">Aponte a câmera para ver o cardápio</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleDownload} disabled={!publicUrl || downloading} className="w-full">
              <Download size={16} />
              {downloading ? "Gerando…" : "Baixar imagem para impressão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
