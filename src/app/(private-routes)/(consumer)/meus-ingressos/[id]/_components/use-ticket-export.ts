"use client";

import { useCallback, useState, type RefObject } from "react";
import { toast } from "@/lib/toast";

/**
 * Exportar o ingresso (nó escondido `TicketExportCard`) como PNG, PDF ou
 * compartilhar a imagem (Web Share API, com fallback pra download). O nó
 * fica com opacidade 0 fora da tela; a captura revela e esconde de novo.
 */
export function useTicketExport(ref: RefObject<HTMLDivElement | null>, baseName: string, shareTitle: string) {
  const [exporting, setExporting] = useState(false);

  const capture = useCallback(async () => {
    const el = ref.current;
    if (!el) throw new Error("export node missing");
    const prev = { opacity: el.style.opacity, pointerEvents: el.style.pointerEvents, zIndex: el.style.zIndex };
    el.style.opacity = "1";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    try {
      const { toPng } = await import("html-to-image");
      return await toPng(el, { pixelRatio: 2, cacheBust: true, skipFonts: true });
    } finally {
      el.style.opacity = prev.opacity;
      el.style.pointerEvents = prev.pointerEvents;
      el.style.zIndex = prev.zIndex;
    }
  }, [ref]);

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

  const share = useCallback(
    () =>
      run(async (dataUrl) => {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${baseName}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: shareTitle });
        } else {
          download(dataUrl, file.name);
        }
      }, "Erro ao salvar. Tente novamente."),
    [run, baseName, shareTitle],
  );

  return { exporting, exportPng, exportPdf, share };
}
