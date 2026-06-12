"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

const HIDDEN_PATHS = ["/meus-ingressos", "/login", "/register"];

export default function FooterConditional() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return <Footer />;
}
