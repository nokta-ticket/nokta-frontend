"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";

type IngressoValidado = {
  codigo: string;
  evento: string;
  status: "válido" | "inválido";
};

export default function ValidarIngressoPage() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<IngressoValidado | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<null | string>(null);
  const [isScanning, setIsScanning] = useState(false);

  const validarIngresso = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código do ingresso");
      return;
    }

    setLoading(true);
    setResultado(null);
    try {
      const res = await api.post("/tickets/validar", { code });

      setResultado({
        codigo,
        evento: res.data.eventName,
        status: "válido",
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToogleScan = () => {
    setIsScanning((prev) => !prev);
  };

  async function scanResult(result: IDetectedBarcode[]) {
    if (result[0]) {
      const rawValue = result[0].rawValue;
      setIsScanning(false);
      validarIngresso(rawValue);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Check-in"
        description="Escaneie o QR Code ou digite o código para validar o ingresso."
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Código do ingresso"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="bg-white"
        />
        <Button onClick={() => validarIngresso(codigo)} disabled={loading}>
          {loading ? "Validando..." : "Validar"}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleToogleScan}
      >
        <QrCode className="w-5 h-5" />
        Escanear QR Code
      </Button>

      {isScanning && (
        <div className="w-xl mx-auto">
          <Scanner sound={false} onScan={scanResult} />
        </div>
      )}

      {resultado && (
        <div
          className={`p-5 rounded-lg border shadow-sm ${
            resultado.status === "válido"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-red-500 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xl font-semibold">
            {resultado.status === "válido" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            {resultado.status === "válido"
              ? "Ingresso Válido"
              : "Ingresso Inválido"}
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p>
              <strong>Evento:</strong> {resultado.evento}
            </p>
            <p>
              <strong>Código:</strong> {resultado.codigo}
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
