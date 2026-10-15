"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Checkbox } from "@/components/ui/checkbox";

/** Mesmo texto gravado como prova no backend (PROMO_WHATSAPP_CONSENT_TEXT). */
export const PROMO_WHATSAPP_CONSENT_TEXT = "Quero receber novidades de eventos da Nokta Tickets pelo WhatsApp.";

interface PromoInfo {
  available: boolean;
  displayPhone: string | null;
}

let cached: Promise<PromoInfo | null> | null = null;

/** De qual número vêm as novidades. Uma busca por carregamento de página. */
function loadPromoInfo(): Promise<PromoInfo | null> {
  if (!cached) {
    cached = api
      .get<PromoInfo>("/divulgacao/whatsapp")
      .then((r) => r.data)
      .catch(() => {
        cached = null;
        return null;
      });
  }
  return cached;
}

export function usePromoWhatsappPhone(): string | null {
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPromoInfo().then((info) => {
      if (alive) setPhone(info?.available ? info.displayPhone : null);
    });
    return () => {
      alive = false;
    };
  }, []);
  return phone;
}

interface PromoWhatsappConsentProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Autorização para a divulgação da própria Nokta Tickets. Sempre desmarcada
 * por padrão: autorização pré-marcada não vale. Nunca afeta os ingressos,
 * que chegam por outro número.
 */
export function PromoWhatsappConsent({ id, checked, onCheckedChange, disabled, className }: PromoWhatsappConsentProps) {
  const phone = usePromoWhatsappPhone();
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} disabled={disabled} className="mt-0.5" />
        <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-muted-foreground">
          {PROMO_WHATSAPP_CONSENT_TEXT}
          <span className="mt-0.5 block text-caption text-subtle-foreground">
            {phone ? `As novidades chegam pelo número ${phone}. ` : ""}Você pode sair quando quiser. Seus ingressos não dependem disso.
          </span>
        </label>
      </div>
    </div>
  );
}
