import type { ReactNode } from 'react'

type Tone = 'emerald' | 'amber' | 'sky' | 'slate' | 'rose'

const TONES: Record<Tone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  slate: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
}

interface StatusPillProps {
  tone?: Tone
  children: ReactNode
}

export function StatusPill({ tone = 'slate', children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}
