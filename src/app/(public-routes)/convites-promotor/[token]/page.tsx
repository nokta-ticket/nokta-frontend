"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { promoterInvitationApi, type PromoterInvitationPreview } from "@/services/promoters";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";

export default function ConvitePromoterAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [preview, setPreview] = useState<PromoterInvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await promoterInvitationApi.preview(token);
        if (active) setPreview(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Este convite não é válido ou já expirou."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await promoterInvitationApi.accept(token);
      toast.success("Convite aceito! Você já pode ver seus links e vendas.");
      router.push("/dashboard/promotor");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aceitar o convite."));
    } finally {
      setAccepting(false);
    }
  };

  const here = `/convites-promotor/${token}`;

  return (
    <AuthScreen title="Convite de promoter" subtitle={preview ? `${preview.organizationNome} quer te vincular como promoter.` : undefined}>
      {loading ? (
        <AuthFormFallback rows={3} />
      ) : error || !preview ? (
        <Callout tone="danger" title="Convite indisponível">
          {error}
        </Callout>
      ) : (
        <div className="space-y-5">
          <Callout tone="info" icon="megaphone" title={preview.organizationNome}>
            Você poderá gerar links e códigos de divulgação para eventos dessa organização e acompanhar suas vendas.
          </Callout>
          <p className="text-center text-caption text-muted-foreground">
            Convite enviado para <span className="font-medium text-foreground">{preview.email}</span>
          </p>

          {isAuthenticated ? (
            <Button size="full" leftIcon="check" loading={accepting} onClick={handleAccept}>
              {accepting ? "Aceitando…" : "Aceitar convite"}
            </Button>
          ) : (
            <div className="space-y-2.5">
              <p className="text-center text-caption text-muted-foreground">Entre ou crie uma conta com esse e-mail para aceitar.</p>
              <Button size="full" onClick={() => router.push(`/login?redirect=${encodeURIComponent(here)}`)}>
                Entrar
              </Button>
              <Button size="full" variant="outline" onClick={() => router.push(`/register?redirect=${encodeURIComponent(here)}&email=${encodeURIComponent(preview.email)}`)}>
                Criar conta
              </Button>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-caption text-subtle-foreground">
            <Icon name="shield" size={11} /> Convite pessoal e de uso único.
          </p>
        </div>
      )}
    </AuthScreen>
  );
}
