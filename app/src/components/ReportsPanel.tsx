import { INTERVENTION_LABELS, type SimulationResponse, type CandidateRoadSummary } from '../api/simulation'
import { Icon } from './Icon'
import { SimulationResults } from './SimulationResults'
import type { SimulationStatus } from '../hooks/useSimulation'

interface ReportsPanelProps {
  status: SimulationStatus
  result: SimulationResponse | null
  error: string | null
  isDemo: boolean
  demoReason: string | null
  summary: CandidateRoadSummary | null
}

function downloadReport(result: SimulationResponse, isDemo: boolean) {
  const report = {
    generatedAt: new Date().toISOString(),
    dataSource: isDemo ? 'demonstration' : 'backend',
    intervention: INTERVENTION_LABELS[result.intervention],
    roadId: result.road_id,
    radiusM: result.radius_m,
    modelStatus: result.model_status,
    baseline: result.baseline,
    scenario: result.scenario,
    limitations: result.limitations,
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `wildtrace-scenario-road-${result.road_id}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsPanel({
  status,
  result,
  error,
  isDemo,
  demoReason,
  summary,
}: ReportsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
        <div>
          <div className="text-[12px] font-semibold text-slate-100">Scenario report</div>
          <p className="text-[10px] text-slate-500">
            Export the last scenario as a JSON summary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => result && downloadReport(result, isDemo)}
          disabled={!result}
          className="flex items-center gap-2 rounded-lg border border-[#24362c] bg-[#0a120e] px-3 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="download" size={14} />
          Export JSON
        </button>
      </div>

      <SimulationResults
        status={status}
        result={result}
        error={error}
        isDemo={isDemo}
        demoReason={demoReason}
        summary={summary}
      />
    </div>
  )
}
