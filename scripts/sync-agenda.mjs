/**
 * Baixa os próximos eventos do Ticketmaster no Brasil e grava um retrato em
 * src/content/agenda/ticketmaster-snapshot.json. O site usa esse arquivo
 * quando o servidor não tem TICKETMASTER_API_KEY (ex.: enquanto a chave não
 * está na Vercel). A chave fica só na máquina de quem roda o script.
 *
 * Uso (na raiz do nokta-frontend):
 *   node scripts/sync-agenda.mjs            # lê a chave do .env.local
 *   node scripts/sync-agenda.mjs --push     # e já faz commit + push na main
 *
 * Rode com frequência (o ideal é todo dia): evento que passou some sozinho
 * da agenda, mas preço, status e eventos novos só mudam com um retrato novo.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src/content/agenda/ticketmaster-snapshot.json");

function readKey() {
  if (process.env.TICKETMASTER_API_KEY) return process.env.TICKETMASTER_API_KEY;
  const envFile = join(root, ".env.local");
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("TICKETMASTER_API_KEY="));
    if (line) return line.slice("TICKETMASTER_API_KEY=".length).trim();
  }
  return null;
}

const key = readKey();
if (!key) {
  console.error("Sem TICKETMASTER_API_KEY (variável de ambiente ou .env.local).");
  process.exit(1);
}

/** Só os campos que o mapeamento usa (src/lib/agenda/ticketmaster.ts). */
function slim(e) {
  const images = (e.images ?? []).filter((i) => i.ratio === "16_9").map(({ url, ratio, width }) => ({ url, ratio, width }));
  const venue = e._embedded?.venues?.[0];
  return {
    id: e.id,
    name: e.name,
    url: e.url,
    images: images.length ? images : (e.images ?? []).slice(0, 1).map(({ url, ratio, width }) => ({ url, ratio, width })),
    dates: { start: { localDate: e.dates?.start?.localDate, localTime: e.dates?.start?.localTime }, status: { code: e.dates?.status?.code } },
    priceRanges: e.priceRanges,
    classifications: e.classifications?.slice(0, 1).map((c) => ({ genre: c.genre ? { name: c.genre.name } : undefined, segment: c.segment ? { name: c.segment.name } : undefined })),
    _embedded: venue ? { venues: [{ name: venue.name, city: venue.city, state: venue.state ? { stateCode: venue.state.stateCode } : undefined, address: venue.address ? { line1: venue.address.line1 } : undefined }] } : undefined,
  };
}

const events = [];
const start = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
for (let page = 0; page < 5; page++) {
  const params = new URLSearchParams({ apikey: key, countryCode: "BR", locale: "*", sort: "date,asc", size: "200", page: String(page), startDateTime: start });
  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
  if (!res.ok) {
    console.error(`Ticketmaster respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const json = await res.json();
  events.push(...(json._embedded?.events ?? []).filter((e) => e.dates?.status?.code !== "cancelled").map(slim));
  if (page + 1 >= (json.page?.totalPages ?? 1)) break;
  await new Promise((r) => setTimeout(r, 250)); // limite de 5 req/s
}

writeFileSync(out, `${JSON.stringify({ fetchedAt: new Date().toISOString(), events }, null, 1)}\n`);
console.log(`${events.length} eventos gravados em ${out}`);

if (process.argv.includes("--push")) {
  const git = (...a) => execFileSync("git", a, { cwd: root, stdio: "inherit" });
  git("add", out);
  try {
    git("commit", "-m", `chore(agenda): atualiza retrato do Ticketmaster (${events.length} eventos)`);
  } catch {
    console.log("Nada mudou desde o último retrato.");
    process.exit(0);
  }
  git("push", "origin", "HEAD:main");
}
