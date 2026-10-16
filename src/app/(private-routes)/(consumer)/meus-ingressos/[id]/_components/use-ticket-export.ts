"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "@/lib/toast";

/**
 * Exportar o ingresso (nó escondido `TicketExportCard`) como PNG, PDF ou
 * compartilhar a imagem (Web Share API, com fallback pra download). O nó
 * fica com opacidade 0 fora da tela; a captura aplica opacidade 1 só na cópia
 * que o html-to-image desenha, sem mostrar nada na tela.
 *
 * Compartilhar: o navegador só aceita `navigator.share` logo depois do toque.
 * Gerar a imagem na hora (import + desenho) passava desse limite e o share era
 * recusado (NotAllowedError). Por isso a imagem é gerada antes, em segundo plano,
 * e o toque só chama o share. O arquivo sai direto como Blob (`toBlob`): converter
 * o data URL com `fetch` é barrado pela CSP (`connect-src` não libera `data:`).
 */
// A cópia desenhada fica visível; o nó real continua escondido na tela.
const CAPTURE_OPTIONS = { pixelRatio: 2, cacheBust: true, skipFonts: true, style: { opacity: "1", zIndex: "auto" } };

export function useTicketExport(ref: RefObject<HTMLDivElement | null>, baseName: string, shareTitle: string) {
  const [exporting, setExporting] = useState(false);

  const capture = useCallback(async () => {
    const el = ref.current;
    if (!el) throw new Error("export node missing");
    const { toPng } = await import("html-to-image");
    return await toPng(el, CAPTURE_OPTIONS);
  }, [ref]);

  const captureBlob = useCallback(async () => {
    const el = ref.current;
    if (!el) throw new Error("export node missing");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(el, CAPTURE_OPTIONS);
    if (!blob) throw new Error("export blob empty");
    return blob;
  }, [ref]);

  // Arquivo pronto para o share, refeito quando o ingresso (nome do arquivo) muda.
  const sharedFile = useRef<{ name: string; file: File } | null>(null);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.canShare) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const blob = await captureBlob();
        if (!cancelled) sharedFile.current = { name: baseName, file: new File([blob], `${baseName}.png`, { type: "image/png" }) };
      } catch {
        // Sem arquivo pronto, o toque gera na hora.
      }
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [captureBlob, baseName]);

  const run = useCallback(
    async (fn: (dataUrl: string) => Promise<void>, failMessage: string) => {
      setExporting(true);
      try {
        const dataUrl = await capture();
        await fn(dataUrl);
      } catch (err) {
        // Cancelar o share nativo não é erro.
        if (err instanceof DOMException && err.name === "AbortError") return;
        toast.error(failMessage);
      } finally {
        setExporting(false);
      }
    },
    [capture],
  );

  const download = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const exportPng = useCallback(
    () =>
      run(async (dataUrl) => {
        // Abre numa aba nova — evita a interceptação de download de alguns
        // navegadores embutidos; a pessoa salva com "Salvar imagem como…".
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`<html><head><title>${baseName}.png</title></head><body style="margin:0;background:#0f0f11;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${dataUrl}" style="max-width:100%;border-radius:16px" alt="Ingresso" /></body></html>`);
          newTab.document.close();
        } else {
          download(dataUrl, `${baseName}.png`);
        }
      }, "Erro ao exportar. Tente novamente."),
    [run, baseName],
  );

  const exportPdf = useCallback(
    () =>
      run(async (dataUrl) => {
        const { jsPDF } = await import("jspdf");
        const img = new window.Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("image load failed"));
        });
        const w = img.naturalWidth / 2;
        const h = img.naturalHeight / 2;
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [w, h] });
        pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
        pdf.save(`${baseName}.pdf`);
      }, "Erro ao gerar o PDF. Tente novamente."),
    [run, baseName],
  );

  const share = useCallback(async () => {
    const ready = sharedFile.current?.name === baseName ? sharedFile.current.file : null;
    if (ready && navigator.canShare?.({ files: [ready] })) {
      try {
        await navigator.share({ files: [ready], title: shareTitle });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Recusado mesmo assim: cai para baixar a imagem.
      }
    }
    setExporting(true);
    try {
      const blob = await captureBlob();
      // URL de Blob (não data:): o "Ver" do Safari não abre data URL.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${baseName}.png`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Erro ao compartilhar. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }, [captureBlob, baseName, shareTitle]);

  return { exporting, exportPng, exportPdf, share };
}
