import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
