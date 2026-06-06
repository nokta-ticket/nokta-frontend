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

export function InputCpf({ name, id, value, onChange, required }: Props) {
  const [internalValue, setInternalValue] = useState('')

  // Atualiza ao receber novo value externo (ex: reset form)
  useEffect(() => {
    setInternalValue(maskCpf(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '') // remove tudo exceto dígito
    if (raw.length > 11) return

    setInternalValue(maskCpf(raw))

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: raw,
        name,
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
      required={required}
      placeholder="000.000.000-00"
      inputMode="numeric"
      pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
      onBlur={() => {
        if (internalValue && !isValidCpf(internalValue)) {
          toast.error('CPF inválido.')
        }
      }}
    />
  )
}

// Aplica a máscara de CPF
function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Valida CPF (algoritmo oficial)
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')

  if (!digits || digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  const calc = (base: string, factor: number) =>
    base
      .split('')
      .reduce((sum, num, idx) => sum + parseInt(num) * (factor - idx), 0)

  const firstCheck = calc(digits.slice(0, 9), 10) % 11 < 2 ? 0 : 11 - (calc(digits.slice(0, 9), 10) % 11)
  const secondCheck = calc(digits.slice(0, 10), 11) % 11 < 2 ? 0 : 11 - (calc(digits.slice(0, 10), 11) % 11)

  return firstCheck === parseInt(digits[9]) && secondCheck === parseInt(digits[10])
}
