import type { StudyArea, Species, ViewId } from '../lib/nav'
import type { DataSource } from '../hooks/useCandidateRoads'
import { Icon } from './Icon'
import { StatusPill } from './StatusPill'
import { ScenarioStatus } from './ScenarioStatus'
import type { SimulationStatus } from '../hooks/useSimulation'

interface OverviewPanelProps {
  studyArea: StudyArea | null
  species: Species
  observationCount: number
  candidateCount: number
  source: DataSource
  demoReason: string | null
  status: SimulationStatus
  isDemo: boolean
  error: string | null
  onNavigate: (view: ViewId) => void
}

export function OverviewPanel({
  studyArea,
  species,
  observationCount,
  candidateCount,
  source,
  demoReason,
  status,
  isDemo,
  error,
  onNavigate,
}: OverviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Kpi label="GPS observations" value={observationCount.toLocaleString()} />
        <Kpi label="Candidate roads" value={String(candidateCount)} />
        <Kpi label="Study area" value={studyArea ? studyArea.name : '—'} />
        <Kpi label="Species" value={species.commonName} />
      </div>

      <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-300">Data source</span>
          <StatusPill tone={source === 'backend' ? 'emerald' : 'amber'}>
            {source === 'backend' ? 'Backend live' : 'Demonstration'}
          </StatusPill>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {source === 'backend'
            ? 'Candidate roads and simulation results come from the connected backend.'
            : demoReason ?? 'Demonstration data derived from the local road network.'}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Scenario status
        </h3>
        <ScenarioStatus
          status={status}
          isDemo={isDemo}
          demoReason={demoReason}
          error={error}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onNavigate('planner')}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Icon name="planner" size={15} />
          Open intervention planner
        </button>
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#24362c] bg-[#0a120e] px-4 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <Icon name="layers" size={15} />
          Manage map layers
        </button>
      </div>

      <p className="rounded-lg border border-[#1c2a23] bg-[#0e1a14] p-3 text-[10px] leading-relaxed text-slate-500">
        WildTrace is a planning tool. All map and simulation outputs are model
        estimates or demonstration data and are not verified ecological outcomes.
      </p>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  )
}
