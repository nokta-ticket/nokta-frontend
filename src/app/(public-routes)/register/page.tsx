import type { Metadata } from "next";
import { RegisterSurface } from "./_components/register-surface";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return <RegisterSurface />;
}
