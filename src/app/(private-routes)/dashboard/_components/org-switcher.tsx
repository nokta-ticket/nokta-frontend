"use client";

import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizations } from "@/context/OrganizationContext";

export function OrgSwitcher() {
  const { organizations, currentOrg, selectOrg, loadingOrgs } = useOrganizations();

  if (loadingOrgs) {
    return <div className="text-sm text-black/50">Carregando organização…</div>;
  }

  if (!currentOrg) {
    return <div className="text-sm text-black/50">Nenhuma organização</div>;
  }

  // Uma única org → mostra sem dropdown.
  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium">
        <Building2 size={16} className="text-violet-600" />
        <span>{currentOrg.nome}</span>
      </div>
    );
  }

  // Duas ou mais → dropdown de seleção.
  return (
    <div className="flex items-center gap-2">
      <Building2 size={16} className="text-violet-600" />
      <Select value={String(currentOrg.id)} onValueChange={(v) => selectOrg(Number(v))}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
