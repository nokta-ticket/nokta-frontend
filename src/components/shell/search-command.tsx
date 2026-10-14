"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import Image from "next/image";
import api from "@/lib/axios";
import type { EventoAPI, GetEvents } from "@/interfaces/events";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDebouncedValue } from "@/components/ui/search-input";
import { cn } from "@/lib/cn";
import { cityLabel, formatEventDate } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { useAuth } from "@/context/AuthContext";

const QUICK_LINKS: { label: string; href: string; icon: IconName; auth?: boolean }[] = [
  { label: "Todos os eventos", href: "/eventos", icon: "party" },
  { label: "Revenda oficial", href: "/revenda", icon: "transfer" },
  { label: "Meus ingressos", href: "/meus-ingressos", icon: "ticket", auth: true },
  { label: "Favoritos", href: "/favoritos", icon: "heart", auth: true },
  { label: "Quero produzir um evento", href: "/para-produtores", icon: "bolt" },
];

/**
 * Paleta de busca (⌘K / Ctrl+K). Procura eventos ao vivo enquanto digita
 * e dá atalhos pras áreas principais. No celular ocupa a tela toda.
 */
export function SearchCommand({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const [results, setResults] = useState<EventoAPI[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    if (!q) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<GetEvents>("/eventos", { params: { name: q, page: 1 } })
      .then((res) => {
        if (!cancelled) setResults(res.data.data.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" showCloseButton={false} className="gap-0 p-0 max-sm:inset-0 max-sm:max-h-dvh max-sm:rounded-none sm:top-[10vh] sm:max-h-[70vh] sm:translate-y-0 sm:data-[state=open]:slide-in-from-top-2">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <Command shouldFilter={false} loop className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 sm:px-5">
            <Icon name="search" size={16} className="shrink-0 text-subtle-foreground" />
            <Command.Input value={query} onValueChange={setQuery} autoFocus placeholder="Busque por festa, lugar ou cidade…" className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-subtle-foreground sm:h-16" />
            {loading ? <Icon name="loader" size={14} className="animate-spin text-subtle-foreground" /> : null}
            <button type="button" onClick={() => onOpenChange(false)} className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground sm:hidden" aria-label="Fechar">
              <Icon name="close" size={16} />
            </button>
            <kbd className="hidden rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-micro font-medium text-subtle-foreground sm:block">esc</kbd>
          </div>

          <Command.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
            {results === null ? (
              <Command.Group heading="Atalhos" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-subtle-foreground">
                {QUICK_LINKS.filter((l) => !l.auth || isAuthenticated).map((l) => (
                  <Command.Item key={l.href} value={l.href} onSelect={() => go(l.href)} className={itemClass}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
                      <Icon name={l.icon} size={14} />
                    </span>
                    <span className="flex-1 text-sm font-medium">{l.label}</span>
                    <Icon name="arrow-right" size={12} className="text-subtle-foreground opacity-0 transition-opacity [[data-selected=true]_&]:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            ) : results.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">Nenhum rolê com esse nome</p>
                <p className="mt-1 text-caption text-muted-foreground">Tenta outro nome, cidade ou casa.</p>
              </div>
            ) : (
              <Command.Group heading="Eventos" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-subtle-foreground">
                {results.map((e) => (
                  <Command.Item key={e.id} value={`${e.id}`} onSelect={() => go(`/evento/${e.slug ?? e.id}`)} className={itemClass}>
                    <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      <Image src={resolveThumbnailUrl(e.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK} alt="" fill sizes="64px" className="object-cover" unoptimized />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{e.nome}</span>
                      <span className="block truncate text-caption text-muted-foreground">
                        <span className="text-brand">{formatEventDate(e.data)}</span> · {e.local || cityLabel(e.endereco)}
                      </span>
                    </span>
                    <Icon name="arrow-right" size={12} className="text-subtle-foreground opacity-0 transition-opacity [[data-selected=true]_&]:opacity-100" />
                  </Command.Item>
                ))}
                <Command.Item value="__all" onSelect={() => go(`/eventos?name=${encodeURIComponent(query.trim())}`)} className={cn(itemClass, "mt-1 justify-center text-brand")}>
                  <span className="text-sm font-semibold">Ver todos os resultados</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          <div className="hidden items-center gap-4 border-t border-border px-5 py-2.5 text-micro text-subtle-foreground sm:flex">
            <span className="flex items-center gap-1">
              <kbd className={kbdClass}>↑</kbd>
              <kbd className={kbdClass}>↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className={kbdClass}>↵</kbd> abrir
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const itemClass = "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-foreground outline-none transition-colors data-[selected=true]:bg-surface-2";
const kbdClass = "rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-medium";
