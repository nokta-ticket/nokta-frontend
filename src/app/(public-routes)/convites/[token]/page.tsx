"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { venueTeamApi, VENUE_ROLE_LABEL, type VenueInvitationPreview, type VenueRoleKey } from "@/services/venue-team";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

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
      router.push("/dashboard/venue/inicio");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aceitar o convite."));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#151619] p-4">
      <Card className="w-full max-w-md space-y-4 p-6">
        {loading ? (
          <p className="text-center text-sm text-black/50">Carregando convite…</p>
        ) : error || !preview ? (
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-semibold text-gray-900">Convite indisponível</h1>
            <p className="text-sm text-black/50">{error}</p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Convite para {preview.organizationNome}</h1>
              <p className="mt-1 text-sm text-black/60">
                Você foi convidado(a) como <strong>{VENUE_ROLE_LABEL[preview.roleKey as VenueRoleKey] ?? preview.roleLabel}</strong>
              </p>
              <p className="mt-1 text-xs text-black/40">Convite enviado para {preview.email}</p>
            </div>

            {isAuthenticated ? (
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? "Aceitando…" : "Aceitar convite"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-black/50">Entre ou crie uma conta com o e-mail {preview.email} para aceitar.</p>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/convites/${token}`)}`)}
                >
                  Entrar
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/register?redirect=${encodeURIComponent(`/convites/${token}`)}&email=${encodeURIComponent(preview.email)}`,
                    )
                  }
                >
                  Criar conta
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
