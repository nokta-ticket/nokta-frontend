"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { ImageCropperDialog, extensionForMimeType } from "@/components/media/ImageCropperDialog";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarFotoPerfilPage() {
  const { updateFotoPerfil } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setNome(res.data.nome ?? "");
        setSobrenome(res.data.sobrenome ?? "");
        setFotoPerfil(res.data.fotoPerfil ?? null);
      })
      .catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveCrop = async (blob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("foto", blob, `profile.${extensionForMimeType(blob.type)}`);
      const res = await api.patch("/auth/me/foto", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setFotoPerfil(res.data.fotoPerfil);
      // Sem isto o cabeçalho continuava com a foto antiga até recarregar a página.
      updateFotoPerfil(res.data.fotoPerfil ?? null);
      setImageSrc(null);
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao enviar foto."));
    } finally {
      setUploading(false);
    }
  };

  const fotoSrc = resolveMediaUrl(fotoPerfil, null);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <div className="flex items-start gap-2">
        <Link href="/perfil" aria-label="Voltar ao perfil" className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
          <Icon name="arrow-left" size={16} />
        </Link>
        <div>
          <h1 className="text-display font-medium tracking-tight text-foreground">Foto do perfil</h1>
          <p className="mt-1 text-body text-muted-foreground">Adicione ou troque a foto que aparece na sua conta.</p>
        </div>
      </div>

      <ImageCropperDialog open={Boolean(imageSrc)} onOpenChange={(v) => !v && setImageSrc(null)} imageSrc={imageSrc} aspect={1} cropShape="round" title="Ajustar foto de perfil" saving={uploading} onConfirm={handleSaveCrop} />

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-5 py-7 text-center sm:flex-row sm:text-left">
          {loading ? (
            <Skeleton className="size-28 shrink-0 rounded-full" />
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Escolher nova foto" className="press group relative shrink-0 rounded-full">
              <span className="flex size-28 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-display font-semibold text-foreground ring-2 ring-brand/40">
                {fotoSrc ? <Image src={fotoSrc} alt="" width={112} height={112} className="size-full object-cover" unoptimized /> : initials(nome, sobrenome)}
              </span>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Icon name="camera" size={22} />
              </span>
              <span className="btn-lift absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Icon name="camera" size={14} />
              </span>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">{loading ? <Skeleton className="mx-auto h-5 w-40 sm:mx-0" /> : [nome, sobrenome].filter(Boolean).join(" ")}</h2>
            <p className="mt-1 text-body text-muted-foreground">Uma foto ajuda a equipe do evento a te reconhecer na entrada.</p>
            <Button variant="outline" shape="pill" leftIcon="upload" className="mt-4" disabled={loading || uploading} loading={uploading} onClick={() => fileInputRef.current?.click()}>
              {fotoSrc ? "Trocar foto" : "Escolher foto"}
            </Button>
            <p className="mt-2 text-caption text-subtle-foreground">JPG, PNG ou WebP. Máx. 5MB.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </CardContent>
      </Card>

      <Callout tone="info" icon="shield" title="Seus dados estão seguros" className="mt-4">
        Usamos criptografia e boas práticas pra proteger suas informações. Sua foto só aparece pra você e pra equipe do evento.
      </Callout>
    </div>
  );
}
