'use client'

import React, { useState, useRef, useEffect } from 'react'
import { getCountries, getCountryCallingCode, type Country } from 'react-phone-number-input'
import flagComponents from 'react-phone-number-input/flags'
import ptBR from 'react-phone-number-input/locale/pt-BR.json'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── types ─────────────────────────────────────────────────────────────────────

type FlagMap = Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { title?: string }>>
const Flags = flagComponents as unknown as FlagMap

// ── data ──────────────────────────────────────────────────────────────────────

const LABELS = ptBR as Record<string, string>

const PRIORITY: Country[] = [
  'BR', 'US', 'AR', 'PT', 'ES', 'MX', 'CO', 'CL', 'GB', 'FR', 'DE', 'IT', 'JP', 'CA',
]

const ALL_COUNTRIES = getCountries()
const COUNTRY_LIST: Country[] = [
  ...PRIORITY.filter(c => ALL_COUNTRIES.includes(c)),
  ...ALL_COUNTRIES
    .filter(c => !PRIORITY.includes(c))
    .sort((a, b) => (LABELS[a] || a).localeCompare(LABELS[b] || b, 'pt-BR')),
]

// ── masks ─────────────────────────────────────────────────────────────────────

const MASKS: Partial<Record<Country, string>> = {
  BR: '(##) #####-####',
  US: '(###) ###-####',
  CA: '(###) ###-####',
  AR: '(###) ###-####',
  PT: '### ### ###',
  ES: '### ### ###',
  MX: '(###) ###-####',
  CO: '### ###-####',
  CL: '# ####-####',
  GB: '##### ######',
  FR: '## ## ## ## ##',
  DE: '#### ########',
  IT: '### #######',
  JP: '###-####-####',
}

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, '')
  let out = ''
  let di = 0
  for (const ch of mask) {
    if (di >= digits.length) break
    out += ch === '#' ? digits[di++] : ch
  }
  return out
}

function formatPhone(value: string, country: Country): string {
  const mask = MASKS[country]
  if (!mask) return value.replace(/\D/g, '').slice(0, 15)
  return applyMask(value, mask)
}

function getPlaceholder(country: Country): string {
  const mask = MASKS[country]
  return mask ? mask.replace(/#/g, '0') : 'Número de telefone'
}

export function validatePhone(value: string, country: Country): boolean {
  const digits = value.replace(/\D/g, '')
  if (country === 'BR') return digits.length === 10 || digits.length === 11
  return digits.length >= 7
}

// ── flag SVG ──────────────────────────────────────────────────────────────────

function FlagIcon({ country, size = 'md' }: { country: Country; size?: 'sm' | 'md' }) {
  const Flag = Flags[country]
  if (!Flag) return <span className="inline-block h-3.5 w-5 rounded-[2px] bg-gray-200" />

  const dims = size === 'sm'
    ? { width: 18, height: 13 }
    : { width: 20, height: 14 }

  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.10)]"
      style={dims}
    >
      <Flag
        title={country}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      />
    </span>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string
  country: Country
  onChange: (display: string, country: Country) => void
  onBlur?: () => void
  error?: boolean
}

export function PhoneInput({ value, country, onChange, onBlur, error }: PhoneInputProps) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [focused, setFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const dialCode = `+${getCountryCallingCode(country)}`

  const filtered = COUNTRY_LIST.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (LABELS[c] || c).toLowerCase().includes(q) ||
      `+${getCountryCallingCode(c)}`.includes(q) ||
      c.toLowerCase().startsWith(q)
    )
  })

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
    else setSearch('')
  }, [open])

  const handleCountryChange = (c: Country) => {
    onChange('', c)
    setOpen(false)
  }

  const isActive = focused || open

  return (
    <div
      className={cn(
        'flex h-[46px] w-full overflow-hidden rounded-xl border bg-gray-50/60 transition-all duration-200',
        isActive && !error
          ? 'border-violet-400/80 bg-white shadow-[0_0_0_3px_rgba(139,92,246,0.07)] ring-2 ring-violet-500/10'
          : error
          ? 'border-red-300'
          : 'border-gray-200',
      )}
    >
      {/* ── Country selector ── */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Selecionar país"
            className={cn(
              'group flex h-full shrink-0 cursor-pointer items-center gap-2 border-r px-3 transition-all duration-150',
              open
                ? 'border-violet-200/80 bg-violet-50/40'
                : 'border-gray-200 hover:bg-gray-100/70 active:bg-gray-100',
            )}
          >
            <FlagIcon country={country} />
            <span className="tabular-nums text-[12.5px] font-medium text-gray-600 leading-none">
              {dialCode}
            </span>
            <ChevronDown
              size={12}
              className={cn(
                'text-gray-400 transition-transform duration-200',
                open ? 'rotate-180 text-violet-400' : 'group-hover:text-gray-500',
              )}
            />
          </button>
        </PopoverTrigger>

        {/* ── Dropdown ── */}
        <PopoverContent
          align="start"
          sideOffset={8}
          className="z-[200] w-[320px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-0 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.18),_0_4px_16px_-4px_rgba(0,0,0,0.08),_0_0_0_1px_rgba(0,0,0,0.03)]"
        >
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar país ou código..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8.5 pr-7 text-[12.5px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-violet-400/70 focus:bg-white focus:ring-2 focus:ring-violet-500/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-0" />

          {/* Country list */}
          <div className="max-h-[240px] overflow-y-auto py-1.5 scroll-smooth">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] text-gray-400">Nenhum país encontrado</p>
              </div>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = c === country
                const isPriority = PRIORITY.includes(c)
                const prevCode   = filtered[idx - 1]
                const showDivider = !search && !isPriority && (idx === 0 || PRIORITY.includes(prevCode))

                return (
                  <React.Fragment key={c}>
                    {showDivider && (
                      <div className="mx-3 my-1.5 flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-100" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-300">
                          Todos os países
                        </span>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCountryChange(c)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-100',
                        isSelected
                          ? 'bg-violet-50/80 text-violet-700'
                          : 'text-gray-700 hover:bg-gray-50/80',
                      )}
                    >
                      <FlagIcon country={c} size="sm" />
                      <span className="flex-1 truncate text-[12.5px] font-medium">
                        {LABELS[c] || c}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 tabular-nums text-[11.5px]',
                          isSelected ? 'text-violet-400' : 'text-gray-400',
                        )}
                      >
                        +{getCountryCallingCode(c)}
                      </span>
                      {isSelected && (
                        <Check size={12} className="shrink-0 text-violet-500" />
                      )}
                    </button>
                  </React.Fragment>
                )
              })
            )}
          </div>

          {/* Bottom hint */}
          <div className="border-t border-gray-100 px-3 py-2">
            <p className="text-[10.5px] text-gray-300 text-center">
              {filtered.length} {filtered.length === 1 ? 'país' : 'países'}
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* ── Phone number input ── */}
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={getPlaceholder(country)}
        value={value}
        onChange={e => onChange(formatPhone(e.target.value, country), country)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.() }}
        className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-4 text-[16px] sm:text-[13.5px] text-gray-900 placeholder:text-gray-500 outline-none"
      />
    </div>
  )
}
