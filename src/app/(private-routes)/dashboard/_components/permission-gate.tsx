import type { ReactNode } from "react";
import { useVenueAccess } from "@/context/VenueAccessContext";

/**
 * Esconde a ação/bloco quando o usuário não tem a permissão — só proteção
 * de UI (evita mostrar botão que vai dar 403). A segurança real é sempre o
 * backend, que confere de novo em cada endpoint.
 */
export function PermissionGate({
  permission,
  any,
  fallback = null,
  children,
}: {
  /** Uma única permissão exigida. */
  permission?: string;
  /** Lista de permissões — basta ter UMA delas (OR). Ignorado se `permission` for informado. */
  any?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useVenueAccess();

  const allowed = permission ? can(permission) : any ? any.some((p) => can(p)) : true;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
