import api from "@/lib/axios";

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
