"use client";

import { useEffect, useState } from "react";
import { enablePush, getPushPreferences, pushPermission, pushSupport, setPushMarketing, type PushPreferences } from "@/lib/push";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchRow } from "@/components/ui/switch-row";

/** Perfil → Notificações: ativar neste aparelho e escolher se recebe divulgação dos produtores. */
export function PushSettingsCard() {
  const [prefs, setPrefs] = useState<PushPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [support, setSupport] = useState<ReturnType<typeof pushSupport>>("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupport(pushSupport());
    setPermission(pushPermission());
    getPushPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  if (!prefs?.available) return null;

  const activate = async () => {
    setBusy(true);
    try {
      const result = await enablePush({ ask: true });
      setPermission(pushPermission());
      if (result === "enabled") toast.success("Notificações ativadas neste celular.");
      else if (result === "denied") toast.info("Notificações bloqueadas. Libere nas configurações do celular.");
    } catch {
      toast.error("Não deu para ativar as notificações agora.");
    } finally {
      setBusy(false);
    }
  };

  const toggleMarketing = async (marketing: boolean) => {
    setPrefs({ ...prefs, marketing });
    try {
      await setPushMarketing(marketing);
    } catch {
      setPrefs({ ...prefs, marketing: !marketing });
      toast.error("Não deu para salvar. Tente de novo.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Avisos do seu ingresso (QR liberado, lembrete do dia, transferência) chegam sempre que as notificações estão ativas.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {permission === "granted" ? (
          <p className="text-caption text-muted-foreground">Ativas neste celular.</p>
        ) : permission === "denied" ? (
          <p className="text-caption text-muted-foreground">Bloqueadas neste celular. Para liberar, abra as configurações do celular, toque em Apps, Nokta Tickets e Notificações.</p>
        ) : support === "ios-needs-install" ? (
          <p className="text-caption text-muted-foreground">No iPhone, adicione o site à tela de início (Compartilhar, Adicionar à Tela de Início) para receber notificações.</p>
        ) : support === "supported" ? (
          <Button size="full" leftIcon="bell" loading={busy} onClick={activate}>
            Ativar notificações neste celular
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">Este navegador não recebe notificações.</p>
        )}
        <SwitchRow label="Novidades dos produtores" description="Eventos novos e listas de quem você já comprou. No máximo 1 por dia." checked={prefs.marketing} onCheckedChange={toggleMarketing} />
      </CardContent>
    </Card>
  );
}
