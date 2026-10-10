import { LAYER_DEFS, type LayerKey } from '../lib/mapLayers'

interface MapLegendProps {
  layers: Record<LayerKey, boolean>
}

export function MapLegend({ layers }: MapLegendProps) {
  const visible = LAYER_DEFS.filter((layer) => layers[layer.key] && layer.available)

  return (
    <div className="w-56 rounded-xl border border-[#24362c] bg-[#0a120e]/95 p-3 backdrop-blur">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Legend
      </div>
      <ul className="flex flex-col gap-1.5">
        {visible.map((layer) => (
          <li key={layer.key} className="flex items-center gap-2.5 text-[11px] text-slate-300">
            <LegendSwatch color={layer.color} kind={layer.kind} />
            <span>{layer.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 border-t border-[#1c2a23] pt-2 text-[10px] leading-relaxed text-slate-500">
        All geographic layers are model inputs, not verified field observations.
      </div>
    </div>
  )
}

function LegendSwatch({ color, kind }: { color: string; kind: string }) {
  if (kind === 'point') {
    return (
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    )
  }
  if (kind === 'area') {
    return (
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm border"
        style={{ backgroundColor: `${color}40`, borderColor: color }}
      />
    )
  }
  return (
    <span
      className="h-0.5 w-4 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}
