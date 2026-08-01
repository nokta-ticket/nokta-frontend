"use client";

import { useState } from "react";
import { Check, Copy, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildMarketingUrl, getApiBaseUrl } from "@/lib/surfaces";
import { toast } from "@/lib/toast";

/**
 * Link público (nokta.live/cardapio/{slug}) + QR code fixo (um só por
 * organização, apontando pro mesmo link) — só aparece quando a organização
 * já tem slug e um cardápio principal publicado.
 */
export function MenuSharePanel({ orgId, orgSlug }: { orgId: number; orgSlug: string }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = buildMarketingUrl(`/cardapio/${orgSlug}`);
  const qrCodeUrl = `${getApiBaseUrl()}/organizations/${orgId}/venue/menu-publico/qrcode`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode-cardapio-${orgSlug}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Card className="rounded-[22px] p-5">
      <h3 className="mb-1 text-base font-semibold text-foreground">Divulgue seu cardápio</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Coloque o link na bio das redes sociais e o QR code nas mesas.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado pelo backend, precisa carregar como <img> autenticada com cookie de sessão */}
      <img src={qrCodeUrl} alt="QR code do cardápio" className="mx-auto mb-4 h-40 w-40 rounded-xl border border-black/5" />

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2">
        <Link2 size={14} className="shrink-0 text-black/40" />
        <span className="min-w-0 flex-1 truncate text-xs text-black/70">{publicUrl}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download size={14} />
          Baixar QR
        </Button>
      </div>
    </Card>
  );
}
