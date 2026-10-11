import { Badge } from "@/components/ui/badge";

export const MODULE_LABEL: Record<string, string> = {
  tickets: "Ingressos",
  venue: "Bar e restaurante",
};

const STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Ativo", className: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "Bloqueado", className: "bg-red-100 text-red-700" },
  CANCELED: { label: "Cancelado", className: "bg-gray-100 text-gray-700" },
};

export function WorkspaceStatusBadge({ status }: { status: string }) {
  const item = STATUS[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <Badge className={`rounded-full px-3 py-1 text-xs ${item.className}`}>{item.label}</Badge>;
}
