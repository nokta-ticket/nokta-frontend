import api from "@/lib/axios";

export type AssistantProviderKey = "ANTHROPIC" | "OPENAI";

export interface AssistantConnectionStatus {
  /** false = o servidor ainda não tem a chave de cifragem configurada; conectar não funciona. */
  available: boolean;
  /** Quais IAs já têm integração no backend. */
  providers: Record<AssistantProviderKey, boolean>;
  connection: { provider: AssistantProviderKey; keyHint: string; createdAt: string } | null;
}

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantStep {
  tool: string;
  label: string;
  ok: boolean;
}

export interface AssistantNavigateAction {
  type: "navigate";
  route: string;
  label: string;
}

export interface AssistantTurnResponse {
  reply: string;
  steps: AssistantStep[];
  actions: AssistantNavigateAction[];
}

export const assistantApi = {
  getConnection: () => api.get<AssistantConnectionStatus>("/assistant/connection").then((r) => r.data),
  connect: (provider: AssistantProviderKey, apiKey: string) =>
    api.put<AssistantConnectionStatus>("/assistant/connection", { provider, apiKey }).then((r) => r.data),
  disconnect: () => api.delete<AssistantConnectionStatus>("/assistant/connection").then((r) => r.data),
  turn: (organizationId: number, messages: AssistantChatMessage[]) =>
    api.post<AssistantTurnResponse>(`/organizations/${organizationId}/assistant/turn`, { messages }).then((r) => r.data),
};

// ─── IA e conexões: conector MCP (Claude/ChatGPT via token) ───

export type McpTokenScope = "READ" | "READ_WRITE";

export interface McpToken {
  id: number;
  name: string;
  scope: McpTokenScope;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string;
}

/** Token completo: só existe na resposta de criação (a Nokta guarda apenas o hash). */
export interface McpTokenCreated extends Omit<McpToken, "lastUsedAt" | "createdBy"> {
  token: string;
}

export interface McpCapability {
  key: string;
  label: string;
  read: string[];
  write: string[];
}

export interface McpTokensResponse {
  tokens: McpToken[];
  capabilities: McpCapability[];
}

export const mcpApi = {
  list: (organizationId: number) => api.get<McpTokensResponse>(`/organizations/${organizationId}/assistant/mcp-tokens`).then((r) => r.data),
  create: (organizationId: number, name: string, scope: McpTokenScope) =>
    api.post<McpTokenCreated>(`/organizations/${organizationId}/assistant/mcp-tokens`, { name, scope }).then((r) => r.data),
  remove: (organizationId: number, tokenId: number) => api.delete(`/organizations/${organizationId}/assistant/mcp-tokens/${tokenId}`).then((r) => r.data),
};
