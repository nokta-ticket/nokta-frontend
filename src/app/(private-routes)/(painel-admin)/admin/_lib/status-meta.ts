import type { Tone } from "@/components/ui/badge";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

/** Lê o meta de um mapa com fallback neutro (label = a própria chave). */
export function metaOf<K extends string | number>(map: Partial<Record<K, StatusMeta>>, key: K | null | undefined, fallback = "Não informado"): StatusMeta {
  if (key === null || key === undefined) return { label: fallback, tone: "neutral" };
  return map[key] ?? { label: String(key), tone: "neutral" };
}

/* ---------- pedidos / ingressos ---------- */

export const ORDER_STATUS_META: Record<number, StatusMeta> = {
  1: { label: "Pendente", tone: "warning" },
  2: { label: "Pago", tone: "success" },
  3: { label: "Cancelado", tone: "neutral" },
  4: { label: "Falhou", tone: "danger" },
  5: { label: "Reservado", tone: "info" },
};

export const TICKET_STATUS_META: Record<number, StatusMeta> = {
  1: { label: "Não validado", tone: "neutral" },
  2: { label: "Validado", tone: "success" },
  3: { label: "Em revenda", tone: "info" },
  4: { label: "Transferido", tone: "brand" },
};

/** Retrato de conta excluída usa outro vocabulário pros mesmos códigos. */
export const SNAPSHOT_TICKET_STATUS_META: Record<number, StatusMeta> = {
  1: { label: "Não utilizado", tone: "neutral" },
  2: { label: "Utilizado", tone: "success" },
  3: { label: "Em revenda", tone: "info" },
  4: { label: "Transferido", tone: "brand" },
};

export const RESALE_STATUS_LABEL: Record<number, string> = { 1: "Anunciado", 2: "Vendido", 3: "Cancelado", 4: "Expirado" };

export const EVENT_STATUS_META: Record<number, StatusMeta> = {
  1: { label: "Rascunho", tone: "neutral" },
  2: { label: "Publicado", tone: "success" },
  3: { label: "Cancelado", tone: "danger" },
  4: { label: "Finalizado", tone: "info" },
};

/* ---------- contas ---------- */

export const USER_ROLE_META: Record<string, StatusMeta> = {
  COMUM: { label: "Usuário", tone: "neutral" },
  PRODUTOR: { label: "Produtor", tone: "brand" },
  ADMIN: { label: "Admin", tone: "info" },
  SUPER_ADMIN: { label: "Super admin", tone: "info" },
  SUPPORT: { label: "Suporte", tone: "info" },
};

/** Papel por id numérico (UserRole do backend), como vem no retrato de conta excluída. */
export const USER_ROLE_ID_LABEL: Record<number, string> = { 1: "Admin", 2: "Usuário", 3: "Produtor", 4: "Super admin", 5: "Suporte" };

export const STAFF_ROLE_META: Record<string, StatusMeta> = {
  SUPER_ADMIN: { label: "Super admin", tone: "brand" },
  ADMIN: { label: "Admin", tone: "info" },
  SUPPORT: { label: "Suporte", tone: "neutral" },
};

export function accountStatusMeta(ativo: boolean | null | undefined, bloqueado?: boolean | null): StatusMeta {
  if (bloqueado) return { label: "Bloqueada", tone: "danger" };
  if (ativo) return { label: "Ativa", tone: "success" };
  return { label: "Inativa", tone: "neutral" };
}

/* ---------- workspaces ---------- */

export const WORKSPACE_STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: { label: "Ativo", tone: "success" },
  SUSPENDED: { label: "Bloqueado", tone: "danger" },
  CANCELED: { label: "Cancelado", tone: "neutral" },
};

export interface StageMeta extends StatusMeta {
  detail: string;
  step: number | null;
}

/**
 * Etapas do funil, na ordem em que o lead passa por elas: conta → as 4 etapas
 * do onboarding (Identificação cria o workspace) → concluído. `step` é a
 * posição entre as 4 etapas do onboarding; `detail` diz o que falta.
 */
