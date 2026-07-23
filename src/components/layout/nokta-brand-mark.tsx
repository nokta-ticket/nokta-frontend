import Image from "next/image";
import Link from "next/link";

/**
 * Marca "Nokta" (plataforma de gestão) — mesmo `logo-painel.svg` já usado na
 * LP institucional (`nokta.live`), dashboard e admin. Extraído daqui pra ser
 * reutilizado no header/footer/register quando a superfície atual é
 * PLATFORM (`app.nokta.live`), sem duplicar o markup.
 */
export function NoktaBrandMark({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${className}`}>
      <Image src="/logo-painel.svg" alt="Nokta" width={32} height={29} priority />
      <span className="font-sans text-xl font-bold text-[#181d27]">nokta</span>
    </Link>
  );
}
