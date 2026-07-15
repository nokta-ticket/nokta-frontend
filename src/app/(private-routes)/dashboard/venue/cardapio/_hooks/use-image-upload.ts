"use client";

import { useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

/**
 * Sobe uma imagem via o endpoint /upload já existente no projeto (mesmo usado
 * por thumbnails de evento) e retorna a URL pública para salvar em `imageUrl`.
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<string | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato de imagem inválido. Use JPG, PNG, GIF ou WEBP.");
      return null;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file, file.name);
      const res = await api.post<{ data: string[] }>("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data[0] ?? null;
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao fazer upload da imagem."));
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
