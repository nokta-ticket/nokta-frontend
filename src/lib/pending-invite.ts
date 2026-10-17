/**
 * Convite de equipe aberto neste navegador e ainda não aceito. O link do
 * e-mail (/convites/<token>) é o que prova que a pessoa recebe e-mail naquele
 * endereço. Se depois ela entra por outro caminho (login sem o `redirect`,
 * Google, cadastro, toque duplo no iPhone), o painel sem workspace mandava
 * criar um. Guardando o token, o pós-login devolve a pessoa ao convite e o
 * onboarding oferece aceitá-lo.
 *
 * localStorage é só atalho de UX: aceitar continua exigindo o token e o
 * e-mail da conta igual ao do convite (API).
 */
const KEY = "nokta:convite-pendente";
/** Mesma validade do convite na API (INVITATION_EXPIRY_DAYS). */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Formato do token gerado pela API: 32 bytes em hex. */
const TOKEN_RE = /^[a-f0-9]{64}$/;

export function savePendingInvite(token: string): void {
  if (!TOKEN_RE.test(token)) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() }));
  } catch {
    // Sem storage (aba anônima, bloqueio): segue sem o atalho.
  }
}

export function readPendingInvite(now: number = Date.now()): string | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as { token?: unknown; at?: unknown } | null;
    if (!saved || typeof saved.token !== "string" || typeof saved.at !== "number") return null;
    if (now - saved.at > TTL_MS || !TOKEN_RE.test(saved.token)) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return saved.token;
  } catch {
    return null;
  }
}

/** Apaga o convite guardado. Com `token`, só apaga se for o mesmo. */
export function clearPendingInvite(token?: string): void {
  try {
    if (token && readPendingInvite() !== token) return;
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Caminho do convite guardado (`/convites/<token>`), para usar depois do login. */
export function pendingInvitePath(): string | null {
  const token = readPendingInvite();
  return token ? `/convites/${token}` : null;
}
