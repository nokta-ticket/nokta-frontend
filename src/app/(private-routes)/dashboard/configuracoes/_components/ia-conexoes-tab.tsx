"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, KeyRound, Loader2, MessageSquare, Plus, ShieldCheck, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { getErrorMessage } from "@/lib/axios";
import { getApiBaseUrl } from "@/lib/surfaces";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { assistantApi, mcpApi, type McpCapability, type McpToken, type McpTokenCreated, type McpTokenScope } from "@/services/assistant";
import { ASSISTANT_STATUS_KEY } from "../../_components/assistant/assistant-context";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";

/**
 * Configurações → IA e conexões. O workspace gera um token e o cola no
 * Claude/ChatGPT como conector: a conversa acontece lá, e permitir, pedir
 * confirmação ou bloquear cada ferramenta também é configurado lá. A Nokta
 * só decide o escopo (leitura ou leitura e configuração) e aplica as
 * permissões de quem gerou o token.
 */

const EXAMPLES = ["Quanto faturei nos últimos 7 dias?", "O que está acabando no estoque?", "Crie um cupom de 20% para o evento de sábado"];

const SCOPES: { value: McpTokenScope; title: string; description: string }[] = [
  { value: "READ", title: "Somente leitura", description: "Consulta vendas, reservas, estoque, cardápio, eventos e financeiro. Não altera nada." },
  {
    value: "READ_WRITE",
    title: "Leitura e configuração",
    description: "Além de consultar, cria reservas, lança pedidos, cadastra produtos, eventos e cupons, entre outras ações.",
  },
];

type ClientKey = "claude" | "desktop" | "code" | "chatgpt";
const CLIENTS: { key: ClientKey; label: string }[] = [
  { key: "claude", label: "claude.ai" },
  { key: "desktop", label: "Claude Desktop" },
  { key: "code", label: "Claude Code" },
  { key: "chatgpt", label: "ChatGPT" },
];

const TOKENS_KEY = (orgId: number) => ["assistant", "mcp-tokens", orgId] as const;

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca usado";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "último uso: agora";
  if (minutes < 60) return `último uso: há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `último uso: há ${hours} h`;
  const days = Math.round(hours / 24);
  return `último uso: há ${days} ${days === 1 ? "dia" : "dias"}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Não foi possível copiar. Selecione e copie manualmente.");
        }
      }}
      className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2.5 text-base">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-700">
        {n}
      </span>
      {children}
    </CardTitle>
  );
}

