"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Shield, ArrowRight, Clock } from "lucide-react";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type VerificationStatus = "none" | "pending" | "rejected";

export function N2VerificationBanner() {
  const { nivelProdutor, role } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("none");
  const [loaded, setLoaded] = useState(false);

  const fetchStatus = () => {
    setLoaded(false);
    if (role !== "PRODUTOR" || nivelProdutor === 2) {
      setLoaded(true);
      return;
    }

    api
      .get("/produtor/minha-verificacao")
      .then((res) => {
        if (res.data?.status === 1) setVerificationStatus("pending");
        else if (res.data?.status === 3) setVerificationStatus("rejected");
        else setVerificationStatus("none");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    fetchStatus();
  }, [role, nivelProdutor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => {
      setVerificationStatus("pending");
    };
    window.addEventListener("n2-solicitation-submitted", handler);
    return () => window.removeEventListener("n2-solicitation-submitted", handler);
  }, []);

  if (!loaded || role !== "PRODUTOR" || nivelProdutor === 2) return null;

  if (verificationStatus === "pending") {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm">
        <Clock size={16} className="text-amber-600 shrink-0" />
        <p className="text-amber-800">
          <span className="font-medium">Verificação em análise.</span>{" "}
          Nossa equipe está revisando seus dados. Você será notificado por e-mail em breve.
        </p>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="flex items-center justify-between gap-3 bg-red-50 border-b border-red-200 px-4 py-2.5 text-sm">
        <p className="text-red-800">
          <span className="font-medium">Verificação reprovada.</span>{" "}
          Seus dados não passaram na análise. Por favor, tente novamente.
        </p>
        <Link
          href="/dashboard/eventos/verificar-conta"
          className="flex items-center gap-1 whitespace-nowrap rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Tentar novamente <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-violet-50 border-b border-violet-200 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-violet-600 shrink-0" />
        <p className="text-violet-900">
          <span className="font-medium">Torne-se um Produtor Verificado.</span>{" "}
          Adicione seu CPF/CNPJ e chave PIX para desbloquear ingressos pagos.
        </p>
      </div>
      <Link
        href="/dashboard/eventos/verificar-conta"
        className="flex items-center gap-1 whitespace-nowrap rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
      >
        Verificar agora <ArrowRight size={12} />
      </Link>
    </div>
  );
}
