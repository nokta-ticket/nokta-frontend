import { notFound, unauthorized, type MockHandler } from "./types";

/**
 * Sessão e área do comprador (frente C edita aqui).
 *
 * Sessão fictícia: o AuthContext grava o cookie `user` no signIn (igual à
 * produção); aqui "estar logado" = esse cookie existir. Qualquer e-mail e
 * senha entram. Pra testar como comprador comum, use um e-mail que contenha
 * "comprador" (role COMUM); senão a sessão é de produtor.
 */
export function hasMockSession(): boolean {
  return typeof document !== "undefined" && /(^|;\s*)user=/.test(document.cookie);
}

function mockRole(): "COMUM" | "PRODUTOR" {
  if (typeof document === "undefined") return "COMUM";
  const raw = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("user="));
  try {
    const parsed = JSON.parse(decodeURIComponent(raw?.slice(5) ?? "{}"));
    return parsed.role === "PRODUTOR" ? "PRODUTOR" : "COMUM";
  } catch {
    return "COMUM";
  }
}

export function mockUser() {
  const role = mockRole();
  return {
    id: 1,
    nome: "Vitor",
    sobrenome: "Reis",
    email: role === "PRODUTOR" ? "vitor@nokta.live" : "comprador@exemplo.com",
    role,
    nivelProdutor: role === "PRODUTOR" ? 2 : null,
    cpf: "12345678909",
    cnpj: null,
    telefone: "+5511999999999",
    telefoneVerificado: true,
    nomeArtistico: role === "PRODUTOR" ? "Nokta Eventos" : null,
    tipoPessoa: "PF",
    chavePix: null,
    fotoPerfil: null,
    endereco: { cep: "01311-927", logradouro: "Av. Paulista", numero: "1471", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", complemento: "Conj. 1110" },
    sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export const MOCK_ORGANIZATION = { id: 1, nome: "Nokta Eventos", tipo: "PRODUTOR", status: "ACTIVE", slug: "nokta-eventos", role: "OWNER", onboardingCompleted: true };

export const accountHandlers: MockHandler[] = [
  {
    test: /\/auth\/login$/,
    method: "post",
    handle: ({ body }) => {
      const email = String((body as { email?: string })?.email ?? "");
      const role = email.includes("comprador") ? "COMUM" : "PRODUTOR";
      return { data: { user: { id: 1, userId: 1, role, nivelProdutor: role === "PRODUTOR" ? 2 : null, nome: "Vitor", email } } };
    },
  },
  { test: /\/auth\/logout$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/auth\/me$/, method: "get", handle: () => (hasMockSession() ? { data: mockUser() } : unauthorized()) },
  { test: /\/auth\/me$/, method: "put", handle: () => ({ data: mockUser() }) },
  { test: /\/me\/organizations$/, handle: () => (hasMockSession() && mockRole() === "PRODUTOR" ? { data: [MOCK_ORGANIZATION] } : { data: [] }) },
  { test: /\/me\/promoter\/profile$/, handle: () => notFound("Sem perfil de promoter") },
];
