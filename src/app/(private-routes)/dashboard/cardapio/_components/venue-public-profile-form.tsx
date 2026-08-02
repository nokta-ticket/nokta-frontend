"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useUpdateVenuePublicProfile, useVenuePublicProfile } from "../_hooks/use-venue-public-profile";

/**
 * Dados de vitrine do cardápio público (logo, endereço, Instagram,
 * WhatsApp) — tudo opcional, editado aqui pelo dono/gerente. Fica junto do
 * MenuSharePanel (link + QR) por ser a mesma vitrine, não uma aba separada
 * de Configurações.
 */
export function VenuePublicProfileForm({ orgId }: { orgId: number }) {
  const { data, isLoading } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);

  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (!data) return;
    setLogoUrl(data.logoUrl ?? "");
    setAddress(data.address ?? "");
    setInstagramUrl(data.instagramUrl ?? "");
    setWhatsappNumber(data.whatsappNumber ?? "");
  }, [data]);

  const handleSave = () => {
    update.mutate(
      {
        logoUrl: logoUrl || undefined,
        address: address || undefined,
        instagramUrl: instagramUrl || undefined,
        whatsappNumber: whatsappNumber || undefined,
      },
      {
        onSuccess: () => toast.success("Vitrine do cardápio atualizada!"),
        onError: () => toast.error("Não foi possível salvar. Confira os links e tente novamente."),
      },
    );
  };

  if (isLoading) return null;

  return (
    <Card className="rounded-[22px] p-5">
      <h3 className="mb-1 text-base font-semibold text-foreground">Vitrine pública</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Aparece no topo do cardápio público — tudo opcional.
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="logoUrl" className="text-xs">Logo (URL da imagem)</Label>
          <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs">Endereço</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagramUrl" className="text-xs">Instagram (link do perfil)</Label>
          <Input
            id="instagramUrl"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/seu-bar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsappNumber" className="text-xs">WhatsApp</Label>
          <Input
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+55 11 91234-5678"
          />
        </div>
      </div>

      <Button className="mt-4 w-full" size="sm" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? "Salvando..." : "Salvar vitrine"}
      </Button>
    </Card>
  );
}
