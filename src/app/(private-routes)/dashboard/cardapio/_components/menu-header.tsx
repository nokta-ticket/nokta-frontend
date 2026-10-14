"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { extensionForMimeType, ImageCropperDialog } from "@/components/media/ImageCropperDialog";
import { resolveMediaUrl } from "@/lib/media";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { VenueMenu } from "@/services/venue-menu";
import { useVenueMenuMutations } from "../_hooks/use-venue-menus";
import { useUpdateVenuePublicProfile, useVenuePublicProfile } from "../_hooks/use-venue-public-profile";
import { useImageUpload } from "../_hooks/use-image-upload";
import { MenuStatusBadge } from "./venue-status-badge";
import { MenuShareDialog } from "./menu-share-dialog";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Upload + recorte de uma imagem do perfil público (logo ou banner).
 * Reajustar sempre parte da imagem ORIGINAL (sem crop) salva em
 * `*OriginalUrl` — nunca do resultado já recortado (evita degradar a cada
 * reajuste). Ao escolher um arquivo novo, ele sobe como original antes de
 * abrir o cropper.
 */
function useProfileImage(orgId: number, kind: "logo" | "banner") {
  const { data: profile } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);
  const { upload, uploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pendingOriginalUrl, setPendingOriginalUrl] = useState<string | null>(null);

  const url = (kind === "logo" ? profile?.logoUrl : profile?.bannerUrl) ?? null;
  const originalUrl = (kind === "logo" ? profile?.logoOriginalUrl : profile?.bannerOriginalUrl) ?? null;
  const resolvedUrl = url ? (resolveMediaUrl(url) ?? url) : null;
  // Fallback: imagens salvas antes do campo original existir reajustam a partir do recorte já salvo.
  const resolvedOriginalUrl = originalUrl ? (resolveMediaUrl(originalUrl) ?? originalUrl) : resolvedUrl;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const uploaded = await upload(file);
    if (!uploaded) return;
    setPendingOriginalUrl(uploaded);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleConfirmCrop = async (blob: Blob) => {
    // blob.type já vem certo do cropper (PNG/WEBP com transparência, JPEG
    // caso contrário) — nunca forçar .jpg, senão fundo transparente vira preto.
    const file = new File([blob], `${kind}.${extensionForMimeType(blob.type)}`, { type: blob.type });
    const cropped = await upload(file);
    if (!cropped) return;
    const original = pendingOriginalUrl ?? originalUrl ?? undefined;
    const payload = kind === "logo" ? { logoUrl: cropped, ...(original ? { logoOriginalUrl: original } : {}) } : { bannerUrl: cropped, ...(original ? { bannerOriginalUrl: original } : {}) };
    update.mutate(payload, {
      onSuccess: () => toast.success(kind === "logo" ? "Logo atualizada" : "Banner atualizado"),
      onError: (err) => toast.error(getErrorMessage(err, kind === "logo" ? "Não foi possível salvar a logo." : "Não foi possível salvar o banner.")),
    });
    setImageSrc(null);
    setPendingOriginalUrl(null);
  };

  const adjust = () => {
    setPendingOriginalUrl(null);
    if (resolvedOriginalUrl) setImageSrc(resolvedOriginalUrl);
  };

  const cancel = () => {
    setPendingOriginalUrl(null);
    setImageSrc(null);
  };

  return { resolvedUrl, uploading, inputRef, imageSrc, handleFile, handleConfirmCrop, adjust, cancel, pick: () => inputRef.current?.click() };
}

function OverlayButton({ icon, label, onClick, disabled, className }: { icon: "upload" | "expand" | "camera"; label: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn("flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-thumb backdrop-blur-sm transition-colors hover:bg-surface disabled:opacity-60", className)}>
      <Icon name={icon} size={14} />
    </button>
  );
}

