import {
  INTERVENTION_LABELS,
  isSupportedIntervention,
  type InterventionType,
} from '../api/simulation'

interface InterventionParametersProps {
  intervention: InterventionType
  radiusM: number
  onRadiusChange: (value: number) => void
  radiusError: string | null
  selectedRoadLabel: string | null
}

const CONTEXT: Record<InterventionType, { title: string; body: string }> = {
  overpass: {
    title: 'Overpass siting',
    body: 'The engine automatically places the structure at the densest observed crossing cluster along the selected road and models movement segments within the radius as using it.',
  },
  underpass: {
    title: 'Underpass siting',
    body: 'Uses the same accessibility-proxy model as an overpass: observed crossings within the radius of the structure point are relocated; the rest remain at-grade.',
  },
  road_reroute: {
    title: 'Rerouting scenario',
    body: 'The road sub-segment within the radius of the structure point is removed from the modelled network and observed crossings are re-checked against the remainder.',
  },
  green_corridor: {
    title: 'Corridor connectivity',
    body: 'Green corridors require habitat / land-cover data, which is not bundled with this project, so the engine reports the corridor as not modelled rather than inventing a result.',
  },
  signage: {
    title: 'Signage',
    body: 'Wildlife crossing signage is not modelled by the current simulation engine.',
  },
  night_lighting: {
    title: 'Reduced night lighting',
    body: 'Lighting-reduction scenarios are not modelled by the current simulation engine.',
  },
}

export function InterventionParameters({
  intervention,
  radiusM,
  onRadiusChange,
  radiusError,
  selectedRoadLabel,
}: InterventionParametersProps) {
  const supported = isSupportedIntervention(intervention)
  const context = CONTEXT[intervention]

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="radius"
          className="mb-1 block text-[11px] font-medium text-slate-400"
        >
          Simulation radius (m)
        </label>
        <input
          id="radius"
          type="number"
          min={1}
          max={5000}
          step={50}
          value={Number.isFinite(radiusM) ? radiusM : ''}
          disabled={!supported}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          aria-invalid={radiusError !== null}
          aria-describedby={radiusError ? 'radius-error' : undefined}
          className="w-full rounded-lg border border-[#24362c] bg-[#0a120e] px-3 py-2 text-[13px] text-slate-200 focus:border-emerald-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Influence radius around the structure point (1–5000 m). This is the only
          free parameter consumed by the engine.
        </p>
        {radiusError && (
          <p id="radius-error" role="alert" className="mt-1 text-[11px] text-rose-400">
            {radiusError}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-[#24362c] bg-[#0a120e] p-3 text-[11px] leading-relaxed">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {context.title}
        </div>
        <p className="mt-1 text-slate-400">{context.body}</p>
        <div className="mt-2 flex items-center justify-between border-t border-[#1c2a23] pt-2">
          <span className="text-slate-500">Road</span>
          <span className="font-medium text-slate-300">{selectedRoadLabel ?? 'Not selected'}</span>
        </div>
      </div>

      {(!supported || intervention === 'green_corridor') && (
        <p
          role="note"
          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300"
        >
          {!supported
            ? `“${INTERVENTION_LABELS[intervention]}” is available for planning notes but is not yet supported by the simulation engine, so a simulation cannot be run.`
            : 'The engine will respond with a “not modelled” status because no habitat dataset is available.'}
        </p>
      )}
    </div>
  )
}
