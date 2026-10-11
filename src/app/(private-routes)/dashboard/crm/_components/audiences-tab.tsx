"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmApi, crmKeys, type CrmFilterOptions, type CrmFilters, type CrmSegment } from "@/services/crm";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { PRESSABLE, SURFACE } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, ChannelIcon, LINK, describeFilters, num } from "./crm-ui";

const TH = "px-5 py-3 font-semibold";
const NUM = "px-5 py-4 text-right font-poppins tabular-nums";

/** Públicos salvos: regras que se recalculam sozinhas. */
export function AudiencesTab({
  orgId,
  segments,
  loading,
  options,
  onOpen,
  onNew,
  canManage,
}: {
  orgId: number;
  segments?: CrmSegment[];
  loading: boolean;
  options?: CrmFilterOptions;
  onOpen: (filters: CrmFilters) => void;
  onNew: () => void;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<number | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => crmApi.removeSegment(orgId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.segments(orgId) });
      setConfirming(null);
      toast.success("Público apagado. Os contatos continuam na sua lista.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível apagar o público.")),
  });

  if (loading && !segments) {
    return (
      <div className={cn(SURFACE, "space-y-3 p-5")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <BlockSkeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <div className={cn(SURFACE, "px-6 py-14 text-center")}>
        <p className="mx-auto max-w-[46ch] text-[15px] font-semibold text-[#1c1a24]">Um público é um recorte da sua lista que você guarda para usar de novo.</p>
        <p className="mx-auto mt-2 max-w-[60ch] text-[14px] leading-relaxed text-[#5f5c6b]">
          Filtre os contatos por evento, presença ou tempo sem comprar e toque em &quot;Salvar como público&quot;. Ele se atualiza sozinho: quem passar a se encaixar entra, quem pedir para sair deixa de contar.
        </p>
        <button type="button" onClick={onNew} className={cn(BTN_PRIMARY, "mt-5", !canManage && "hidden", PRESSABLE)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Montar um público
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[80ch] text-[14px] leading-relaxed text-[#5f5c6b]">Cada público guarda as regras, não as pessoas. Os números abaixo são de agora.</p>
        <button type="button" onClick={onNew} className={cn(BTN_PRIMARY, "shrink-0", !canManage && "hidden", PRESSABLE)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Novo público
        </button>
      </div>

      <div className={cn(SURFACE, "overflow-hidden")}>
        <table className="hidden w-full text-left text-[14px] lg:table">
          <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
            <tr className="border-b border-[#ebe8f2]">
              <th scope="col" className={cn(TH, "w-[30%]")}>Público</th>
              <th scope="col" className={TH}>Regras</th>
              <th scope="col" className={cn(TH, "text-right")}>Pessoas</th>
              <th scope="col" className={cn(TH, "text-right")}>
                <span className="inline-flex items-center gap-1.5"><ChannelIcon channel="EMAIL" /> E-mail</span>
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                <span className="inline-flex items-center gap-1.5"><ChannelIcon channel="WHATSAPP" /> WhatsApp</span>
              </th>
              <th scope="col" className={cn(TH, "w-[220px]")}><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f0f7]">
            {segments.map((s) => (
              <tr key={s.id} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => onOpen(s.filters)}>
                <td className="px-5 py-4">
                  <span className="block font-medium text-[#1c1a24]">{s.name}</span>
                  {s.description ? <span className="block text-[13px] text-[#6b6878]">{s.description}</span> : null}
                </td>
                <td className="px-5 py-4 text-[13.5px] text-[#3a3746]">{describeFilters(s.filters, options).join(" · ") || "Toda a lista"}</td>
                <td className={cn(NUM, "text-[16px] font-semibold")}>{num(s.counts.total)}</td>
                <td className={NUM}>{num(s.counts.emailEligible)}</td>
                <td className={NUM}>{num(s.counts.whatsappEligible)}</td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  {confirming === s.id ? (
                    <span className="flex items-center justify-end gap-3 text-[13px]">
                      <span className="text-[#3a3746]">Apagar?</span>
                      <button type="button" onClick={() => setConfirming(null)} className={cn(LINK, "text-[#5f5c6b]", PRESSABLE)}>
                        Voltar
                      </button>
                      <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(s.id)} className={cn(LINK, "flex items-center gap-1 text-[#9b1c35] hover:text-[#7f1529]", PRESSABLE)}>
                        {remove.isPending ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
                        Apagar
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => onOpen(s.filters)} className={cn(LINK, PRESSABLE)}>
                        Ver contatos
                      </button>
                      <button type="button" aria-label={`Apagar público ${s.name}`} onClick={() => setConfirming(s.id)} className={cn(!canManage && "hidden", "flex h-9 w-9 items-center justify-center rounded-lg text-[#5b5868] outline-none hover:bg-[#f3f1f8] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
                        <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="divide-y divide-[#f2f0f7] lg:hidden">
          {segments.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onOpen(s.filters)} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf8ff]">
                <span className="min-w-0">
                  <span className="block font-medium">{s.name}</span>
                  <span className="mt-0.5 block text-[13px] text-[#5f5c6b]">{describeFilters(s.filters, options).join(" · ")}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-poppins text-[16px] font-semibold tabular-nums">{num(s.counts.total)}</span>
                  <span className="block font-poppins text-[12.5px] tabular-nums text-[#6b6878]">
                    {num(s.counts.emailEligible)} e-mail · {num(s.counts.whatsappEligible)} WhatsApp
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
