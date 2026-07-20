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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://3ds-nx-js.stone.com.br",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.nokta.live https://api.noktatickets.com.br https://*.supabase.co https://api.pagar.me https://3ds-nx-js.stone.com.br http://localhost:3333",
  "frame-src https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    /** 2 opções: --------------------------------------------- */
    /* a) simples (array domains) ----------------------------- */
    // domains: ['duuodcmtiswepnvwifxj.supabase.co'],

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
        hostname: "duuodcmtiswepnvwifxj.supabase.co",
        pathname: "/storage/v1/object/public/**", // <= caminho do bucket
      },
    ],
  },
};

export default nextConfig;
