import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface EmptyStateProps {
  icon?: IconName
  title: string
  message: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon = 'info', title, message, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#24362c] bg-[#0a120e]/60 text-center ${
        compact ? 'p-5' : 'p-10'
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#132119] text-slate-500">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <div className="text-[13px] font-semibold text-slate-200">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
          {message}
        </p>
      </div>
      {action}
    </div>
  )
}
