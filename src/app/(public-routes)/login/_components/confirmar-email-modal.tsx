'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// ─── OTP input ───────────────────────────────────────────────────────────────

function OtpInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled?: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const r4 = useRef<HTMLInputElement>(null)
  const r5 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3, r4, r5]

  useEffect(() => {
    refs[0].current?.focus()
  }, [])

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    setDigits(next)
    if (digit && idx < 5) refs[idx + 1].current?.focus()
    if (next.every((d) => d !== '')) onComplete(next.join(''))
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setDigits(next)
      refs[5].current?.focus()
      onComplete(pasted)
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ConfirmEmailModalProps {
  open: boolean
  onClose: () => void
  email: string
  onConfirm: () => void
}

export function ConfirmEmailModal({ open, onClose, email, onConfirm }: ConfirmEmailModalProps) {
  const [loading, setLoading] = useState(false)

  // Resend cooldown
  const [sendCount, setSendCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open) return
    setSecondsLeft(60)
    setSendCount(0)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [open])

  const startCooldown = (nextCount: number) => {
    const secs = nextCount * 300
    setSecondsLeft(secs)
    setSendCount(nextCount)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${s}s`
  }

  const handleConfirm = async (code: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/confirmar-telefone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      })
      if (!res.ok) throw new Error('Código inválido')
      onConfirm()
    } catch {
      toast.error('Código inválido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (secondsLeft > 0) return
    try {
      await fetch(`${API_URL}/auth/reenviar-confirmacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      toast.success('Novo código enviado!')
      startCooldown(sendCount + 1)
    } catch {
      toast.error('Erro ao reenviar o código.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="space-y-5 max-w-sm">
        <DialogHeader>
          <DialogTitle>Verificação de telefone</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          Insira o código de 6 dígitos enviado para o seu WhatsApp.
        </p>

        <OtpInput onComplete={handleConfirm} disabled={loading} />

        {loading && (
          <p className="text-center text-sm text-violet-500 animate-pulse">Verificando…</p>
        )}

        <div className="text-center text-sm text-gray-400">
          {secondsLeft > 0 ? (
            <p>
              Reenviar em{' '}
              <span className="font-medium text-gray-600">{formatTime(secondsLeft)}</span>
            </p>
          ) : (
            <p>
              Não recebeu?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer text-violet-500 hover:underline font-medium"
              >
                Reenviar código
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Verifique as mensagens do WhatsApp no seu celular.</p>
      </DialogContent>
    </Dialog>
  )
}
