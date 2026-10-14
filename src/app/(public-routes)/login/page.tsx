import type { Metadata } from "next";
import { LoginSurface } from "./_components/login-surface";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <LoginSurface />;
}
