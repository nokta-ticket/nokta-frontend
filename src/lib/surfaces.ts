/**
 * Fase 5.1 — configuração central das três superfícies que este MESMO build
 * Next.js atende, reconhecendo o host da requisição. Nunca comparar
 * `hostname === "app.nokta.live"` espalhado por componentes — sempre passar
 * pelos helpers daqui. Ver docs/platform/surfaces.md.
 */
export type Surface = "PLATFORM" | "TICKETS_PUBLIC" | "MARKETING";

interface SurfaceDefinition {
  hostnames: string[];
  baseUrl: string;
  apiBaseUrl: string;
  defaultPath: string;
}

const PLATFORM_HOSTNAMES = ["app.nokta.live", "app.localhost"];
const TICKETS_HOSTNAMES = ["noktatickets.com.br", "www.noktatickets.com.br", "tickets.localhost"];
// "nokta.live" (sem www) entra aqui só pra nunca cair no público por
// engano se, por algum motivo, a requisição chegar até este código sem
// antes passar pelo redirect 308 pro www (ver middleware). O redirect de
// verdade é responsabilidade da Vercel (domínio apex → www) — isto é rede
// de segurança, não o mecanismo principal.
const MARKETING_HOSTNAMES = ["www.nokta.live", "nokta.live", "marketing.localhost"];

// localhost puro (sem subdomínio): modo de desenvolvimento "tudo junto",
// como sempre funcionou — nenhuma regra de host é aplicada (ver
// isSurfaceEnforced). app.localhost/tickets.localhost/marketing.localhost
// são pra quando alguém quer testar a separação de verdade localmente
// (Etapa 12/20).
const UNENFORCED_LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];

function stripPort(hostname: string): string {
  return hostname.split(":")[0].toLowerCase();
}

/**
 * Fase 5.1 — fonte de verdade CANÔNICA e hardcoded pras três superfícies,
 * sem env var no meio. Essas URLs são estáveis e conhecidas em code
 * review — não mudam por ambiente de produção.
 *
 * IMPORTANTE: `src/middleware.ts` mantém a SUA PRÓPRIA cópia local deste
 * mesmo mapa (não importa daqui) — não é duplicação por descuido. Depois
 * de dois deploys confirmados (GitHub "Deployment has completed", outras
 * páginas do MESMO build já refletindo código novo) o Middleware em
 * produção continuou usando um valor antigo só quando o destino do
 * redirect vinha de uma função IMPORTADA; um marcador de diagnóstico
 * declarado como constante local do próprio middleware.ts refletiu o
 * build certo de primeira. Isso isolou uma peculiaridade de bundling do
 * Edge Middleware especificamente pra módulos importados (sem explicação
 * encontrada no código-fonte, sem acesso ao painel/build da Vercel pra
 * investigar mais). Se alterar os hosts aqui, altere a cópia em
 * middleware.ts também.
 */
const CANONICAL_SURFACE_URLS: Record<Surface, string> = {
  PLATFORM: "https://app.nokta.live",
  TICKETS_PUBLIC: "https://www.noktatickets.com.br",
  MARKETING: "https://www.nokta.live",
};

/** Pra código Node.js (Server Components, route handlers) que precise do host canônico sem risco de override por env var. Não usado pelo Middleware — ver comentário acima. */
export function getCanonicalSurfaceUrl(surface: Surface): string {
  return CANONICAL_SURFACE_URLS[surface];
}

const SURFACES: Record<Surface, SurfaceDefinition> = {
  PLATFORM: {
    hostnames: PLATFORM_HOSTNAMES,
    baseUrl: process.env.NEXT_PUBLIC_PLATFORM_URL || "https://app.nokta.live",
    apiBaseUrl: process.env.NEXT_PUBLIC_PLATFORM_API_URL || "https://api.nokta.live/api",
    defaultPath: "/dashboard/inicio",
  },
  TICKETS_PUBLIC: {
    hostnames: TICKETS_HOSTNAMES,
    baseUrl: process.env.NEXT_PUBLIC_TICKETS_URL || "https://www.noktatickets.com.br",
    apiBaseUrl: process.env.NEXT_PUBLIC_TICKETS_API_URL || "https://api.noktatickets.com.br/api",
    defaultPath: "/",
  },
  MARKETING: {
    hostnames: MARKETING_HOSTNAMES,
    baseUrl: process.env.NEXT_PUBLIC_MARKETING_URL || "https://www.nokta.live",
    // A LP é estática e não depende de autenticação (Etapa 7) — não tem uso
    // conhecido hoje, mas resolve pra API pública caso algum bloco futuro
    // precise (ex.: contagem de eventos), nunca pra API da plataforma.
    apiBaseUrl: process.env.NEXT_PUBLIC_TICKETS_API_URL || "https://api.noktatickets.com.br/api",
    defaultPath: "/",
  },
};

