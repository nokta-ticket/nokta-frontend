"use client";

import { useAuth } from "@/context/AuthContext";
import HeaderPublic from "@/components/layout/header-public";
import HeaderPrivate from "@/components/layout/header-private";

export default function HeaderSwitcher() {
  const { isAuthenticated, isAuthResolved } = useAuth();

  if (!isAuthResolved) return null;

  return isAuthenticated ? <HeaderPrivate /> : <HeaderPublic />;
}
