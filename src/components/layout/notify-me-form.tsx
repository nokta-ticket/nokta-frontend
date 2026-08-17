"use client";

import { useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

/**
 * Botão "Quero ser avisado quando tiver" do estado vazio da home
 * (empty-events-state.tsx) — abre um campo de e-mail inline e submete pra
 * POST /event-notify/subscribe (público, sem auth). Client Component à
 * parte porque o resto de EmptyEventsState é Server Component.
 */
export default function NotifyMeForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.post("/event-notify/subscribe", { email });
      setSubmitted(true);
      toast.success("Prontinho! Vamos te avisar quando novos eventos forem publicados.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar seu e-mail. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 inline-flex h-[46px] items-center gap-[9px] rounded-xl bg-[#F4EBFE] px-[22px] font-[family-name:var(--font-bricolage)] text-sm font-semibold tracking-[-0.1px] text-[#7C3AED]">
        <Bell className="h-4 w-4 shrink-0" strokeWidth={2} />
        Você será avisado!
      </div>
    );
  }

  if (open) {
    return (
      <form
        onSubmit={handleSubmit}
        className="mt-8 flex h-[46px] w-full max-w-[302px] items-center gap-2 rounded-xl border border-[#D9C2F8] bg-white pl-4 pr-1.5 shadow-[0_8px_20px_-6px_rgba(124,58,237,0.12)]"
      >
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={submitting}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1E1B33] outline-none placeholder:text-[#9A9CAB]"
        />
        <button
          type="submit"
          disabled={submitting}
          aria-label="Enviar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED] text-white transition-colors duration-200 hover:bg-[#6D28D9] disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-8 inline-flex h-[46px] items-center gap-[9px] rounded-xl bg-[#7C3AED] px-[22px] font-[family-name:var(--font-bricolage)] text-sm font-semibold tracking-[-0.1px] text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.45)] transition-all duration-200 hover:-translate-y-px hover:bg-[#6D28D9] hover:shadow-[0_10px_24px_-6px_rgba(124,58,237,0.5)] active:translate-y-0"
    >
      <Bell className="h-4 w-4 shrink-0" strokeWidth={2} />
      Quero ser avisado quando tiver
    </button>
  );
}
