import type { ReactNode } from 'react'
import { INTERVENTION_LABELS, type SimulationResponse } from '../api/simulation'
import { StatusPill } from './StatusPill'
import { ScenarioStatus } from './ScenarioStatus'
import { MetricComparison } from './MetricComparison'
import { EmptyState } from './EmptyState'
import { buildMetrics } from '../lib/simulationView'
import type { SimulationStatus } from '../hooks/useSimulation'
import type { CandidateRoadSummary } from '../api/simulation'

export interface SimulationResultsProps {
  status: SimulationStatus
  result: SimulationResponse | null
  error: string | null
  isDemo: boolean
  demoReason: string | null
  summary: CandidateRoadSummary | null
}

export function SimulationResults({
  status,
  result,
  error,
  isDemo,
  demoReason,
  summary,
}: SimulationResultsProps) {
  if (status === 'idle' || (status !== 'error' && !result)) {
    return (
      <EmptyState
        icon="simulation"
        title="No simulation results yet"
        message="Configure an intervention in the Intervention Planner and run a simulation to compare baseline and intervention metrics."
      />
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        <ScenarioStatus status="loading" isDemo={false} demoReason={null} />
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-20 animate-pulse rounded-xl border border-[#1c2a23] bg-[#0e1a14]"
          />
        ))}
      </div>
    )
  }

  if (status === 'error' || !result) {
    return <ScenarioStatus status="error" isDemo={false} demoReason={null} error={error} />
  }

  const metrics = buildMetrics(result)
  const notModelled = result.scenario.hypothetical_exposure_index === null

  return (
    <div className="flex flex-col gap-4">
      <ScenarioStatus
        status={status}
        isDemo={isDemo}
        demoReason={demoReason}
        modelStatus={result.model_status}
      />

      <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-slate-100">
            {INTERVENTION_LABELS[result.intervention]}
          </div>
          <StatusPill tone={isDemo ? 'amber' : 'emerald'}>
            {isDemo ? 'Demonstration' : 'Backend'}
          </StatusPill>
        </div>
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
          <Detail label="Road" value={`#${result.road_id}${summary ? ` · ${summary.highway}` : ''}`} />
          <Detail label="Radius" value={`${result.radius_m} m`} />
          <Detail
            label="Baseline crossings"
            value={String(result.baseline.crossing_segments)}
          />
          <Detail
            label="Observed segments"
            value={String(result.baseline.crossing_events)}
          />
        </dl>
      </div>

      {notModelled ? (
        <EmptyState
          icon="info"
          title="No scenario value produced"
          message={
            result.scenario.reason ??
            'The engine did not produce a comparable scenario value for this intervention.'
          }
          compact
        />
      ) : (
        <div>
          <SectionTitle>Baseline vs intervention</SectionTitle>
          <MetricComparison metrics={metrics} />
        </div>
      )}

      <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Intervention cost
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          The simulation engine does not report cost estimates. No cost figure is shown
          rather than inventing one.
        </p>
      </div>

      {result.scenario.method && (
        <div>
          <SectionTitle>Method</SectionTitle>
          <p className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3 text-[11px] leading-relaxed text-slate-400">
            {result.scenario.method}
          </p>
        </div>
      )}

      {result.limitations.length > 0 && (
        <div>
          <SectionTitle>Limitations</SectionTitle>
          <ul className="flex list-disc flex-col gap-1.5 rounded-xl border border-[#24362c] bg-[#0a120e] p-3 pl-7 text-[11px] leading-relaxed text-slate-400">
            {result.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </h3>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#16241d] pb-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-200">{value}</dd>
    </div>
  )
}
