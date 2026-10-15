"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchRow } from "@/components/ui/switch-row";
import { usePromoWhatsappPhone } from "./promo-whatsapp-consent";

/** No perfil: liga e desliga as novidades da Nokta Tickets pelo WhatsApp. */
export function PromoConsentCard() {
  const [status, setStatus] = useState<"UNKNOWN" | "OPTED_IN" | "OPTED_OUT" | null>(null);
  const [saving, setSaving] = useState(false);
  const phone = usePromoWhatsappPhone();

  useEffect(() => {
    let alive = true;
    api
      .get<{ whatsapp: "UNKNOWN" | "OPTED_IN" | "OPTED_OUT" }>("/me/marketing-consent")
      .then(({ data }) => alive && setStatus(data.whatsapp))
      .catch(() => alive && setStatus("UNKNOWN"));
    return () => {
      alive = false;
    };
  }, []);

  async function handleChange(next: boolean) {
    const previous = status;
    setStatus(next ? "OPTED_IN" : "OPTED_OUT");
    setSaving(true);
    try {
      await api.put("/me/marketing-consent", { whatsapp: next, source: "PROFILE" });
      toast.success(next ? "Pronto, você vai receber as novidades." : "Pronto, você não recebe mais as novidades.");
    } catch {
      setStatus(previous);
      toast.error("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novidades</CardTitle>
        <CardDescription>Seus ingressos e códigos continuam chegando normalmente, com ou sem esta opção.</CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <SwitchRow
          id="perfil-promo-whatsapp"
          label="Novidades de eventos pelo WhatsApp"
          description={phone ? `Pelo número ${phone}, no máximo duas vezes por semana.` : "No máximo duas vezes por semana."}
          checked={status === "OPTED_IN"}
          onCheckedChange={handleChange}
          disabled={status === null || saving}
        />
      </CardContent>
    </Card>
  );
}
