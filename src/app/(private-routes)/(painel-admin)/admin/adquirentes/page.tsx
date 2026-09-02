"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStepUp } from "@/components/session/step-up-modal";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Adquirentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credenciais globais da Nokta junto às adquirentes de pagamento em maquininha. Um único Client-ID/Access
          Token identifica a Nokta como integradora — nunca por organização. O código do estabelecimento (EC) de
          cada unidade é cadastrado pelo próprio produtor em Operação › Terminais.
        </p>
      </div>

      {ACQUIRERS.map((acquirer) => (
        <AcquirerCard key={acquirer.provider} provider={acquirer.provider} label={acquirer.label} />
      ))}
    </div>
  );
}

function AcquirerCard({ provider, label }: { provider: string; label: string }) {
  const { openStepUp } = useStepUp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AcquirerConfig | null>(null);

  const [clientId, setClientId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<AcquirerConfig>(`/admin/payment-acquirers/${provider}`);
      setConfig(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao carregar configuração."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!clientId.trim() || !accessToken.trim()) {
      toast.error("Preencha Client-ID e Access Token.");
      return;
    }
    setSaving(true);
    try {
      const stepUpToken = await openStepUp({
        action: "PAYMENT_ACQUIRER_CREDENTIALS_UPDATE" as const,
        organizationId: null,
        actionParams: {},
        title: `Atualizar credenciais — ${label}`,
        description:
          "Estas credenciais são usadas por TODOS os terminais POS de TODOS os clientes para cobrar via " +
          label +
          ". Trocar um valor errado interrompe pagamentos em produção imediatamente.",
        preview: [
          { label: "Adquirente", value: label },
          { label: "Client-ID", value: clientId.trim() },
        ],
      });

      await api.patch(
        `/admin/payment-acquirers/${provider}`,
        { clientId: clientId.trim(), accessToken: accessToken.trim() },
        { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } },
      );
      toast.success("Credenciais atualizadas com sucesso!");
      setAccessToken("");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "Verificação de segurança cancelada.") {
        toast.error(getErrorMessage(err, "Erro ao salvar credenciais."));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-white p-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-medium">{label}</h2>
        </div>
        {config?.configured ? (
          <span className="text-xs font-medium text-emerald-600">Configurado</span>
        ) : (
          <span className="text-xs font-medium text-amber-600">Não configurado</span>
        )}
      </div>

      {config?.configured && (
        <p className="text-xs text-muted-foreground">
          Client-ID atual: <span className="font-mono">{config.clientId}</span>
          {config.updatedAt && ` — atualizado em ${new Date(config.updatedAt).toLocaleString("pt-BR")}`}
        </p>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Client-ID</Label>
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={config?.configured ? "Preencha para trocar" : "Client-ID da conta desenvolvedor"}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Access Token</Label>
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder={config?.configured ? "Preencha para trocar" : "Access Token da conta desenvolvedor"}
          />
          <p className="text-xs text-muted-foreground">
            Nunca exibido de volta depois de salvo — só um indicador de que está configurado.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar credenciais
        </Button>
      </div>
    </div>
  );
}
