import {
  type NextRequest,
  type MiddlewareConfig,
  NextResponse,
} from "next/server";
import { UserPayload } from "./context/AuthContext";

const publicRoutes = [
  { path: "/login", whenAutenticated: "redirect" },
  { path: "/admin/login", whenAutenticated: "redirect" },
  { path: "/recuperar-senha", whenAutenticated: "next" },
  { path: "/recuperar-senha/[id]", whenAutenticated: "next" },
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
  "/admin/seguranca",
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

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const publicRoute = publicRoutes.find((route) =>
    matchDynamicRoute(path, route.path)
  );

  const authToken = request.cookies.get("token")?.value;
  const userPayload = JSON.parse(request.cookies.get("user")?.value || "{}");

  // Invalid Token - clear and redirect
  if (authToken && !isValidToken(authToken)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("token");
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

  if (!authToken && publicRoute) return NextResponse.next();

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

    const ctx = request.nextUrl.searchParams.get("ctx");
    if (ctx === "produtor") {
      if (hasProdutorRole(userPayload)) {
        redirectUrl.pathname = "/produtor/eventos";
      } else {
        redirectUrl.pathname = "/produtor/onboarding";
      }
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
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.gif|.*\\.css|.*\\.js|.*\\.ico|.*\\.ttf|.*\\.TTF|.*\\.woff|.*\\.woff2|.*\\.mp4|.*\\.mp3).*)",
  ],
};
