import {
  type NextRequest,
  type MiddlewareConfig,
  NextResponse,
} from "next/server";
import { UserPayload } from "./context/AuthContext";
import {
  getSurfaceConfig,
  isSurfaceEnforced,
  resolveSurfaceFromHost,
} from "./lib/surfaces";

const publicRoutes = [
  { path: "/login", whenAutenticated: "redirect" },
  { path: "/admin/login", whenAutenticated: "redirect" },
  { path: "/recuperar-senha", whenAutenticated: "next" },
  { path: "/recuperar-senha/[id]", whenAutenticated: "next" },
  { path: "/convites/[id]", whenAutenticated: "next" },
  { path: "/register", whenAutenticated: "redirect" },
  { path: "/eventos", whenAutenticated: "next" },
  { path: "/eventos/[id]", whenAutenticated: "next" },
  { path: "/eventos/[id]/checkout", whenAutenticated: "next" },
  { path: "/revenda", whenAutenticated: "next" },
  { path: "/revenda/anunciar", whenAutenticated: "next" },
  { path: "/para-produtores", whenAutenticated: "next" },
  { path: "/auth/callback", whenAutenticated: "next" },
  { path: "/privacidade", whenAutenticated: "next" },
  { path: "/termos", whenAutenticated: "next" },
  { path: "/", whenAutenticated: "next" },
] as const;

const protectedProdutorRoutes = [
  "/produtor/eventos",
  "/produtor/metricas",
  "/produtor/validar",
  "/produtor/verificar-conta",
];

// Requires auth but NOT producer role (any logged-in user can access)
const authOnlyRoutes = ["/produtor/onboarding"];

const protectedAdminRoutes = [
  "/admin/dashboard",
  "/admin/usuarios",
  "/admin/ingressos",
  "/admin/eventos",
  "/admin/pedidos-produtor",
  "/admin/eventos/destaques",
  "/admin/auditoria",
  "/admin/evidencias",
  "/admin/seguranca",
];

// Fase 5 — Etapa 3: prefixos exclusivos de cada superfície. Fora daqui
// (login, register, recuperar-senha, convites, auth/callback, termos,
// privacidade) é rota compartilhada — a MESMA página funciona nos dois
// hosts, sem duplicação (o host só muda pra onde os botões/links apontam).
const PLATFORM_ONLY_PREFIXES = ["/dashboard", "/produtor", "/admin", "/solicitar-produtor"];
const TICKETS_ONLY_PREFIXES = [
  "/eventos",
  "/revenda",
  "/favoritos",
  "/meus-ingressos",
  "/minhas-revendas",
  "/perfil",
  "/para-produtores",
];

const REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE = "/";
const REDIRECT_WHEN_INVALID_ROLE_ROUTE = "/";

function parseJwt(token: string): { role?: string; exp?: number } | null {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function isValidToken(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime;
}

function hasProdutorRole(payload: UserPayload): boolean {
  return payload?.role === "PRODUTOR";
}

// Acesso ao painel: todo o staff (SUPER_ADMIN, ADMIN, SUPPORT).
// As restrições por tipo de ação são aplicadas no backend (RolesGuard).
const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];

function hasAdminRole(payload: UserPayload): boolean {
  return STAFF_ROLES.includes(payload?.role ?? "");
}

function matchDynamicRoute(path: string, routePattern: string): boolean {
  if (!routePattern.includes("[")) return routePattern === path;
  const regex = new RegExp(
    "^" + routePattern.replace(/\[.*?\]/g, "[^/]+") + "$"
  );
  return regex.test(path);
}

// Mesma checagem de segurança do lib/safe-redirect.ts (o middleware roda no
// Edge Runtime, à parte do bundle da app — duplicado de propósito, nunca
// confia em host externo nem em protocol-relative "//").
function isSafeInternalRedirect(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//") || path.startsWith("/\\")) return false;
  if (path.includes("://")) return false;
  return true;
}

function matchesAnyPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Redirect pra outra origem (app.nokta.live <-> noktatickets.com.br).
 *
 * Nem `NextResponse.redirect(new URL(...))` nem um Location absoluto por
 * string funcionam aqui: em produção (confirmado com curl -I, x-vercel-id
 * mudando a cada request — não é cache), o Location acaba virando um
 * caminho relativo e o browser reenvia pro mesmo host, virando loop
 * infinito. Os dois domínios são o MESMO projeto Vercel, e alguma camada
 * de edge (Vercel ou Cloudflare na frente) reescreve/rebases o Location de
 * um redirect HTTP entre eles.
 *
 * Contorno: não usar redirect HTTP nenhum pra troca de origem — devolve
 * uma página HTML mínima com meta-refresh + fallback via JS. Isso é
 * conteúdo de resposta, não um header, então nenhuma camada de proxy tem
 * motivo pra reescrever a URL — o navegador só lê e navega.
 */
