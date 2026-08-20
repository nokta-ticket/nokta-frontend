import type { NextConfig } from "next";

/**
 * Fase 5, Etapa 12 — CSP e headers de segurança. Uma política só (não dá
 * pra variar por host aqui — next.config roda no build, sem acesso à
 * requisição; ver src/middleware.ts pro X-Robots-Tag, que É por host).
 *
 * Deliberadamente conservador em script-src/frame-src: o checkout usa
 * tokenização direta na Pagar.me (api.pagar.me) e desafio 3DS2 da Stone
 * (3ds-nx-js.stone.com.br), cujo iframe de desafio redireciona pro ACS do
 * banco emissor — um domínio que varia por banco e não dá pra enumerar
 * com segurança. Travar frame-src arriscaria quebrar 3DS em produção sem
 * como testar com pagamento real (fora do escopo validar isso agora) — por
 * isso frame-src fica em https: (amplo, mas ainda bloqueia http/data/blob),
 * não uma allowlist estreita.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // static.cloudflareinsights.com: beacon injetado automaticamente pelo
  // Cloudflare nos domínios proxiados (Web Analytics) — não é algo que o
  // app carrega por escolha, mas bloquear via CSP só gera erro de console
  // sem nenhum ganho de segurança real (é o próprio Cloudflare na frente).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://3ds-nx-js.stone.com.br https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.nokta.live https://api.noktatickets.com.br https://*.supabase.co https://api.pagar.me https://3ds-nx-js.stone.com.br https://cloudflareinsights.com https://viacep.com.br http://localhost:3333",
  "frame-src https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// 2026-08-13: /cardapio-preview/* é carregada dentro de um <iframe> pela
// própria origem (MenuPreviewPhone, dashboard/cardapio) — precisa da mesma
// política de segurança de cima, só com `frame-ancestors 'self'` em vez de
// `'none'`, senão o navegador recusa o próprio iframe (mesmo sendo a mesma
// origem se embutindo). Isolado nesta rota só — o resto do site continua
// 'none' (protegido contra clickjacking de origem externa).
const PREVIEW_FRAME_CSP_DIRECTIVES = CSP_DIRECTIVES.replace("frame-ancestors 'none'", "frame-ancestors 'self'");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const previewFrameSecurityHeaders = [
  { key: "Content-Security-Policy", value: PREVIEW_FRAME_CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Nokta Access (check-in/scanner de QR) — única exceção de câmera do site.
// `@yudiel/react-qr-scanner` precisa de getUserMedia, bloqueado pela política
// global camera=() (nenhuma origem, nem self). Escopado só às rotas que
// usam a câmera; resto do site continua camera=().
const accessCameraSecurityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Path negativo (nunca casa /cardapio-preview/*, /dashboard/check-in/*
        // ou /dashboard/access/*, INCLUINDO /dashboard/access-pairing/* —
        // sem o limite de palavra `(?:/|$)`, "dashboard/access" também
        // prefixaria "dashboard/access-pairing", deixando essa rota sem
        // NENHUM dos dois conjuntos de headers) — garante que só UMA regra
        // de headers se aplica a cada rota, nunca duas concatenadas (o Next
        // não faz "last wins" entre regras diferentes que casam a mesma
        // URL; concatenar dois Content-Security-Policy/Permissions-Policy é
        // ambíguo e não é o que se quer aqui).
        source: "/:path((?!cardapio-preview|dashboard/check-in(?:/|$)|dashboard/access(?:/|$)|dashboard/access-pairing(?:/|$)).*)",
        headers: securityHeaders,
      },
      {
        source: "/cardapio-preview/:path*",
        headers: previewFrameSecurityHeaders,
      },
      {
        source: "/dashboard/check-in/:path*",
        headers: accessCameraSecurityHeaders,
      },
      {
        source: "/dashboard/access/:path*",
        headers: accessCameraSecurityHeaders,
      },
      {
        // access-pairing TAMBÉM usa câmera desde que a tela passou a aceitar
        // QR (código de pareamento e QR "Conectar a este Hub", commit
        // 3abb785) — mesma exceção camera=(self) do check-in. Já teve
        // securityHeaders (camera=()) aqui, o que bloqueava o leitor de QR
        // silenciosamente — não regredir.
        source: "/dashboard/access-pairing/:path*",
        headers: accessCameraSecurityHeaders,
      },
    ];
  },
  images: {
    /** 2 opções: --------------------------------------------- */
    /* a) simples (array domains) ----------------------------- */
    // domains: ['fhumkapdowazikhbxlfm.supabase.co'],

    /* b) mais restrito (remotePatterns) ---------------------- */
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3333",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3333",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api-nokta.bcdesenvolvimento.com",
        pathname: "/storage/**", // <= caminho do bucket
      },
      {
        protocol: "https",
        hostname: "fhumkapdowazikhbxlfm.supabase.co",
        pathname: "/storage/v1/object/public/**", // <= caminho do bucket
      },
      {
        // Fotos de produto/categoria de teste (scripts/seed-fervo-menu-produtos.mjs) —
        // banco de imagens livre, sem upload real.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
