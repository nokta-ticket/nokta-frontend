"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { promoterInvitationApi, type PromoterInvitationPreview } from "@/services/promoters";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

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
              <h1 className="text-lg font-semibold text-gray-900">Convite de promoter — {preview.organizationNome}</h1>
              <p className="mt-1 text-sm text-black/60">
                {preview.organizationNome} quer te vincular como promoter — você poderá gerar links e códigos de divulgação para eventos dessa organização.
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
                  onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/convites-promotor/${token}`)}`)}
                >
                  Entrar
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/register?redirect=${encodeURIComponent(`/convites-promotor/${token}`)}&email=${encodeURIComponent(preview.email)}`,
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