// path/search vêm da URL da própria requisição (o visitante controla) —
// nunca embutir cru em HTML/atributo, mesmo sendo só refletido pro próprio
// navegador de quem pediu (reflected XSS via link malicioso pra vítima).
function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function crossOriginRedirect(baseUrl: string, path: string, search: string): NextResponse {
  const location = `${baseUrl}${path}${search}`;
  // JSON.stringify não escapa "</" — sem isso, um path/query malicioso
  // poderia fechar a </script> mais cedo e injetar HTML (o path/search vêm
  // da própria URL da requisição, então é atacante-controlável via link).
  const scriptSafeLocation = JSON.stringify(location).replace(/</g, '\\u003C');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${escapeHtmlAttribute(location)}"><script>location.replace(${scriptSafeLocation});</script></head><body></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Fase 5, Etapa 11: app.nokta.live nunca deve ser indexado — header HTTP
// (funciona pra qualquer resposta, não só HTML) além do robots.ts
// específico do host (ver src/app/robots.ts).
function withRobotsHeader(response: NextResponse, isPlatform: boolean): NextResponse {
  if (isPlatform) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname;
  const authToken = request.cookies.get("nokta_session")?.value;
  const userPayload = JSON.parse(request.cookies.get("user")?.value || "{}");
  const isPlatformSurface = isSurfaceEnforced(hostname) && resolveSurfaceFromHost(hostname) === "PLATFORM";

  // ── Fase 5, Etapa 3: separação de rotas por host ──────────────────────
  // Roda ANTES de qualquer lógica de auth — troca de host é sempre a
  // primeira decisão. Preserva path + query string (deep link) e nunca usa
  // um host arbitrário como destino, só os dois definidos centralmente em
  // lib/surfaces.ts.
  if (isSurfaceEnforced(hostname)) {
    const surface = resolveSurfaceFromHost(hostname);

    if (surface === "TICKETS_PUBLIC" && matchesAnyPrefix(path, PLATFORM_ONLY_PREFIXES)) {
      return crossOriginRedirect(getSurfaceConfig("PLATFORM").baseUrl, path, request.nextUrl.search);
    }

    if (surface === "PLATFORM" && matchesAnyPrefix(path, TICKETS_ONLY_PREFIXES)) {
      return crossOriginRedirect(getSurfaceConfig("TICKETS_PUBLIC").baseUrl, path, request.nextUrl.search);
    }

    // Raiz do domínio da plataforma não é a home pública — decide entre
    // login e a Início unificada, nunca renderiza a home de descoberta de
    // eventos em app.nokta.live (Etapa 14).
    if (surface === "PLATFORM" && path === "/") {
      const target = request.nextUrl.clone();
      target.pathname = authToken ? getSurfaceConfig("PLATFORM").defaultPath : "/login";
      return NextResponse.redirect(target);
    }
  }

  const publicRoute = publicRoutes.find((route) =>
    matchDynamicRoute(path, route.path)
  );

  // Invalid Token - clear and redirect
  if (authToken && !isValidToken(authToken)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("nokta_session");
    response.cookies.delete("user");
    return response;
  }

  // Not authenticated → public or redirect to home
  if (!authToken && !publicRoute) {
    const redirectUrl = request.nextUrl.clone();
    const isAuthOnlyUnauthenticated = authOnlyRoutes.some((r) => path.startsWith(r));
    if (isAuthOnlyUnauthenticated) {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("ctx", "produtor");
    } else {
      redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE;
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (!authToken && publicRoute) return withRobotsHeader(NextResponse.next(), isPlatformSurface);

  // Authenticated → redirect away from login/register
  if (authToken && publicRoute?.whenAutenticated === "redirect") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.search = "";

    if (path === "/admin/login") {
      redirectUrl.pathname = hasAdminRole(userPayload) ? "/admin/dashboard" : "/";
      return NextResponse.redirect(redirectUrl);
    }

    if (path === "/login" && hasAdminRole(userPayload)) {
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }

    // Usuário já autenticado abrindo /login ou /register com um redirect
    // pendente (ex.: link de convite) — manda direto para lá em vez de para
    // a home, desde que seja um caminho interno seguro.
    const pendingRedirect = request.nextUrl.searchParams.get("redirect");
    if (isSafeInternalRedirect(pendingRedirect)) {
      const [redirectPath, redirectQuery] = pendingRedirect.split("?");
      redirectUrl.pathname = redirectPath;
      redirectUrl.search = redirectQuery ? `?${redirectQuery}` : "";
      return NextResponse.redirect(redirectUrl);
    }

    const ctx = request.nextUrl.searchParams.get("ctx");
    if (ctx === "produtor") {
      if (hasProdutorRole(userPayload)) {
        redirectUrl.pathname = "/produtor/eventos";
      } else {
        redirectUrl.pathname = "/produtor/onboarding";
      }
    } else if (isSurfaceEnforced(hostname) && resolveSurfaceFromHost(hostname) === "PLATFORM") {
      redirectUrl.pathname = getSurfaceConfig("PLATFORM").defaultPath;
    } else {
      redirectUrl.pathname = "/";
    }

    return NextResponse.redirect(redirectUrl);
  }

  // Auth-only routes (onboarding): require token, block if already a producer
  const isAuthOnly = authOnlyRoutes.some((r) => path.startsWith(r));
  if (isAuthOnly) {
    if (!authToken) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("ctx", "produtor");
      return NextResponse.redirect(redirectUrl);
    }
    if (hasProdutorRole(userPayload)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/produtor/eventos";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return withRobotsHeader(NextResponse.next(), isPlatformSurface);
  }

  // Producer routes: require PRODUTOR role
  const isProdutorRoute = protectedProdutorRoutes.some((route) =>
    path.startsWith(route)
  );
  if (authToken && isProdutorRoute && !hasProdutorRole(userPayload) && !hasAdminRole(userPayload)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_INVALID_ROLE_ROUTE;
    return NextResponse.redirect(redirectUrl);
  }

  // Admin routes: require ADMIN role
  const isAdminRoute = protectedAdminRoutes.some((route) =>
    path.startsWith(route)
  );
  if (authToken && isAdminRoute && !hasAdminRole(userPayload)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_INVALID_ROLE_ROUTE;
    return NextResponse.redirect(redirectUrl);
  }

  return withRobotsHeader(NextResponse.next(), isPlatformSurface);
}

export const config: MiddlewareConfig = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.gif|.*\\.css|.*\\.js|.*\\.ico|.*\\.ttf|.*\\.TTF|.*\\.woff|.*\\.woff2|.*\\.mp4|.*\\.mp3).*)",
  ],
};
