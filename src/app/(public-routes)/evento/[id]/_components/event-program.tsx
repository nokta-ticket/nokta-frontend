import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type ProgramItem = {
  time: string;
  title: string;
  subtitle?: string;
  type: "opening" | "warmup" | "artist" | "headliner" | "closing";
};

const TYPE_LABEL: Record<ProgramItem["type"], string> = { opening: "Abertura", warmup: "Warm-up", artist: "Atração", headliner: "Headliner", closing: "Encerramento" };

/**
 * Converte o texto livre da programação ("22:00 — Fulano — Headliner") em
 * itens. Aceita "HH:MM - título", "título - rótulo" e "rótulo - título";
 * sem rótulo explícito, adivinha pelo texto.
 */
export function parseProgramacao(raw: string): ProgramItem[] {
  if (!raw.trim()) return [];
  const LABELS_RE = /Abertura|Warm[- ]?up|Atração|Atracao|Headliner|Encerramento/i;

  function labelToType(s: string): ProgramItem["type"] {
    const t = s.toLowerCase().replace(/[-\s]/g, "");
    if (t.includes("headliner")) return "headliner";
    if (t.includes("warmup")) return "warmup";
    if (t.includes("abertura")) return "opening";
    if (t.includes("encerramento")) return "closing";
    return "artist";
  }

  function autoType(text: string): ProgramItem["type"] {
    const t = text.toLowerCase();
    if (t.includes("headliner")) return "headliner";
    if (t.includes("warm")) return "warmup";
    if (t.includes("abertura") || t.includes("portão") || t.includes("portao")) return "opening";
    if (t.includes("encerramento")) return "closing";
    return "artist";
  }

  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[—–-]*\s*/);
      const time = timeMatch ? timeMatch[1] : "";
      const rest = timeMatch ? line.slice(timeMatch[0].length).trim() : line;

      const endMatch = rest.match(/^(.+?)\s*[—–-]+\s*([^—–-]+)$/);
      if (endMatch && LABELS_RE.test(endMatch[2].trim())) {
        return { time, title: endMatch[1].trim(), subtitle: endMatch[2].trim(), type: labelToType(endMatch[2].trim()) };
      }

      const startMatch = rest.match(/^([^—–-]+?)\s*[—–-]+\s*(.+)$/);
      if (startMatch && LABELS_RE.test(startMatch[1].trim())) {
        return { time, title: startMatch[2].trim(), subtitle: startMatch[1].trim(), type: labelToType(startMatch[1].trim()) };
      }

      return { time, title: rest, type: autoType(rest) };
    });
}

/** Linha do tempo vertical da programação: hora em rosa, atração, rótulo discreto. */
export function EventProgram({ items }: { items: ProgramItem[] }) {
  if (items.length === 0) {
    return <EmptyState compact icon="music" title="Programação em breve" description="O line-up completo aparece aqui assim que o produtor divulgar." />;
  }

  return (
    <div>
      <ol className="relative">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const head = item.type === "headliner";
          return (
            <li key={`${item.time}-${item.title}-${i}`} className="relative flex gap-4">
              <div className="flex w-5 shrink-0 flex-col items-center">
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-background", head ? "pulse-ring bg-brand" : item.type === "opening" || item.type === "closing" ? "bg-border-strong" : "bg-foreground/70")} aria-hidden />
                {!last ? <span className="my-1 w-px flex-1 bg-border-strong" aria-hidden /> : null}
              </div>
              <div className={cn("min-w-0 flex-1", !last && "pb-6")}>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  {item.time ? <span className="text-sm font-bold text-brand tnum">{item.time}</span> : null}
                  <span className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">{TYPE_LABEL[item.type]}</span>
                </div>
                <p className={cn("mt-0.5 leading-snug text-foreground", head ? "text-lg font-bold" : "text-[15px] font-semibold")}>{item.title}</p>
                {item.subtitle && item.subtitle.toLowerCase() !== TYPE_LABEL[item.type].toLowerCase() ? <p className="mt-0.5 text-caption text-muted-foreground">{item.subtitle}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 flex items-center gap-1.5 text-caption text-subtle-foreground">
        <Icon name="clock" size={11} />
        Horários podem mudar. Fica de olho nas redes do evento.
      </p>
    </div>
  );
}
