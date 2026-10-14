"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";
import { Callout } from "@/components/ui/callout";
import { buildMarketingUrl } from "@/lib/surfaces";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenueMenu } from "@/services/venue-menu";
import { useUpdateOrganizationSlug } from "../_hooks/use-organization-slug";

const MARKETING_HOST = buildMarketingUrl("").replace(/^https?:\/\//, "");

/**
 * Compartilhar: link público (nokta.live/cardapio/{slug}), edição do slug da
 * organização, cópia e QR code pra imprimir. O link/QR são sempre do
 * cardápio PRINCIPAL — publicar um secundário não gera link próprio.
 * O cartaz do QR é exportado via html-to-image (mesmo padrão de
 * meus-ingressos/[id]) pra sair com nome e instrução, nunca o QR pelado.
 */
export function MenuShareDialog({
  orgId,
  orgName,
  orgSlug,
  menu,
  open,
  onOpenChange,
  initialView = "link",
}: {
  orgId: number;
  orgName: string;
  orgSlug: string | null;
  menu: VenueMenu | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialView?: "link" | "qr";
}) {
  const updateSlug = useUpdateOrganizationSlug(orgId);
  // displaySlug nunca cai de volta pro orgSlug antigo (prop) enquanto a
  // mutation está em voo — sem isso o valor "pisca" até /me/organizations voltar.
  const [displaySlug, setDisplaySlug] = useState(orgSlug);
  const [slugValue, setSlugValue] = useState(orgSlug ?? "");
  const [editingSlug, setEditingSlug] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlugValue(orgSlug ?? "");
    setDisplaySlug(orgSlug);
  }, [orgSlug]);

  useEffect(() => {
    if (open && initialView === "qr") setTimeout(() => qrRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, [open, initialView]);

  const publicUrl = displaySlug ? buildMarketingUrl(`/cardapio/${displaySlug}`) : null;
  const isMain = Boolean(menu?.isMain);
  const archived = menu?.status === "ARCHIVED";
  const canOpenPublic = Boolean(publicUrl) && isMain && !archived;

  const saveSlug = () => {
    setEditingSlug(false);
    const trimmed = slugValue.trim();
    if (!trimmed || trimmed === displaySlug) {
      setSlugValue(displaySlug ?? "");
      return;
    }
    setDisplaySlug(trimmed);
    updateSlug.mutate(trimmed, {
      onError: (err) => {
        setSlugValue(orgSlug ?? "");
        setDisplaySlug(orgSlug);
        toast.error(getErrorMessage(err, "Não foi possível alterar o link. Tente outro."));
      },
      onSuccess: () => toast.success("Link público atualizado"),
    });
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copiado");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current || !publicUrl) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      const link = document.createElement("a");
      link.download = `qr-code-cardapio-${(displaySlug ?? orgName).toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Compartilhar cardápio</DialogTitle>
          <DialogDescription>Coloque o link na bio das redes e o QR code nas mesas.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {!isMain ? (
            <Callout tone="info">O link e o QR code são sempre do cardápio principal — selecione-o pra compartilhar.</Callout>
          ) : archived ? (
            <Callout tone="warning">Este cardápio está arquivado e não tem link público ativo.</Callout>
          ) : null}

          <Field label="Endereço público" hint="Só letras, números e hífen. Mudar o link quebra QR codes já impressos.">
            <div className="flex items-stretch gap-2">
              <div className={cn(inputClassName, "h-auto min-h-11 flex-1 items-center gap-0 overflow-hidden p-0 md:min-h-10")}>
                <span className="flex h-full shrink-0 items-center whitespace-nowrap border-r border-border bg-surface-3/60 px-3 text-caption text-muted-foreground">
                  <span className="hidden sm:inline">{MARKETING_HOST}</span>
                  <span className="sm:hidden">…</span>/cardapio/
                </span>
                {editingSlug ? (
                  <input
                    autoFocus
                    value={slugValue}
                    onChange={(e) => setSlugValue(e.target.value)}
                    onBlur={saveSlug}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setSlugValue(displaySlug ?? "");
                        setEditingSlug(false);
                      }
                    }}
                    placeholder="nome-do-seu-negocio"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
                  />
                ) : (
                  <button type="button" onClick={() => setEditingSlug(true)} className="h-full min-w-0 flex-1 truncate px-3 text-left text-sm text-foreground">
                    {displaySlug ?? <span className="text-subtle-foreground">definir link…</span>}
                  </button>
                )}
              </div>
              <Button variant="outline" size="icon" aria-label="Editar endereço" onClick={() => setEditingSlug(true)} disabled={updateSlug.isPending}>
                <Icon name="edit" size={14} />
              </Button>
            </div>
          </Field>

          <div className="surface-inset flex items-center gap-2 rounded-xl px-3.5 py-3">
            <Icon name="link" size={13} className="shrink-0 text-subtle-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{publicUrl ?? "Defina o endereço acima pra gerar o link"}</span>
            <Button variant="subtle" size="icon-sm" aria-label="Copiar link" disabled={!publicUrl} onClick={() => publicUrl && copy(publicUrl)}>
              <Icon name="copy" size={14} />
            </Button>
            {canOpenPublic && publicUrl ? (
              <Button variant="subtle" size="icon-sm" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir cardápio público">
                  <Icon name="external" size={14} />
                </a>
              </Button>
            ) : null}
          </div>

          <section ref={qrRef} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">QR code pra imprimir</h4>
            {publicUrl ? (
              <div className="flex justify-center">
                {/* Cartaz exportado — fundo branco sólido e margem generosa em
                    volta do QR (zona de silêncio), senão leitores falham perto
                    da borda impressa. Cores fixas de propósito: é impressão. */}
                <div ref={posterRef} className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl px-8 py-8" style={{ background: "#ffffff", color: "#141414" }}>
                  <p className="text-center text-base font-semibold">{orgName}</p>
                  <div className="rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                    <QRCode value={publicUrl} size={180} fgColor="#000000" bgColor="#ffffff" />
                  </div>
                  <p className="text-center text-sm font-medium">Aponte a câmera para ver o cardápio</p>
                </div>
              </div>
            ) : (
              <p className="text-body text-muted-foreground">O QR aparece assim que o endereço público estiver definido.</p>
            )}
          </section>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" leftIcon="copy" disabled={!publicUrl} onClick={() => publicUrl && copy(publicUrl)}>
            Copiar link
          </Button>
          <Button leftIcon="download" disabled={!publicUrl} loading={downloading} onClick={handleDownload}>
            Baixar QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
