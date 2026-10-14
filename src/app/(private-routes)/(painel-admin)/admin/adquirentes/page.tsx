"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStepUp } from "@/components/session/step-up-modal";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";
import { formatDateTime } from "../_lib/format";

/**
 * Credenciais GLOBAIS da Nokta por adquirente de pagamento em maquininha
 * (Cielo hoje, outras no futuro). Client-ID/Access Token identificam a
 * NOKTA como integradora perante a adquirente — nunca por
 * organização/unidade (isso é o "código do estabelecimento"/EC, cadastrado
 * pelo produtor em Operação › Terminais no dashboard do cliente).
 */
interface AcquirerConfig {
  provider: string;
  clientId?: string;
  configured: boolean;
  updatedAt?: string;
}

const ACQUIRERS: { provider: string; label: string }[] = [{ provider: "CIELO", label: "Cielo" }];

export default function AdquirentesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Adquirentes" description="Credenciais globais da Nokta junto às adquirentes de pagamento em maquininha." />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {ACQUIRERS.map((acquirer) => (
            <AcquirerCard key={acquirer.provider} provider={acquirer.provider} label={acquirer.label} />
          ))}
        </div>
        <Callout tone="info" title="Uma credencial pra todos os terminais" className="self-start">
          Um único Client-ID/Access Token identifica a Nokta como integradora — nunca por organização. O código do estabelecimento (EC) de cada unidade é cadastrado pelo próprio produtor em Operação › Terminais.
        </Callout>
      </div>
    </div>
  );
}

function AcquirerCard({ provider, label }: { provider: string; label: string }) {
  const { openStepUp } = useStepUp();
  const [config, setConfig] = useState<AcquirerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AcquirerConfig>(`/admin/payment-acquirers/${provider}`);
      setConfig(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível carregar a configuração."));
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!clientId.trim() || !accessToken.trim()) {
      toast.error("Preencha Client-ID e Access Token.");
      return;
    }
    setSaving(true);
    try {
      const stepUpToken = await openStepUp({
        action: "PAYMENT_ACQUIRER_CREDENTIALS_UPDATE",
        organizationId: null,
        actionParams: {},
        title: `Atualizar credenciais — ${label}`,
        description: `Estas credenciais são usadas por TODOS os terminais POS de TODOS os clientes para cobrar via ${label}. Trocar um valor errado interrompe pagamentos em produção imediatamente.`,
        preview: [
          { label: "Adquirente", value: label },
          { label: "Client-ID", value: clientId.trim() },
        ],
      });

      await api.patch(`/admin/payment-acquirers/${provider}`, { clientId: clientId.trim(), accessToken: accessToken.trim() }, { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } });
      toast.success("Credenciais salvas");
      setAccessToken("");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "Verificação de segurança cancelada.") {
        toast.error(getErrorMessage(err, "Não foi possível salvar as credenciais."));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading && !config) return <Skeleton className="h-72 rounded-card" />;

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="credit-card" size={15} />
              {label}
            </CardTitle>
            <CardDescription>
              {config?.configured ? (
                <>
                  Client-ID atual: <span className="font-mono text-foreground">{config.clientId}</span>
                  {config.updatedAt ? ` — atualizado em ${formatDateTime(config.updatedAt)}` : ""}
                </>
              ) : (
                "Ainda sem credenciais cadastradas."
              )}
            </CardDescription>
          </div>
          <StatusBadge tone={config?.configured ? "success" : "warning"}>{config?.configured ? "Configurado" : "Não configurado"}</StatusBadge>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Field label="Client-ID" htmlFor={`${provider}-client-id`}>
            <Input id={`${provider}-client-id`} autoComplete="off" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder={config?.configured ? "Preencha pra trocar" : "Client-ID da conta desenvolvedor"} />
          </Field>
          <Field label="Access Token" htmlFor={`${provider}-token`} hint="Nunca é exibido de volta depois de salvo — só um indicador de que está configurado.">
            <Input id={`${provider}-token`} type="password" autoComplete="new-password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder={config?.configured ? "Preencha pra trocar" : "Access Token da conta desenvolvedor"} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={saving} leftIcon="shield">
            Salvar credenciais
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
