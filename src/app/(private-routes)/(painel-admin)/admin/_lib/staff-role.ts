"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/context/AuthContext";

export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";

const STAFF_ROLES: StaffRole[] = ["SUPER_ADMIN", "ADMIN", "SUPPORT"];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as string[]).includes(role);
}

/** Papel gravado no cookie `user` no login (o middleware decide rota por ele). */
export function readStaffRoleFromCookie(): StaffRole | null {
  try {
    const raw = Cookies.get("user");
    if (!raw) return null;
    const role = JSON.parse(raw).role;
    return isStaffRole(role) ? role : null;
  } catch {
    return null;
  }
}

/**
 * Papel do staff logado. Lê o cookie primeiro (é o que o middleware usa) e
 * cai pro AuthContext quando ele já resolveu um papel de staff. Só a UI
 * usa isso pra esconder botões — a autorização real é do backend.
 */
export function useStaffRole() {
  const { role: authRole } = useAuth();
  const [cookieRole, setCookieRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    setCookieRole(readStaffRoleFromCookie());
  }, [authRole]);

  const role: StaffRole | null = cookieRole ?? (isStaffRole(authRole) ? authRole : null);
  return {
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    isSupport: role === "SUPPORT",
    /** ADMIN e SUPER_ADMIN agem; SUPPORT só consulta. */
    canAct: role === "SUPER_ADMIN" || role === "ADMIN",
  };
}
