"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { venueTeamApi, VENUE_ROLE_LABEL, type VenueInvitationPreview, type VenueRoleKey } from "@/services/venue-team";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { AuthFormFallback, AuthScreen } from "@/components/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";

export default function ConviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [preview, setPreview] = useState<VenueInvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await venueTeamApi.previewInvitation(token);
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
      await venueTeamApi.acceptInvitation(token);
      toast.success("Convite aceito! Bem-vindo(a) à equipe.");
      router.push("/dashboard/inicio");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aceitar o convite."));
    } finally {
      setAccepting(false);
    }
  };

  const here = `/convites/${token}`;

  return (
    <AuthScreen title="Convite" subtitle={preview ? `Você foi convidado(a) pra equipe de ${preview.organizationNome}.` : undefined}>
      {loading ? (
        <AuthFormFallback rows={3} />
      ) : error || !preview ? (
        <Callout tone="danger" title="Convite indisponível">
          {error}
        </Callout>
      ) : (
        <div className="space-y-5">
          <dl className="surface-inset divide-y divide-border rounded-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">Organização</dt>
              <dd className="text-right font-semibold text-foreground">{preview.organizationNome}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">Função</dt>
              <dd className="text-right font-semibold text-foreground">{VENUE_ROLE_LABEL[preview.roleKey as VenueRoleKey] ?? preview.roleLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">Enviado para</dt>
              <dd className="truncate text-right font-medium text-foreground">{preview.email}</dd>
            </div>
          </dl>

          {isAuthenticated ? (
            <Button size="full" leftIcon="check" loading={accepting} onClick={handleAccept}>
              {accepting ? "Aceitando…" : "Aceitar convite"}
            </Button>
          ) : (
            <div className="space-y-2.5">
              <Callout tone="info" icon="user-circle">
                Entre ou crie uma conta com o e-mail <strong className="text-foreground">{preview.email}</strong> para aceitar.
              </Callout>
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
