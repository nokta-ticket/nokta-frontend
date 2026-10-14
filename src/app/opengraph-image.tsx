import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Imagem padrão de compartilhamento (DEFAULT_OG_IMAGE em lib/seo/site.ts):
 * fundo escuro, brilho rosa da marca, logotipo e uma linha de tagline.
 * Estática (gerada no build); páginas com arte própria (evento) sobrescrevem
 * via `buildMetadata({ image })`.
 */
export const alt = "Nokta — ingressos, eventos e gestão para quem faz a noite acontecer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#ff3db5";
const BRAND_LIGHT = "#ff6fcf";
const BRAND_DEEP = "#e5179c";
const BG = "#0f0f11";

async function logoDataUri(): Promise<string | null> {
  try {
    const svg = await readFile(join(process.cwd(), "public/brand/nokta-logotype.svg"), "utf8");
    return `data:image/svg+xml;base64,${Buffer.from(svg.replace(/currentColor/g, "#ffffff")).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const logo = await logoDataUri();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: BG, position: "relative", fontFamily: "sans-serif" }}>
        {/* brilhos da marca */}
        <div style={{ position: "absolute", top: -260, right: -180, width: 760, height: 760, borderRadius: 9999, background: `radial-gradient(circle, ${BRAND}88 0%, ${BRAND_DEEP}33 45%, transparent 70%)`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -320, left: -220, width: 700, height: 700, borderRadius: 9999, background: `radial-gradient(circle, ${BRAND_DEEP}55 0%, transparent 65%)`, display: "flex" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_DEEP})`, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) só aceita <img>
            <img src={logo} alt="" width={391} height={142} />
          ) : (
            <div style={{ fontSize: 140, fontWeight: 800, color: "#ffffff", letterSpacing: -6 }}>Nokta</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.08, color: "#ffffff", letterSpacing: -2, maxWidth: 960 }}>
            A noite acontece aqui.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#b9b9c2", maxWidth: 940, lineHeight: 1.35 }}>Ingressos, lista VIP, promoters e bar numa plataforma só.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 9999, background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_DEEP})`, color: "#16020f", fontSize: 24, fontWeight: 700 }}>noktatickets.com.br</div>
            <div style={{ display: "flex", padding: "10px 22px", borderRadius: 9999, border: "2px solid #ffffff33", color: "#ffffff", fontSize: 24, fontWeight: 600 }}>nokta.live</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
