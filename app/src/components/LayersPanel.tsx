import { MapLayerControls } from './MapLayerControls'
import { MapLegend } from './MapLegend'
import { StatusPill } from './StatusPill'
import type { LayerKey } from '../lib/mapLayers'
import type { DataSource } from '../hooks/useCandidateRoads'

interface LayersPanelProps {
  layers: Record<LayerKey, boolean>
  onToggle: (key: LayerKey) => void
  source: DataSource
  roadCount: number | null
  candidateCount: number
}

export function LayersPanel({
  layers,
  onToggle,
  source,
  roadCount,
  candidateCount,
}: LayersPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <MapLayerControls layers={layers} onToggle={onToggle} />

      <div>
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Legend
        </h3>
        <MapLegend layers={layers} />
      </div>

      <div className="rounded-xl border border-[#24362c] bg-[#0a120e] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-300">Road datasets</span>
          <StatusPill tone={source === 'backend' ? 'emerald' : 'amber'}>
            {source === 'backend' ? 'Backend' : 'Demo'}
          </StatusPill>
        </div>
        <dl className="mt-2 flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Local road network</dt>
            <dd className="font-medium text-slate-200">
              {roadCount === null ? 'Loading…' : `${roadCount.toLocaleString()} features`}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Candidate roads</dt>
            <dd className="font-medium text-slate-200">{candidateCount}</dd>
          </div>
        </dl>
      </div>

      <p className="rounded-lg border border-[#1c2a23] bg-[#0e1a14] p-3 text-[10px] leading-relaxed text-slate-500">
        The habitat-zone layer is listed for completeness but has no bundled
        land-cover dataset, so it cannot be displayed.
      </p>
    </div>
  )
}
