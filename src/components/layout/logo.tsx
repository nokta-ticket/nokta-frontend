import Image from "next/image"

type Props = {
  size: number
}

export const Logo = ({ size }: Props) => {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <Image
        src="/logo-sicon.svg"
        alt="Nokta Tickets"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
