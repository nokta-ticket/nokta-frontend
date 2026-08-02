"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useUpdateVenuePublicProfile, useVenuePublicProfile } from "../_hooks/use-venue-public-profile";

/**
 * Endereço/Instagram/WhatsApp da vitrine do cardápio público — tudo
 * opcional. Logo e banner saíram daqui (editáveis direto no cabeçalho da
 * tela de Cardápio, ver menu-header.tsx) — aqui sobra só o que não tem
 * espaço visual lá.
 */
export function VenuePublicProfileForm({ orgId }: { orgId: number }) {
  const { data, isLoading } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);

  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (!data) return;
    setAddress(data.address ?? "");
    setInstagramUrl(data.instagramUrl ?? "");
    setWhatsappNumber(data.whatsappNumber ?? "");
  }, [data]);

  const handleSave = () => {
    update.mutate(
      {
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
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        Endereço e contatos aparecem no topo do cardápio público — tudo opcional.
      </p>

      <div className="space-y-3">
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
    </div>
  );
}