export const WORKSPACE_STAGE_META: Record<string, StageMeta> = {
  CONTA_NAO_CONFIRMADA: { label: "Conta não confirmada", detail: "Criou a conta, mas não confirmou o telefone", step: null, tone: "neutral" },
  IDENTIFICACAO: { label: "Identificação", detail: "Entrou no painel e ainda não criou o workspace", step: 1, tone: "warning" },
  OPERACAO: { label: "Operação", detail: "Criou o workspace, falta escolher as áreas", step: 2, tone: "warning" },
  TERMOS: { label: "Termos", detail: "Escolheu as áreas, falta aceitar os termos", step: 3, tone: "warning" },
  RESUMO: { label: "Resumo", detail: "Aceitou os termos, falta confirmar a criação", step: 4, tone: "warning" },
  CONCLUIDO: { label: "Concluído", detail: "Terminou todas as etapas", step: null, tone: "success" },
};

export const MODULE_LABEL: Record<string, string> = { tickets: "Ingressos", venue: "Bar e restaurante" };

export const MEMBER_ROLE_LABEL: Record<string, string> = { OWNER: "Dono", ADMIN: "Administrador", MEMBER: "Membro" };

export const MEMBER_STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: { label: "Ativo", tone: "success" },
  INVITED: { label: "Convidado", tone: "info" },
  SUSPENDED: { label: "Suspenso", tone: "warning" },
  REMOVED: { label: "Removido", tone: "neutral" },
};

export const VERIFICATION_META: Record<string, StatusMeta> = {
  NOT_STARTED: { label: "Não iniciado", tone: "neutral" },
  PENDING: { label: "Pendente", tone: "warning" },
  UNDER_REVIEW: { label: "Em análise", tone: "info" },
  VERIFIED: { label: "Verificado", tone: "success" },
  REJECTED: { label: "Recusado", tone: "danger" },
};

/* ---------- auditoria ---------- */

export const AUDIT_ACTION_META: Record<string, StatusMeta> = {
  USER_DADOS_ALTERADOS: { label: "Dados alterados", tone: "neutral" },
  USER_EDITADO: { label: "Dados editados pelo admin", tone: "neutral" },
  USER_BLOQUEADO: { label: "Conta bloqueada", tone: "danger" },
  USER_DESBLOQUEADO: { label: "Conta desbloqueada", tone: "success" },
  USER_ATIVADO: { label: "Conta ativada", tone: "success" },
  USER_DESATIVADO: { label: "Conta desativada", tone: "warning" },
  USER_EXCLUIDO: { label: "Conta excluída", tone: "danger" },
  USER_EXCLUIDO_COMPLETO: { label: "Conta excluída", tone: "danger" },
  SESSOES_INVALIDADAS: { label: "Sessões invalidadas", tone: "info" },
  INGRESSO_TRANSFERIDO: { label: "Ingresso transferido", tone: "brand" },
  INGRESSO_BLOQUEADO: { label: "Ingresso bloqueado", tone: "danger" },
  INGRESSO_DESBLOQUEADO: { label: "Ingresso desbloqueado", tone: "success" },
  WORKSPACE_BLOQUEADO: { label: "Workspace bloqueado", tone: "danger" },
  WORKSPACE_DESBLOQUEADO: { label: "Workspace desbloqueado", tone: "success" },
  WORKSPACE_EDITADO: { label: "Workspace editado", tone: "neutral" },
  WORKSPACE_EXCLUIDO: { label: "Workspace excluído", tone: "danger" },
  EVENTO_DESTAQUE: { label: "Destaque alterado", tone: "brand" },
  TAXAS_ALTERADAS: { label: "Taxas alteradas", tone: "warning" },
};

export const ENTITY_LABEL: Record<string, string> = { USER: "Usuário", USER_TICKET: "Ingresso", EVENT: "Evento", ORGANIZATION: "Workspace" };

/** Rótulos dos campos que aparecem em "alterações" na auditoria. */
export const FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  sobrenome: "Sobrenome",
  email: "E-mail",
  telefone: "Telefone",
  cpf: "CPF",
  cnpj: "CNPJ",
  dataNascimento: "Data de nascimento",
  tipoPessoa: "Tipo de pessoa",
  chavePix: "Chave Pix",
  nomeArtistico: "Nome artístico",
  nivelProdutor: "Nível de produtor",
};
