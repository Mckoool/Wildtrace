import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { SimulationStatus } from '../hooks/useSimulation'

interface ScenarioStatusProps {
  status: SimulationStatus
  isDemo: boolean
  demoReason: string | null
  modelStatus?: string
  error?: string | null
}

const MODEL_STATUS_LABELS: Record<string, string> = {
  observed_geometry_model_with_explicit_assumptions: 'Observed-geometry model',
  not_modelled_habitat_data_missing: 'Not modelled — habitat data missing',
  demonstration_data: 'Demonstration data',
}

export function ScenarioStatus({
  status,
  isDemo,
  demoReason,
  modelStatus,
  error,
}: ScenarioStatusProps) {
  if (status === 'error') {
    return (
      <Banner tone="error" icon="alert" title="Simulation failed">
        {error ?? 'The backend request failed. Adjust the scenario and try again.'}
      </Banner>
    )
  }

  if (status === 'loading') {
    return (
      <Banner tone="info" icon="simulation" title="Running simulation…">
        Evaluating the scenario against the observed movement geometry.
      </Banner>
    )
  }

  if (status === 'success') {
    const label = modelStatus ? MODEL_STATUS_LABELS[modelStatus] ?? modelStatus : 'Simulation complete'
    return (
      <Banner
        tone={isDemo ? 'demo' : 'success'}
        icon={isDemo ? 'info' : 'check'}
        title={isDemo ? 'Demonstration result' : 'Simulation complete'}
      >
        {isDemo
          ? demoReason ?? 'These values are simulated demonstration data, not verified outcomes.'
          : `Model: ${label}. Values are model estimates derived from observed GPS geometry.`}
      </Banner>
    )
  }

  return (
    <Banner tone="idle" icon="info" title="No scenario run yet">
      Select a candidate road and intervention, then run the simulation.
    </Banner>
  )
}

type Tone = 'error' | 'info' | 'success' | 'demo' | 'idle'

const TONES: Record<Tone, { wrap: string; icon: string }> = {
  error: { wrap: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: 'text-rose-400' },
  info: { wrap: 'border-sky-500/30 bg-sky-500/10 text-sky-300', icon: 'text-sky-400' },
  success: {
    wrap: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    icon: 'text-emerald-400',
  },
  demo: { wrap: 'border-amber-500/30 bg-amber-500/10 text-amber-300', icon: 'text-amber-400' },
  idle: { wrap: 'border-[#24362c] bg-[#0a120e] text-slate-400', icon: 'text-slate-500' },
}

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: Tone
  icon: Parameters<typeof Icon>[0]['name']
  title: string
  children: ReactNode
}) {
  const styles = TONES[tone]
  return (
    <div className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${styles.wrap}`} role="status">
      <span className={`mt-0.5 shrink-0 ${styles.icon}`}>
        <Icon name={icon} size={15} />
      </span>
      <div className="text-[11px] leading-relaxed">
        <div className="font-semibold">{title}</div>
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  )
}
