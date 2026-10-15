"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { PromoWhatsappConsent } from "@/components/marketing/promo-whatsapp-consent";

type ConsentStatus = "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";

/**
 * Pergunta uma vez, no checkout, a quem nunca escolheu. Quem já autorizou
 * ou já recusou não vê nada (muda pelo perfil). Grava na hora em que marca.
 */
export function CheckoutPromoConsent() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get<{ whatsapp: ConsentStatus }>("/me/marketing-consent")
      .then(({ data }) => {
        if (alive && data.whatsapp === "UNKNOWN") setVisible(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!visible) return null;

  async function handleChange(next: boolean) {
    setChecked(next);
    setSaving(true);
    try {
      await api.put("/me/marketing-consent", { whatsapp: next, source: "CHECKOUT" });
    } catch {
      setChecked(!next);
      toast.error("Não foi possível salvar sua escolha. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return <PromoWhatsappConsent id="checkout-promo-whatsapp" checked={checked} onCheckedChange={handleChange} disabled={saving} />;
}
