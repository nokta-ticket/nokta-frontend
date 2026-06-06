'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ConfirmEmailModal } from './confirmar-email-modal'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function OAuthButtons({ ctx }: { ctx: string }) {
  const handleGoogle = () => { window.location.href = `${API_URL}/auth/google?state=${ctx}` }
  const handleApple = ()  => { window.location.href = `${API_URL}/auth/apple?state=${ctx}` }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogle}
        className="group flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.99]"
      >
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707C3.784 10.167 3.682 9.59 3.682 9s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
        </svg>
        Continuar com Google
      </button>

      <button
        type="button"
        onClick={handleApple}
        className="group flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.99]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
        </svg>
        Continuar com Apple
      </button>

      {/* Divisor */}
      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
            ou
          </span>
        </div>
      </div>
    </div>
  )
}

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ctx          = searchParams.get('ctx') || ''
  const { signIn }   = useAuth()

  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const [modalOpen,        setModalOpen]        = useState(false)
  const [emailConfirmacao, setEmailConfirmacao] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, senha }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg: string = Array.isArray(data.message) ? data.message.join(' ') : (data.message || '')
        if (msg.toLowerCase().includes('confirmada') || msg.toLowerCase().includes('confirmar')) {
          setEmailConfirmacao(email)
          setModalOpen(true)
        } else {
          throw new Error(msg || 'Credenciais inválidas')
        }
        return
      }

      const { token, user } = data
      if (!token) throw new Error('Token não retornado pela API')

      signIn(token, user)
      toast.success('Login realizado com sucesso!')

      if (ctx === 'produtor') {
        router.push(user.role === 'PRODUTOR' ? '/produtor/eventos' : '/produtor/onboarding')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSuccess = () => {
    setModalOpen(false)
    toast.success('Conta confirmada! Faça login novamente.')
  }

  return (
    <>
      <div className="space-y-3.5">
        <OAuthButtons ctx={ctx} />

        <form className="space-y-2.5" onSubmit={handleLogin}>

          {/* E-mail */}
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-[46px] w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-[38px] pr-4 text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-violet-500/70 focus:bg-white focus:ring-3 focus:ring-violet-500/10"
            />
          </div>

          {/* Senha */}
          <div>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                className="h-[46px] w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-[38px] pr-10 text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-violet-500/70 focus:bg-white focus:ring-3 focus:ring-violet-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link
                href="/recuperar-senha"
                className="text-[12px] text-violet-700 hover:text-violet-800 hover:underline underline-offset-2 transition-colors font-medium"
              >
                Esqueci a senha
              </Link>
            </div>
          </div>

          {/* Botão submit */}
          <button
            type="submit"
            disabled={loading}
            className="h-[46px] w-full rounded-xl bg-[#5B21B6] text-[13.5px] font-semibold tracking-[0.01em] text-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.08),_0_2px_8px_rgba(91,33,182,0.14)] transition-all duration-200 hover:bg-[#4C1D95] hover:shadow-[0_2px_10px_rgba(91,33,182,0.18)] active:scale-[0.99] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-[14px] w-[14px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Entrando…
              </span>
            ) : (
              'Entrar'
            )}
          </button>

        </form>
      </div>

      <ConfirmEmailModal
        open={modalOpen}
        email={emailConfirmacao}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmSuccess}
      />
    </>
  )
}
