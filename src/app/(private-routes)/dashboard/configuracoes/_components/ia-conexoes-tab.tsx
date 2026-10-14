"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/axios";
import { getApiBaseUrl } from "@/lib/surfaces";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { mcpApi, type McpCapability, type McpToken, type McpTokenCreated, type McpTokenScope } from "@/services/assistant";

/**
 * Configurações → IA e conexões. O workspace gera um token e o cola no
 * Claude (claude.ai, app ou Claude Code no VS Code) como conector: a conversa
 * acontece lá, e permitir, pedir confirmação ou bloquear cada ferramenta
 * também é configurado lá. A Nokta só decide o escopo (leitura ou leitura e
 * configuração) e aplica as permissões de quem gerou o token.
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

type ClientKey = "claude" | "desktop" | "code";
const CLIENTS: { value: ClientKey; label: string }[] = [
  { value: "claude", label: "claude.ai" },
  { value: "desktop", label: "Claude Desktop" },
  { value: "code", label: "Claude Code" },
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
    <Button
      type="button"
      variant="subtle"
      size="icon-sm"
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
    >
      <Icon name={copied ? "check" : "copy"} size={14} className={copied ? "text-success" : undefined} />
    </Button>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand tnum">{n}</span>
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

  if (tokensQuery.isLoading) return <Skeleton className="h-96 rounded-card" />;

  if (tokensQuery.isError) {
    const forbidden = isAxiosError(tokensQuery.error) && tokensQuery.error.response?.status === 403;
    return (
      <EmptyState
        icon={forbidden ? "lock" : "warning"}
        title={forbidden ? "Somente o proprietário ou um gerente configura a IA" : "Não foi possível carregar as conexões de IA"}
        description={forbidden ? "As conexões de IA são do workspace. Peça ao administrador para gerar um acesso para você." : getErrorMessage(tokensQuery.error)}
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
      <Card accent>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="magic" size={16} className="text-brand" />
              Converse com o Claude sobre a Nokta
            </CardTitle>
            <CardDescription>Conecte o Claude e pergunte em linguagem natural: quanto vendeu na semana, o que está acabando no estoque, quem reservou para hoje. Se você permitir, a IA também cria reservas, lança pedidos, cadastra produtos, eventos e cupons.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {EXAMPLES.map((example) => (
              <div key={example} className="surface-inset flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm text-foreground">
                <Icon name="comments" size={12} className="mt-1 shrink-0 text-muted-foreground" />“{example}”
              </div>
            ))}
          </div>
          <Callout tone="success" icon="shield">
            O acesso fica restrito a este workspace e às permissões, na Nokta, de quem gerou o token: você escolhe <strong className="font-semibold text-foreground">somente leitura</strong> ou <strong className="font-semibold text-foreground">leitura e configuração</strong>. Em nenhum caso a IA faz saques: essa ação nunca é oferecida a ela.
          </Callout>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={1}>Gere um token de acesso</StepTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div role="radiogroup" aria-label="Escopo do token" className="grid gap-3 sm:grid-cols-2">
            {SCOPES.map((option) => {
              const selected = scope === option.value;
              return (
                <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setScope(option.value)} className={cn("flex items-start gap-3 rounded-card border p-4 text-left transition-colors", selected ? "border-brand/50 bg-brand-soft/60 ring-1 ring-brand-ring" : "border-border bg-surface-2/60 hover:border-border-strong")}>
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-brand" : "border-border-strong")}>{selected ? <span className="size-2 rounded-full bg-brand" /> : null}</span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{option.title}</span>
                    <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canCreate) createMutation.mutate();
            }}
          >
            <Field label="Nome do token" htmlFor="mcp-token-name" hint="Pra você lembrar onde está em uso.">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="mcp-token-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Meu notebook, Claude do sócio" leftIcon="key" />
                <Button type="submit" disabled={!canCreate} loading={createMutation.isPending} leftIcon="plus" className="shrink-0">
                  Gerar token
                </Button>
              </div>
            </Field>
          </form>

          {created ? (
            <Callout tone="warning" icon="key" title={`Token “${created.name}” gerado. Copie agora — por segurança ele não aparece de novo.`}>
              <div className="mt-2 flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-1.5">
                <code className="min-w-0 flex-1 truncate font-mono text-caption text-foreground">{created.token}</code>
                <CopyButton value={created.token} label="Copiar token" />
              </div>
              <p className="mt-2 text-caption">O passo 2 já mostra o cabeçalho preenchido com ele.</p>
            </Callout>
          ) : null}

          {tokens.length > 0 ? (
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border">
              {tokens.map((t) => (
                <TokenRow key={t.id} token={t} onDelete={() => removeMutation.mutate(t.id)} />
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <StepTitle n={2}>Conecte no Claude</StepTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SegmentedControl value={client} onChange={setClient} options={CLIENTS} size="sm" />

          <ClientInstructions client={client} url={url} token={token} />

          <p className="text-caption text-muted-foreground">O token é a sua chave: trate como senha e não compartilhe. Por isso ele vai no cabeçalho, e não na URL.</p>
          {!created ? (
            <p className="flex items-center gap-1.5 text-caption font-medium text-warning">
              <Icon name="warning" size={12} />
              Gere um token acima para que ele apareça já preenchido no cabeçalho.
            </p>
          ) : null}
          <p className="text-caption leading-relaxed text-muted-foreground">Depois de conectar, você escolhe dentro do próprio Claude, ferramenta por ferramenta, o que ela pode fazer direto, o que precisa da sua confirmação e o que fica bloqueado.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>O que o Claude passa a enxergar</CardTitle>
            <CardDescription>Sempre dentro das permissões de quem gerou o token. As ações só ficam disponíveis com token de leitura e configuração.</CardDescription>
          </div>
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
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Icon name="key" size={14} className="shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{token.name}</span>
          <StatusBadge tone={token.scope === "READ_WRITE" ? "brand" : "neutral"} dot={false}>
            {token.scope === "READ_WRITE" ? "Configura" : "Leitura"}
          </StatusBadge>
        </div>
        <p className="mt-0.5 truncate text-caption text-muted-foreground">
          <span className="font-mono">{token.tokenPrefix}···</span> · {relativeTime(token.lastUsedAt)}
          {token.createdBy ? ` · criado por ${token.createdBy}` : ""}
        </p>
      </div>
      <Button variant="subtle" size="icon-sm" aria-label={`Excluir token ${token.name}`} onClick={() => setConfirming(true)} className="hover:bg-danger-bg hover:text-danger">
        <Icon name="trash" size={14} />
      </Button>
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} danger icon="trash" title="Excluir este token?" description={`A IA conectada com "${token.name}" perde o acesso à Nokta na hora. Essa ação não pode ser desfeita.`} confirmLabel="Excluir" onConfirm={onDelete} />
    </li>
  );
}

function UrlBox({ value }: { value: string }) {
  return (
    <div className="surface-inset flex items-center gap-2 rounded-input px-3 py-1.5">
      <code className="min-w-0 flex-1 break-all font-mono text-caption text-foreground">{value}</code>
      <CopyButton value={value} label="Copiar" />
    </div>
  );
}

function CodeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">{label}</p>
      <UrlBox value={value} />
    </div>
  );
}

function ClientInstructions({ client, url, token }: { client: ClientKey; url: string; token: string }) {
  const header = `Bearer ${token}`;
  if (client === "code") {
    return (
      <>
        <p className="text-sm text-foreground">No terminal, rode o comando abaixo (o token vai no cabeçalho, já preenchido):</p>
        <UrlBox value={`claude mcp add --transport http nokta ${url} --header "Authorization: ${header}"`} />
      </>
    );
  }
  return (
    <>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground">
        <li>
          Em <strong className="font-semibold">Configurações → Conectores → Adicionar conector personalizado</strong>
          {client === "desktop" ? " (os conectores da sua conta aparecem no app automaticamente)" : ""}, dê o nome <strong className="font-semibold">Nokta</strong> e cole a URL.
        </li>
        <li>
          Em <strong className="font-semibold">Autenticação</strong>, escolha <strong className="font-semibold">Sem login</strong>, mesmo que o Claude marque &quot;Entrar agora&quot; como detectado (ele testa a URL ainda sem o token).
        </li>
        <li>
          Em <strong className="font-semibold">Cabeçalhos de requisição → Adicionar cabeçalho</strong>, use o nome <strong className="font-semibold">Authorization</strong> e o valor abaixo.
        </li>
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        <CodeField label="URL do servidor" value={url} />
        <CodeField label="Cabeçalho: Authorization" value={header} />
      </div>
    </>
  );
}

function CapabilityCard({ capability }: { capability: McpCapability }) {
  return (
    <div className="surface-inset rounded-xl px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{capability.label}</p>
      {capability.read.length > 0 ? <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{capability.read.join(", ")}</p> : null}
      {capability.write.length > 0 ? (
        <p className="mt-1.5 text-caption leading-relaxed text-brand">
          <span className="font-semibold">Com configuração:</span> {capability.write.join(", ").toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}
