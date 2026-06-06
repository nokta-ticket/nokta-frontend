"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RecuperarSenha() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // Mensagem genérica fixa — nunca revela se o email existe ou não
  const GENERIC_MSG = "Se esse e-mail estiver cadastrado, você receberá as instruções em breve.";

  async function sendRecoverMail() {
    if (!email) {
      toast.error("Preencha o e-mail para continuar");
      return;
    }

    setLoading(true);

    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silencia erros de rede — não revela informação sobre a conta
    } finally {
      setLoading(false);
      // Sempre mostra a mesma mensagem genérica
      setSent(true);
      toast.success(GENERIC_MSG);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -my-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Recuperar senha</h1>
          <p className="text-sm text-gray-500">
            Informe seu e-mail e enviaremos as instruções caso exista uma conta cadastrada.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-100 bg-green-50 px-6 py-5 text-center">
            <p className="text-sm font-medium text-green-800">{GENERIC_MSG}</p>
            <p className="mt-1 text-xs text-green-600">
              Verifique também sua pasta de spam.
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg pl-10"
              />
            </div>
            <Button
              disabled={loading}
              onClick={sendRecoverMail}
              className="h-11 w-full bg-violet-500 font-semibold text-white hover:bg-violet-600"
            >
              {loading ? "Enviando…" : "Enviar instruções"}
            </Button>
          </>
        )}

        <p className="text-center text-sm text-gray-400">
          Lembrou a senha?{" "}
          <a href="/login" className="text-violet-500 hover:underline">
            Voltar ao login
          </a>
        </p>
      </div>
    </div>
  );
}
