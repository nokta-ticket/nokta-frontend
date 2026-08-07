"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/**
 * Banner/logo do perfil (Supabase Storage, sem otimização automática do
 * Next — precisa continuar `unoptimized`, ver comentário em
 * ImageCropperDialog sobre por quê) podem levar 1-2s pra baixar mesmo já
 * comprimidos, principalmente em 4G. Sem nenhum feedback visual nesse
 * intervalo, a tela parece travada/quebrada (relatado pelo usuário) —
 * este wrapper mostra um shimmer por cima do fallback escuro (nunca troca
 * a cor de fundo, só sobrepõe a animação) até o `onLoad` da imagem
 * disparar, com fade-out suave em vez de troca abrupta. Compartilhado
 * entre MenuView (cardápio), VenueHomeView (Home pública) e
 * AvaliacaoFormView — os três reproduzem o mesmo hero de banner+logo.
 */
export function ImageWithSkeleton(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <Image
        {...props}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
        className={`${props.className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {loaded ? null : (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/15 to-white/5 [background-size:200%_100%]" />
      )}
    </>
  );
}