function MenuFormDialog({ orgId, menu, open, onOpenChange }: { orgId: number; menu: VenueMenu; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { update } = useVenueMenuMutations(orgId);
  const [nome, setNome] = useState(menu.nome);
  const [descricao, setDescricao] = useState(menu.descricao ?? "");

  useEffect(() => {
    if (open) {
      setNome(menu.nome);
      setDescricao(menu.descricao ?? "");
    }
  }, [open, menu.id, menu.nome, menu.descricao]);

  const save = () => {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error("Informe o nome do cardápio.");
      return;
    }
    update.mutate(
      { menuId: menu.id, payload: { nome: trimmed, descricao: descricao.trim() } },
      {
        onSuccess: () => {
          toast.success("Cardápio salvo");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar o cardápio.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Editar cardápio</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="menu-nome" required>
            <Input id="menu-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cardápio principal" />
          </Field>
          <Field label="Descrição" htmlFor="menu-descricao" optional hint="Aparece embaixo do nome no cardápio público.">
            <Textarea id="menu-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactFields({ orgId }: { orgId: number }) {
  const { data: profile } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (!profile) return;
    setAddress(profile.address ?? "");
    setInstagramUrl(profile.instagramUrl ?? "");
    setWhatsappNumber(profile.whatsappNumber ?? "");
  }, [profile]);

  const saveField = (field: "address" | "instagramUrl" | "whatsappNumber", value: string) => {
    const trimmed = value.trim();
    if (trimmed === (profile?.[field] ?? "")) return;
    update.mutate(
      { [field]: trimmed || undefined },
      {
        onSuccess: () => toast.success("Salvo"),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar. Confira o dado e tente de novo.")),
      },
    );
  };

  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.currentTarget.blur();

  return (
    <FieldGroup columns={3}>
      <Field label="Instagram" htmlFor="perfil-instagram">
        <Input id="perfil-instagram" leftIcon="instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} onBlur={() => saveField("instagramUrl", instagramUrl)} onKeyDown={blurOnEnter} placeholder="instagram.com/seu-bar" />
      </Field>
      <Field label="WhatsApp" htmlFor="perfil-whatsapp">
        <Input id="perfil-whatsapp" leftIcon="whatsapp" inputMode="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} onBlur={() => saveField("whatsappNumber", whatsappNumber)} onKeyDown={blurOnEnter} placeholder="+55 11 91234-5678" />
      </Field>
      <Field label="Endereço" htmlFor="perfil-endereco">
        <Input id="perfil-endereco" leftIcon="map-pin" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => saveField("address", address)} onKeyDown={blurOnEnter} placeholder="Rua, número, bairro" />
      </Field>
    </FieldGroup>
  );
}

/**
 * Cabeçalho do cardápio selecionado: banner 430×190 (mesma proporção do
 * recorte — nunca estica/corta além do que o usuário ajustou), logo
 * sobreposta, nome + status, ações (publicar/compartilhar/QR) e perfil
 * público (Instagram, WhatsApp, endereço — salvam no blur).
 */
export function MenuHeader({
  orgId,
  orgName,
  orgSlug,
  menu,
  menus,
  onSelectMenu,
  canPublish,
  publishing,
  onPublish,
  onManageMenus,
}: {
  orgId: number;
  orgName: string;
  orgSlug: string | null;
  menu: VenueMenu | null;
  menus: VenueMenu[];
  onSelectMenu: (menuId: number) => void;
  canPublish: boolean;
  publishing: boolean;
  onPublish: () => void;
  onManageMenus: () => void;
}) {
  const logo = useProfileImage(orgId, "logo");
  const banner = useProfileImage(orgId, "banner");
  const [editOpen, setEditOpen] = useState(false);
  const [share, setShare] = useState<null | "link" | "qr">(null);

  if (!menu) return null;

  return (
    <Card accent className="overflow-hidden">
      {/* Banner (capa) — proporção travada em 430/190, igual ao aspect do crop. */}
      <div className="relative w-full overflow-hidden bg-surface-2" style={{ aspectRatio: "430 / 190", maxHeight: 260 }}>
        {banner.resolvedUrl ? <Image src={banner.resolvedUrl} alt="" fill sizes="(min-width: 1280px) 760px, 100vw" className="object-cover" unoptimized /> : <div className="absolute inset-0 bg-callout-info" aria-hidden />}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 poster-fade opacity-70" aria-hidden />
        <input ref={banner.inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => banner.handleFile(e.target.files?.[0])} />
        <div className="absolute right-3 top-3 flex gap-2">
          {banner.resolvedUrl ? <OverlayButton icon="expand" label="Ajustar zoom e posição do banner" onClick={banner.adjust} disabled={banner.uploading} /> : null}
          <OverlayButton icon="upload" label={banner.resolvedUrl ? "Trocar banner" : "Enviar banner (430×190)"} onClick={banner.pick} disabled={banner.uploading} />
        </div>
        {!banner.resolvedUrl ? <p className="absolute bottom-3 left-4 text-caption text-muted-foreground">Capa do cardápio · 430×190px</p> : null}
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Logo sobreposta ao banner */}
          <div className="relative -mt-10 size-20 shrink-0 sm:-mt-12 sm:size-24">
            <div className={cn("relative size-full overflow-hidden rounded-full ring-4 ring-surface shadow-card", !logo.resolvedUrl && "bg-foreground text-background")}>
              {logo.resolvedUrl ? (
                // Sem fundo forçado atrás — logo com transparência mostra a superfície por trás, nunca um preto artificial.
                <Image src={logo.resolvedUrl} alt={orgName} fill sizes="96px" className="object-cover" unoptimized />
              ) : (
                <span className="flex size-full items-center justify-center text-lg font-semibold tracking-[0.12em]">{initials(orgName)}</span>
              )}
            </div>
            <input ref={logo.inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => logo.handleFile(e.target.files?.[0])} />
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              {logo.resolvedUrl ? <OverlayButton icon="expand" label="Ajustar logo" onClick={logo.adjust} disabled={logo.uploading} className="size-8" /> : null}
              <OverlayButton icon="camera" label={logo.resolvedUrl ? "Trocar logo" : "Enviar logo (512×512)"} onClick={logo.pick} disabled={logo.uploading} className="size-8" />
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-title font-semibold tracking-tight text-foreground">{menu.nome}</h2>
              <MenuStatusBadge status={menu.status} />
              {menu.isMain ? <span className="inline-flex items-center gap-1 text-caption font-medium text-brand"><Icon name="star" size={11} /> Principal</span> : null}
              <Button variant="subtle" size="icon-sm" aria-label="Editar nome e descrição" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={13} />
              </Button>
            </div>
            <p className="mt-1 line-clamp-2 text-body text-muted-foreground">{menu.descricao || "Sem descrição — conte em uma frase o que o cliente encontra aqui."}</p>
          </div>

          {menus.length > 1 ? (
            <div className="w-full sm:w-56">
              <NativeSelect aria-label="Cardápio" value={String(menu.id)} onChange={(e) => onSelectMenu(Number(e.target.value))}>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canPublish ? (
            <Button leftIcon="bolt" loading={publishing} onClick={onPublish}>
              Publicar
            </Button>
          ) : null}
          <Button variant={canPublish ? "outline" : "primary"} leftIcon="share" onClick={() => setShare("link")}>
            Compartilhar
          </Button>
          <Button variant="outline" leftIcon="qr" onClick={() => setShare("qr")}>
            QR code
          </Button>
          <Button variant="ghost" leftIcon="layers" onClick={onManageMenus} className="sm:ml-auto">
            Cardápios
          </Button>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <ContactFields orgId={orgId} />
        </div>
      </div>

      <ImageCropperDialog open={Boolean(logo.imageSrc)} onOpenChange={(v) => !v && logo.cancel()} imageSrc={logo.imageSrc} aspect={1} cropShape="round" title="Ajustar logo" saving={logo.uploading} onConfirm={logo.handleConfirmCrop} />
      <ImageCropperDialog open={Boolean(banner.imageSrc)} onOpenChange={(v) => !v && banner.cancel()} imageSrc={banner.imageSrc} aspect={430 / 190} cropShape="rect" title="Ajustar banner" saving={banner.uploading} onConfirm={banner.handleConfirmCrop} />
      <MenuFormDialog orgId={orgId} menu={menu} open={editOpen} onOpenChange={setEditOpen} />
      <MenuShareDialog orgId={orgId} orgName={orgName} orgSlug={orgSlug} menu={menu} open={share !== null} onOpenChange={(v) => !v && setShare(null)} initialView={share ?? "link"} />
    </Card>
  );
}