export function IaConexoesTab({ orgId }: { orgId: number }) {
  const queryClient = useQueryClient();
  const tokensQuery = useQuery({ queryKey: TOKENS_KEY(orgId), queryFn: () => mcpApi.list(orgId), retry: false });
  const [scope, setScope] = useState<McpTokenScope>("READ");
  const [name, setName] = useState("");
  const [created, setCreated] = useState<McpTokenCreated | null>(null);
  const [client, setClient] = useState<ClientKey>("claude");

  const createMutation = useMutation({
    mutationFn: () => mcpApi.create(orgId, name.trim(), scope),
    onSuccess: (data) => {
      setCreated(data);
      setName("");
      queryClient.invalidateQueries({ queryKey: TOKENS_KEY(orgId) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (tokenId: number) => mcpApi.remove(orgId, tokenId),
    onSuccess: (_data, tokenId) => {
      if (created?.id === tokenId) setCreated(null);
      queryClient.invalidateQueries({ queryKey: TOKENS_KEY(orgId) });
      toast.success("Token excluído. A IA conectada com ele perdeu o acesso.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (tokensQuery.isLoading) return <BlockSkeleton className="h-96" />;

  if (tokensQuery.isError) {
    const forbidden = isAxiosError(tokensQuery.error) && tokensQuery.error.response?.status === 403;
    return (
      <EmptyState
        title={forbidden ? "Somente o proprietário ou um gerente configura a IA" : "Não foi possível carregar as conexões de IA"}
        description={
          forbidden
            ? "As conexões de IA são do workspace. Peça ao administrador para gerar um acesso para você."
            : getErrorMessage(tokensQuery.error)
        }
      />
    );
  }

  const tokens = tokensQuery.data?.tokens ?? [];
  const capabilities = tokensQuery.data?.capabilities ?? [];
  // O token vai no cabeçalho Authorization, nunca na URL: URL com segredo fica em log e histórico.
  const url = `${getApiBaseUrl()}/mcp`;
  const token = created?.token ?? "SEU_TOKEN_AQUI";
  const canCreate = name.trim().length >= 2 && !createMutation.isPending;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-violet-600" />
            Converse com a sua IA sobre a Nokta
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Conecte o Claude ou o ChatGPT e pergunte em linguagem natural: quanto vendeu na semana, o que está acabando no estoque, quem reservou para hoje. Se você
            permitir, a IA também cria reservas, lança pedidos, cadastra produtos, eventos e cupons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {EXAMPLES.map((example) => (
              <div key={example} className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-foreground/80">
                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />“{example}”
              </div>
            ))}
          </div>
          <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-emerald-950">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            <p>
              O acesso fica restrito a este workspace e às permissões, na Nokta, de quem gerou o token: você escolhe <strong>somente leitura</strong> ou{" "}
              <strong>leitura e configuração</strong>. Em nenhum caso a IA faz saques — essa ação nunca é oferecida a ela.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={1}>Gere um token de acesso</StepTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div role="radiogroup" aria-label="Escopo do token" className="grid gap-3 sm:grid-cols-2">
            {SCOPES.map((option) => {
              const selected = scope === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setScope(option.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    selected ? "border-violet-500 bg-violet-50/60 ring-1 ring-violet-500" : "hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-violet-600" : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <span className="size-2 rounded-full bg-violet-600" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <form
            className="space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (canCreate) createMutation.mutate();
            }}
          >
            <Label htmlFor="mcp-token-name">Nome do token</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="mcp-token-name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Meu notebook, Claude do sócio"
                className="text-base sm:text-sm"
              />
              <Button type="submit" disabled={!canCreate} className="shrink-0">
                {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Gerar token
              </Button>
            </div>
          </form>

          {created && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
              <p className="text-sm font-medium text-amber-950">Token “{created.name}” gerado. Copie agora — por segurança ele não aparece de novo.</p>
              <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-1.5">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{created.token}</code>
                <CopyButton value={created.token} label="Copiar token" />
              </div>
              <p className="text-xs text-amber-900/80">O passo 2 já mostra o cabeçalho preenchido com ele.</p>
            </div>
          )}

          {tokens.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {tokens.map((token) => (
                <TokenRow key={token.id} token={token} onDelete={() => removeMutation.mutate(token.id)} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={2}>Conecte na sua IA</StepTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div role="tablist" aria-label="Onde conectar" className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
            {CLIENTS.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={client === c.key}
                onClick={() => setClient(c.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  client === c.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <ClientInstructions client={client} url={url} token={token} />

          <p className="text-xs text-muted-foreground">O token é a sua chave — trate como senha e não compartilhe. Por isso ele vai no cabeçalho, e não na URL.</p>
          {!created && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <TriangleAlert className="size-3.5" />
              Gere um token acima para que ele apareça já preenchido no cabeçalho.
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Depois de conectar, você escolhe dentro da própria IA, ferramenta por ferramenta, o que ela pode fazer direto, o que precisa da sua confirmação e o que fica
            bloqueado.
          </p>
        </CardContent>
      </Card>

      <InternalChatCard orgId={orgId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O que a IA passa a enxergar</CardTitle>
          <CardDescription>
            Sempre dentro das permissões de quem gerou o token. As ações só ficam disponíveis com token de leitura e configuração — com token de leitura, ela apenas
            consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((c) => (
              <CapabilityCard key={c.key} capability={c} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TokenRow({ token, onDelete }: { token: McpToken; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <KeyRound className="size-4 shrink-0 text-violet-600" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{token.name}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium",
              token.scope === "READ_WRITE" ? "bg-violet-100 text-violet-800" : "bg-muted text-muted-foreground",
            )}
          >
            {token.scope === "READ_WRITE" ? "Configura" : "Leitura"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-mono">{token.tokenPrefix}···</span> · {relativeTime(token.lastUsedAt)}
          {token.createdBy ? ` · criado por ${token.createdBy}` : ""}
        </p>
      </div>
      <ConfirmDialog
        title="Excluir este token?"
        description={`A IA conectada com "${token.name}" perde o acesso à Nokta na hora. Essa ação não pode ser desfeita.`}
        onConfirm={onDelete}
        trigger={
          <button
            type="button"
            aria-label={`Excluir token ${token.name}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </button>
        }
      />
    </li>
  );
}

function UrlBox({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{value}</code>
      <CopyButton value={value} label="Copiar" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <UrlBox value={value} />
    </div>
  );
}

function ClientInstructions({ client, url, token }: { client: ClientKey; url: string; token: string }) {
  const header = `Bearer ${token}`;
  if (client === "code") {
    return (
      <>
        <p className="text-sm">No terminal, rode o comando abaixo (o token vai no cabeçalho, já preenchido):</p>
        <UrlBox value={`claude mcp add --transport http nokta ${url} --header "Authorization: ${header}"`} />
      </>
    );
  }
  if (client === "chatgpt") {
    return (
      <>
        <p className="text-sm">
          Em <strong>Configurações → Aplicativos e conectores</strong>, ative o <strong>modo desenvolvedor</strong> e crie um conector com a URL abaixo. Se houver
          opção de cabeçalho, adicione o <strong>Authorization</strong>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="URL do servidor" value={url} />
          <Field label="Cabeçalho Authorization" value={header} />
        </div>
        <p className="text-xs text-muted-foreground">
          Se o ChatGPT não oferecer cabeçalho, use a URL com o token: <span className="break-all font-mono">{`${url}?token=${token}`}</span>
        </p>
      </>
    );
  }
  return (
    <>
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>
          Em <strong>Configurações → Conectores → Adicionar conector personalizado</strong>
          {client === "desktop" ? " (os conectores da sua conta aparecem no app automaticamente)" : ""}, dê o nome <strong>Nokta</strong> e cole a URL.
        </li>
        <li>
          Em <strong>Autenticação</strong>, escolha <strong>Sem login</strong> — mesmo que o Claude marque &quot;Entrar agora&quot; como detectado (ele testa a URL ainda
          sem o token).
        </li>
        <li>
          Em <strong>Cabeçalhos de requisição → Adicionar cabeçalho</strong>, use o nome <strong>Authorization</strong> e o valor abaixo.
        </li>
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="URL do servidor" value={url} />
        <Field label="Cabeçalho: Authorization" value={header} />
      </div>
    </>
  );
}

function CapabilityCard({ capability }: { capability: McpCapability }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-sm font-medium">{capability.label}</p>
      {capability.read.length > 0 && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{capability.read.join(", ")}</p>}
      {capability.write.length > 0 && (
        <p className="mt-1.5 text-xs leading-relaxed text-violet-800">
          <span className="font-medium">Com configuração:</span> {capability.write.join(", ").toLowerCase()}
        </p>
      )}
    </div>
  );
}

/**
 * Chat "Pergunte à IA" dentro da Nokta: aqui a Nokta é quem chama a IA, então
 * precisa de uma chave de API (cobrada por uso na conta da Anthropic), diferente
 * do conector acima, que usa a assinatura do Claude de quem conecta.
 */
function InternalChatCard({ orgId }: { orgId: number }) {
  const queryClient = useQueryClient();
  const statusKey = [...ASSISTANT_STATUS_KEY, orgId];
  const statusQuery = useQuery({ queryKey: statusKey, queryFn: () => assistantApi.getConnection(orgId), staleTime: 5 * 60_000 });
  const [apiKey, setApiKey] = useState("");
  const [replacing, setReplacing] = useState(false);

  const connectMutation = useMutation({
    mutationFn: () => assistantApi.connect(orgId, "ANTHROPIC", apiKey.trim()),
    onSuccess: (data) => {
      queryClient.setQueryData(statusKey, data);
      setApiKey("");
      setReplacing(false);
      toast.success("Claude conectado. O chat já está liberado para a equipe.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const disconnectMutation = useMutation({
    mutationFn: () => assistantApi.disconnect(orgId),
    onSuccess: (data) => {
      queryClient.setQueryData(statusKey, data);
      toast.success("IA desconectada do chat.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const status = statusQuery.data;
  const connection = status?.connection ?? null;
  const showForm = !connection || replacing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-violet-600" />
          Chat dentro da Nokta
        </CardTitle>
        <CardDescription className="leading-relaxed">
          Libera o &quot;Pergunte à IA&quot; aqui no painel para toda a equipe, cada um com as próprias permissões. Diferente do conector acima, aqui a Nokta chama a IA,
          por isso precisa de uma <strong>chave de API da Anthropic</strong> (começa com sk-ant-). O uso é cobrado por consumo na conta dessa chave, à parte da
          assinatura do Claude.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusQuery.isLoading ? (
          <BlockSkeleton className="h-16" />
        ) : status && !status.available ? (
          <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">O chat ainda está sendo habilitado no servidor da Nokta.</p>
        ) : (
          <>
            {connection && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
                <KeyRound className="size-4 shrink-0 text-violet-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Claude conectado</p>
                  <p className="text-xs text-muted-foreground">
                    chave <span className="font-mono">…{connection.keyHint}</span>
                    {connection.connectedBy ? ` · por ${connection.connectedBy}` : ""} · {new Date(connection.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {!replacing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReplacing(true)}>
                      Trocar chave
                    </Button>
                    <ConfirmDialog
                      title="Desconectar a IA do chat?"
                      description="O Pergunte à IA para de funcionar para toda a equipe até alguém conectar uma chave de novo. O conector do Claude não é afetado."
                      onConfirm={() => disconnectMutation.mutate()}
                      trigger={
                        <Button variant="outline" size="sm" className="text-red-700 hover:text-red-800">
                          Desconectar
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            )}
            {showForm && (
              <form
                className="space-y-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (apiKey.trim().length >= 10 && !connectMutation.isPending) connectMutation.mutate();
                }}
              >
                <Label htmlFor="assistant-api-key">Chave de API da Anthropic</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="assistant-api-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-…"
                    className="font-mono text-base sm:text-sm"
                  />
                  <Button type="submit" disabled={apiKey.trim().length < 10 || connectMutation.isPending} className="shrink-0">
                    {connectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {connectMutation.isPending ? "Verificando…" : "Conectar Claude"}
                  </Button>
                  {replacing && (
                    <Button type="button" variant="ghost" onClick={() => setReplacing(false)}>
                      Cancelar
                    </Button>
                  )}
                </div>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-800"
                >
                  Criar uma chave no console da Anthropic (precisa de crédito em Billing) <ExternalLink className="size-3" />
                </a>
              </form>
            )}
            <p className="text-xs text-muted-foreground">ChatGPT no chat interno chega em breve.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
