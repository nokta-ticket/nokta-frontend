import Image from "next/image";
import Link from "next/link";

/**
 * Marca "Nokta" (plataforma de gestão) — wordmark `logonokta-preta.svg`
 * (fundo claro) usada na LP institucional (`nokta.live`) e no register.
 * Extraído daqui pra ser reutilizado no header/footer/register quando a
 * superfície atual é PLATFORM (`app.nokta.live`), sem duplicar o markup.
 */
export function NoktaBrandMark({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <Image src="/logonokta-preta.svg" alt="Nokta" width={130} height={37} priority />
    </Link>
  );
}