const LOCAL_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

/** Host desconhecido (preview, IP, etc.) cai no público — superfície neutra, nunca expõe o dashboard por padrão. */
export function resolveSurfaceFromHost(hostname: string | null | undefined): Surface {
  const host = hostname ? stripPort(hostname) : "";
  if (PLATFORM_HOSTNAMES.includes(host)) return "PLATFORM";
  if (MARKETING_HOSTNAMES.includes(host)) return "MARKETING";
  return "TICKETS_PUBLIC";
}

/** false pra localhost puro (dev sem separação) e previews da Vercel não mapeados — true nos hosts reais e em *.localhost explícito. */
export function isSurfaceEnforced(hostname: string | null | undefined): boolean {
  const host = hostname ? stripPort(hostname) : "";
  if (!host) return false;
  if (UNENFORCED_LOCAL_HOSTNAMES.includes(host)) return false;
  if (host.endsWith(".vercel.app") && !process.env.NEXT_PUBLIC_ENFORCE_SURFACE_ON_PREVIEW) return false;
  return true;
}

export function getSurfaceConfig(surface: Surface): SurfaceDefinition {
  return SURFACES[surface];
}

function isLocalHost(host: string): boolean {
  return UNENFORCED_LOCAL_HOSTNAMES.includes(host) || host.endsWith(".localhost");
}

/**
 * Resolve a API correta em runtime a partir do host — nunca uma
 * NEXT_PUBLIC_API_URL fixa (o mesmo build Vercel atende os dois domínios).
 * Funciona em Client Components (usa window quando hostname não é
 * informado) e em Server Components/middleware/route handlers (passe o
 * hostname explicitamente, vindo de `headers().get("host")` ou
 * `request.nextUrl.hostname`).
 */
export function getApiBaseUrl(hostname?: string | null): string {
  const raw = hostname ?? (typeof window !== "undefined" ? window.location.hostname : null);
  const host = raw ? stripPort(raw) : "";

  if (!host || isLocalHost(host)) return LOCAL_API_URL;

  if (host.endsWith(".vercel.app")) {
    return process.env.NEXT_PUBLIC_PREVIEW_API_URL || LOCAL_API_URL;
  }

  return getSurfaceConfig(resolveSurfaceFromHost(host)).apiBaseUrl;
}

export function getPlatformUrl(path = ""): string {
  return `${SURFACES.PLATFORM.baseUrl}${path}`;
}

export function getPublicTicketsUrl(path = ""): string {
  return `${SURFACES.TICKETS_PUBLIC.baseUrl}${path}`;
}

export function getMarketingUrl(path = ""): string {
  return `${SURFACES.MARKETING.baseUrl}${path}`;
}

export function buildAbsoluteUrl(surface: Surface, path = ""): string {
  return `${SURFACES[surface].baseUrl}${path}`;
}

// Aliases explícitos por superfície — mesma implementação de
// buildAbsoluteUrl, só pra quem prefere chamar sem passar o enum na mão.
export function buildPlatformUrl(path = ""): string {
  return buildAbsoluteUrl("PLATFORM", path);
}

export function buildTicketsUrl(path = ""): string {
  return buildAbsoluteUrl("TICKETS_PUBLIC", path);
}

export function buildMarketingUrl(path = ""): string {
  return buildAbsoluteUrl("MARKETING", path);
}

/**
 * Token curto pra compor o `state` do OAuth (ver auth.controller.ts
 * decodeOAuthState) — o callback sempre chega no MESMO backend fixo
 * registrado no Google/Apple, então é assim que ele sabe pra qual host de
 * frontend redirecionar de volta.
 */
export function currentSurfaceStateToken(): "platform" | "tickets" {
  if (typeof window === "undefined") return "tickets";
  return resolveSurfaceFromHost(window.location.hostname) === "PLATFORM" ? "platform" : "tickets";
}
