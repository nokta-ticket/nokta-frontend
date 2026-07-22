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
  type Surface,
} from "./lib/surfaces";

/**
 * Fase 5.1 — URLs canônicas de destino de cross-domain redirect,
 * declaradas AQUI DENTRO (não importadas de lib/surfaces.ts) de propósito.
 *
 * Histórico: `getCanonicalSurfaceUrl` (mesmo valor, mesma lógica, hardcoded,
 * sem env var) vivia em lib/surfaces.ts e era importada aqui. Depois de
 * dois deploys confirmados (GitHub "Deployment has completed", outras
 * páginas do MESMO build já refletindo código novo) o valor usado pelo
 * Middleware em produção continuava sendo o antigo — só quando um
 * marcador de diagnóstico foi colocado como CONSTANTE LOCAL deste arquivo
 * (não importada) é que ele refletiu o build certo. Isso isola o problema
 * numa peculiaridade de bundling/propagação do Edge Middleware
 * especificamente pra módulos IMPORTADOS, não pro arquivo do middleware
 * em si — sem explicação encontrada no código, e sem acesso ao painel/
 * build da Vercel pra investigar mais a fundo. Contorno: nenhuma
 * dependência de import pra decidir o destino do redirect.
 */
const CANONICAL_SURFACE_URLS: Record<Surface, string> = {
  PLATFORM: "https://app.nokta.live",
  TICKETS_PUBLIC: "https://www.noktatickets.com.br",
  MARKETING: "https://www.nokta.live",
};

