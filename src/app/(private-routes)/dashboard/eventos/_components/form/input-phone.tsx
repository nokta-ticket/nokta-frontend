'use client'

import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'

type Props = {
  name: string
  id?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

export function InputPhone({ name, id, value, onChange, required }: Props) {
  const [internalValue, setInternalValue] = useState('')

  useEffect(() => {
    setInternalValue(maskPhone(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 11) return

    setInternalValue(maskPhone(raw))

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: raw,
      },
    }

    onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <Input
      id={id}
      name={name}
      value={internalValue}
      onChange={handleChange}
      placeholder="(99) 91234-5678"
      inputMode="numeric"
      required={required}
      onBlur={() => {
        if (value.length < 10 || value.length > 11) {
          toast.error('Número de telefone inválido.')
        }
      }}
    />
  )
}

function maskPhone(value: string) {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return cleaned
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}
