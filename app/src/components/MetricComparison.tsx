import type { Metric } from '../lib/simulationView'

export type { Metric }

interface MetricComparisonProps {
  metrics: Metric[]
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function formatValue(metric: Metric, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  if (metric.isShare) return `${(value * 100).toFixed(0)}%`
  return `${numberFormat.format(value)}${metric.unit ? ` ${metric.unit}` : ''}`
}

function deltaOf(metric: Metric): number | null {
  if (metric.baseline === null || metric.intervention === null) return null
  return metric.intervention - metric.baseline
}

function direction(metric: Metric): 'improved' | 'worsened' | 'unchanged' {
  const delta = deltaOf(metric)
  if (delta === null || delta === 0) return 'unchanged'
  const improved = metric.higherIsBetter ? delta > 0 : delta < 0
  return improved ? 'improved' : 'worsened'
}

export function MetricComparison({ metrics }: MetricComparisonProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-[12px] text-slate-500">
        The backend did not return comparable metrics for this scenario.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const delta = deltaOf(metric)
  const verdict = direction(metric)
  const max = Math.max(metric.baseline ?? 0, metric.intervention ?? 0, 1)
  const baselineWidth = ((metric.baseline ?? 0) / max) * 100
  const interventionWidth = ((metric.intervention ?? 0) / max) * 100

  const percentChange =
    delta !== null && metric.baseline !== null && metric.baseline !== 0
      ? `${delta > 0 ? '+' : ''}${((delta / Math.abs(metric.baseline)) * 100).toFixed(0)}%`
      : null

  const verdictStyles: Record<typeof verdict, string> = {
    improved: 'text-emerald-400',
    worsened: 'text-rose-400',
    unchanged: 'text-slate-400',
  }
  const verdictLabel =
    verdict === 'improved'
      ? metric.higherIsBetter
        ? 'Improvement (higher is better)'
        : 'Improvement (lower is better)'
      : verdict === 'worsened'
        ? metric.higherIsBetter
          ? 'Worsening (higher is better)'
          : 'Worsening (lower is better)'
        : 'No change'

  return (
    <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] font-medium text-slate-200">{metric.label}</div>
        <span
          className={`shrink-0 text-[11px] font-semibold ${
            delta === null ? 'text-slate-500' : verdictStyles[verdict]
          }`}
        >
          {delta === null
            ? '—'
            : `${delta > 0 ? '+' : ''}${numberFormat.format(delta)}${metric.isShare ? ' pts' : ''}${
                percentChange ? ` · ${percentChange}` : ''
              }`}
        </span>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        <BarRow
          label="Baseline"
          value={formatValue(metric, metric.baseline)}
          width={baselineWidth}
          color="#94a3b8"
          kind={metric.baselineKind}
        />
        <BarRow
          label="Intervention"
          value={formatValue(metric, metric.intervention)}
          width={interventionWidth}
          color={verdict === 'worsened' ? '#fb7185' : '#34d399'}
          kind={metric.interventionKind}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className={delta === null ? 'text-slate-500' : verdictStyles[verdict]}>
          {delta === null
            ? metric.contextOnly
              ? 'Baseline only'
              : 'Not comparable'
            : verdictLabel}
        </span>
        <span className="text-slate-500">
          {metric.intervention === null
            ? 'Observed baseline'
            : `Δ is ${metric.interventionKind === 'estimate' ? 'model estimate' : 'observed'}`}
        </span>
      </div>
    </div>
  )
}

function BarRow({
  label,
  value,
  width,
  color,
  kind,
}: {
  label: string
  value: string
  width: number
  color: string
  kind: 'observed' | 'estimate'
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] text-slate-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#132119]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(width, 0).toFixed(1)}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-slate-300">
        {value}
      </span>
      <span
        className={`shrink-0 rounded px-1 py-0.5 text-[9px] uppercase tracking-wide ${
          kind === 'observed'
            ? 'bg-slate-500/15 text-slate-400'
            : 'bg-sky-500/15 text-sky-300'
        }`}
      >
        {kind === 'observed' ? 'obs' : 'est'}
      </span>
    </div>
  )
}