const publicRoutes = [
  { path: "/login", whenAutenticated: "redirect" },
  { path: "/admin/login", whenAutenticated: "redirect" },
  { path: "/recuperar-senha", whenAutenticated: "next" },
  { path: "/recuperar-senha/[id]", whenAutenticated: "next" },
  { path: "/convites/[id]", whenAutenticated: "next" },
  { path: "/convites-promotor/[id]", whenAutenticated: "next" },
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

// Fase 5: /produtor/* virou redirect fino pro dashboard unificado — não tem
// mais gate de role própria (a autorização real é da API + contexto de
// organização, mesmo padrão de qualquer outra rota /dashboard/*). Esta
// lista serve só pra manter a UX de "volta pro onboarding após o login" pra
// quem chega deslogado, tanto pela rota antiga quanto pela nova.
const onboardingRoutes = ["/produtor/onboarding", "/dashboard/eventos/onboarding"];

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
//
// Fase 5.2, Etapa 5 / Fase 5.3, Etapa 2: Cache-Control por superfície,
// nunca um `no-store` genérico pra tudo. PLATFORM sempre `private,
// no-store` — reforço explícito (o Next já aplica algo ainda mais
// restritivo por padrão em rota 100% dinâmica: `private, no-cache,
// no-store, max-age=0, must-revalidate` — checado em produção).
// TICKETS_PUBLIC fica de fora de propósito: `/eventos` (a home pública) já
// é personalizada por auth opcional (isFavorite) — sem uma auditoria
// página a página pra separar o que é seguro cachear do que não é,
// cachear às cegas arrisca expor dado privado num cache compartilhado
// (ponto de parada explícito da Fase 5.2).
//
// MARKETING não precisa de nada aqui: na Fase 5.2, o Root Layout usava
// `headers()`, forçando toda a árvore dinâmica e fazendo o Next
// sobrescrever qualquer Cache-Control setado no Middleware (confirmado em
// produção). Na Fase 5.3, Etapa 2, o Root Layout parou de usar API
// dinâmica nenhuma — a página institucional (`export const revalidate =
// 60`) agora é gerada estaticamente/revalidada pelo próprio Next, que
// define o Cache-Control correto sozinho. Setar algo aqui só arriscaria
// competir com o que o Next já acerta.
function withSurfaceHeaders(response: NextResponse, surface: "PLATFORM" | "MARKETING" | null): NextResponse {
  if (surface === "PLATFORM") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

// Fase 5.1, Etapa 3/10: domínio apex institucional sem "www" sempre vira o
// canônico com www — 308 de verdade fica a cargo do redirect nativo da
// Vercel (Domains → nokta.live → Redirect to www.nokta.live), que roda no
// edge da Vercel ANTES de qualquer função rodar. Isto aqui é só rede de
// segurança pro caso de a requisição chegar até o Next.js sem passar por
// aquele redirect (ex.: domínio ainda não configurado assim) — por isso usa
// o MESMO mecanismo seguro de crossOriginRedirect (não um NextResponse.
// redirect de verdade), já provado imune ao bug de Location entre hosts.
const BARE_MARKETING_HOSTNAME = "nokta.live";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname;

  if (hostname.toLowerCase() === BARE_MARKETING_HOSTNAME) {
    return crossOriginRedirect(CANONICAL_SURFACE_URLS["MARKETING"], path, request.nextUrl.search);
  }
  // Fase 5: o cookie de sessão real (nokta_session) é host-only da API
  // (api.nokta.live / api.noktatickets.com.br) — o middleware roda no host
  // do FRONTEND (app.nokta.live / noktatickets.com.br), um host diferente,
  // então esse cookie nunca chega aqui (por design, não é bug de scope).
  // `rawSessionCookie` só existe pra quando, por algum motivo, os dois
  // coincidirem (nunca em produção) — best-effort, nunca a fonte principal
  // de "está autenticado". O sinal real é o cookie "user": não sensível,
  // gravado pelo próprio JS da página no signIn(), sempre na MESMA origem
  // que está servindo a página, e por isso sempre visível aqui. A
  // autorização de verdade continua sendo decidida pela API (cada request
  // carrega o cookie real pro host certo) — o middleware só decide rota.
  const rawSessionCookie = request.cookies.get("nokta_session")?.value;
  const userCookieRaw = request.cookies.get("user")?.value;
  const authToken = userCookieRaw;
  const userPayload = JSON.parse(userCookieRaw || "{}");
  // Fase 5.2, Etapa 5 — cache por superfície (ver withSurfaceHeaders). Só
  // PLATFORM tem política explícita aqui (MARKETING resolve sozinho via
  // ISR na própria página — Fase 5.3, Etapa 4; TICKETS_PUBLIC fica de fora
  // de propósito, ver comentário em withSurfaceHeaders).
  const enforcedSurface = isSurfaceEnforced(hostname) ? resolveSurfaceFromHost(hostname) : null;
  const currentSurfaceForHeaders: "PLATFORM" | "MARKETING" | null =
    enforcedSurface === "PLATFORM" || enforcedSurface === "MARKETING" ? enforcedSurface : null;

  // ── Fase 5, Etapa 3: separação de rotas por host ──────────────────────
  // Roda ANTES de qualquer lógica de auth — troca de host é sempre a
  // primeira decisão. Preserva path + query string (deep link) e nunca usa
  // um host arbitrário como destino, só os dois definidos centralmente em
  // lib/surfaces.ts.
  if (isSurfaceEnforced(hostname)) {
    const surface = resolveSurfaceFromHost(hostname);

    // Fase 5.1: MARKETING nunca hospeda rota exclusiva de PLATFORM nem de
    // TICKETS_PUBLIC — cruza pra fora igual às duas superfícies operacionais
    // já faziam entre si (mesma função, mesmo destino central).
    if (surface !== "PLATFORM" && matchesAnyPrefix(path, PLATFORM_ONLY_PREFIXES)) {
      return crossOriginRedirect(CANONICAL_SURFACE_URLS["PLATFORM"], path, request.nextUrl.search);
    }

    if (surface !== "TICKETS_PUBLIC" && matchesAnyPrefix(path, TICKETS_ONLY_PREFIXES)) {
      return crossOriginRedirect(CANONICAL_SURFACE_URLS["TICKETS_PUBLIC"], path, request.nextUrl.search);
    }

    // Raiz do domínio da plataforma não é a home pública — decide entre
    // login e a Início unificada, nunca renderiza a home de descoberta de
    // eventos em app.nokta.live (Etapa 14).
    if (surface === "PLATFORM" && path === "/") {
      const target = request.nextUrl.clone();
      target.pathname = authToken ? getSurfaceConfig("PLATFORM").defaultPath : "/login";
      return NextResponse.redirect(target);
    }

    // Raiz do domínio institucional é a landing page — rewrite interno
    // (URL visível continua "/"), não redirect: é conteúdo, não troca de
    // host. A LP não depende de autenticação (Etapa 7), por isso resolve
    // aqui, antes de qualquer checagem de auth abaixo.
    if (surface === "MARKETING" && path === "/") {
      const target = request.nextUrl.clone();
      target.pathname = "/institucional";
      return NextResponse.rewrite(target);
    }
  }

  const publicRoute = publicRoutes.find((route) =>
    matchDynamicRoute(path, route.path)
  );

  // Invalid Token - clear and redirect (best-effort: só dispara nos casos
  // raros em que o cookie de sessão real é visível aqui — ver comentário
  // acima; a expiração de verdade é sempre pega pela API, 401 + interceptor
  // do axios já limpam o cookie "user" e mandam pro login).
  if (rawSessionCookie && !isValidToken(rawSessionCookie)) {
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
    const isAuthOnlyUnauthenticated = onboardingRoutes.some((r) => path.startsWith(r));
    if (isAuthOnlyUnauthenticated) {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("ctx", "produtor");
    } else {
      redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE;
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (!authToken && publicRoute) return withSurfaceHeaders(NextResponse.next(), currentSurfaceForHeaders);

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
      redirectUrl.pathname = hasProdutorRole(userPayload) ? "/dashboard/eventos" : "/dashboard/eventos/onboarding";
    } else if (isSurfaceEnforced(hostname) && resolveSurfaceFromHost(hostname) === "PLATFORM") {
      redirectUrl.pathname = getSurfaceConfig("PLATFORM").defaultPath;
    } else {
      redirectUrl.pathname = "/";
    }

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

  return withSurfaceHeaders(NextResponse.next(), currentSurfaceForHeaders);
}

export const config: MiddlewareConfig = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.gif|.*\\.css|.*\\.js|.*\\.ico|.*\\.ttf|.*\\.TTF|.*\\.woff|.*\\.woff2|.*\\.mp4|.*\\.mp3).*)",
  ],
};
