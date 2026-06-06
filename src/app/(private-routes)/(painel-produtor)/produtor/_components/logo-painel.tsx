import Image from "next/image"

type Props = {
  size: number;
}

export const Logo = ({size}: Props) => {
  return(
      <Image
        src={'/logo-painel.svg'}
        alt="Nokta Tickets"
        height={size}
        width={size}
      />
  )
}