// Gera pôsteres SVG fictícios em public/mock/posters/ pro modo de API mock
// (NEXT_PUBLIC_MOCK_API=1). Nunca usado em produção.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "public", "mock", "posters");
mkdirSync(out, { recursive: true });

const posters = [
  { file: "baile-neon", title: "BAILE\nNEON", sub: "ALL NIGHT LONG", a: "#ff3db5", b: "#5b21b6", c: "#0f0f11" },
  { file: "sunset-sessions", title: "SUNSET\nSESSIONS", sub: "OPEN AIR", a: "#fb923c", b: "#e11d48", c: "#1f0a14" },
  { file: "virada-tropical", title: "VIRADA\nTROPICAL", sub: "RÉVEILLON", a: "#22d3ee", b: "#a3e635", c: "#052e16" },
  { file: "pagode-do-cais", title: "PAGODE\nDO CAIS", sub: "SÁBADO", a: "#facc15", b: "#ef4444", c: "#1c1917" },
  { file: "techno-bunker", title: "TECHNO\nBUNKER", sub: "AFTER", a: "#a3a3a3", b: "#171717", c: "#000000" },
  { file: "forro-na-praca", title: "FORRÓ\nNA PRAÇA", sub: "SÃO JOÃO", a: "#f97316", b: "#fde047", c: "#431407" },
  { file: "garden-party", title: "GARDEN\nPARTY", sub: "OPEN BAR", a: "#86efac", b: "#ec4899", c: "#14532d" },
  { file: "noite-do-vinil", title: "NOITE\nDO VINIL", sub: "DISCO & FUNK", a: "#c084fc", b: "#fb7185", c: "#1e1b4b" },
  { file: "bloco-da-madrugada", title: "BLOCO DA\nMADRUGADA", sub: "CARNAVAL", a: "#fde047", b: "#22c55e", c: "#172554" },
  { file: "rooftop-live", title: "ROOFTOP\nLIVE", sub: "SESSIONS", a: "#60a5fa", b: "#f472b6", c: "#0c0a09" },
  { file: "festival-horizonte", title: "FESTIVAL\nHORIZONTE", sub: "3 DIAS", a: "#f43f5e", b: "#8b5cf6", c: "#09090b" },
  { file: "samba-de-raiz", title: "SAMBA\nDE RAIZ", sub: "RODA", a: "#fbbf24", b: "#dc2626", c: "#450a0a" },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

for (const p of posters) {
  const lines = p.title.split("\n");
  const text = lines
    .map((l, i) => `<text x="60" y="${640 + i * 150}" font-family="Impact, 'Anton', 'Arial Black', sans-serif" font-size="150" fill="#fff" letter-spacing="2">${esc(l)}</text>`)
    .join("");
  // Mesma proporção do banner real que o produtor recorta (818×355).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1636" height="710" viewBox="0 0 1636 710">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.a}"/><stop offset="0.55" stop-color="${p.b}"/><stop offset="1" stop-color="${p.c}"/></linearGradient>
  <radialGradient id="r" cx="0.8" cy="0.2" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.18 0"/></filter>
</defs>
<rect width="1636" height="710" fill="url(#g)"/>
<circle cx="1300" cy="180" r="300" fill="url(#r)"/>
<circle cx="260" cy="640" r="360" fill="${p.a}" opacity="0.25"/>
<rect width="1636" height="710" filter="url(#n)"/>
<text x="70" y="120" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff" opacity="0.9" letter-spacing="8">${esc(p.sub)}</text>
${lines.map((l, i) => `<text x="70" y="${330 + i * 170}" font-family="Impact, 'Anton', 'Arial Black', sans-serif" font-size="170" fill="#fff" letter-spacing="2">${esc(l)}</text>`).join("")}
<rect x="1100" y="600" width="466" height="4" fill="#fff" opacity="0.6"/>
<text x="1100" y="660" font-family="Arial, sans-serif" font-size="30" fill="#fff" opacity="0.85" letter-spacing="4">NOKTA · INGRESSOS</text>
</svg>`;
  writeFileSync(join(out, `${p.file}.svg`), svg);
}
console.log(`ok: ${posters.length} posters em public/mock/posters`);
