import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Rota SÓ de desenvolvimento (existe apenas com NEXT_PUBLIC_MOCK_API=1):
 * grava o cookie `user` — o sinal de sessão que o middleware lê — e
 * redireciona pra `?to=`. Vive em /api/dev (não /__dev: pasta com "_" inicial é privada no App Router) porque o matcher do middleware
 * ignora esse prefixo; em /__dev/login o próprio middleware mandaria o
 * visitante deslogado pra home antes de a rota rodar.
 *
 *   /api/dev/login?to=/dashboard/inicio            sessão de produtor
 *   &theme=light|dark                                 força o tema (via ?__theme=, lido só em dev)
 *   &role=COMUM                                       conta sem organização (onboarding do zero)
 *   &venue=0|1                                        liga/desliga o módulo Venue da org fictícia
 *   &onboardingStep=1|2|3                             retoma o onboarding nessa etapa (localStorage)
 */
export function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const toRaw = params.get("to") ?? "/dashboard/inicio";
  const to = toRaw.startsWith("/") && !toRaw.startsWith("//") && !toRaw.includes("://") ? toRaw : "/dashboard/inicio";
  const theme = params.get("theme");
  const role = params.get("role") === "COMUM" ? "COMUM" : "PRODUTOR";
  const venue = params.get("venue");
  const onboardingStep = Number(params.get("onboardingStep"));

  const target = request.nextUrl.clone();
  const [path, query] = to.split("?");
  target.pathname = path;
  target.search = query ? `?${query}` : "";
  if (theme === "light" || theme === "dark") target.searchParams.set("__theme", theme);

  const cookieOptions = { path: "/", httpOnly: false, sameSite: "lax" as const };
  const userCookie = JSON.stringify({ userId: 1, role, nivelProdutor: role === "PRODUTOR" ? 2 : null });

  // Retomar o onboarding numa etapa exige progresso salvo no localStorage
  // (ver dashboard/onboarding/page.tsx) — só uma página com script consegue
  // gravar isso, então nesse caso a resposta é um HTML mínimo que grava e
  // navega, em vez de um redirect HTTP.
  if (Number.isInteger(onboardingStep) && onboardingStep >= 1 && onboardingStep <= 3) {
    const progress = JSON.stringify({
      createdOrgId: 1,
      step: onboardingStep,
      skippedIdentification: false,
      selection: { selectedGroupKeys: ["EVENTS_TICKETING", "MANAGEMENT"], deselectedCapabilityKeysByGroup: {} },
    });
    const location = JSON.stringify(`${target.pathname}${target.search}`).replace(/</g, "\\u003C");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>try{localStorage.setItem("nokta_onboarding_progress_1",${JSON.stringify(progress).replace(/</g, "\\u003C")});}catch(e){}location.replace(${location});</script></head><body></body></html>`;
    const res = new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    res.cookies.set("user", userCookie, cookieOptions);
    if (venue === "0" || venue === "1") res.cookies.set("nokta_mock_venue", venue, cookieOptions);
    return res;
  }

  const res = NextResponse.redirect(target);
  res.cookies.set("user", userCookie, cookieOptions);
  if (venue === "0" || venue === "1") res.cookies.set("nokta_mock_venue", venue, cookieOptions);
  return res;
}
