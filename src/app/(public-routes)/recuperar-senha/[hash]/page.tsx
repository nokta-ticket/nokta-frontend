"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

export default function RecuperarSenha() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");

  async function loadResetPasswordRequest() {
    try {
      setLoading(true);
      const { data } = await api.get(
        "/validate-reset-password-request/" + hash
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      } else {
        toast.error("Ocorreu um erro ao enviar email de recuperação");
      }
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword() {
    if (password === "") {
      toast.error("Preencha a senha para continuar");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha teve ter no mínimo 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/reset-password/" + hash, { password });
      toast.success("Senha atualizada com sucesso");
      router.push("/login");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      } else {
        toast.error("Ocorreu um erro ao alterar a senha");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResetPasswordRequest();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center -my-10">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center -my-10">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-4xl font-semibold text-center">Altere sua senha</h1>
        <div className="relative">
          <Lock
            className="absolute left-3 top-5 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 rounded-lg pl-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label="Mostrar/ocultar senha"
            className="absolute right-3 top-6 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
          </button>
        </div>
        <Button disabled={loading} onClick={updatePassword} className="w-full">
          Alterar senha
        </Button>
      </div>
    </div>
  );
}
