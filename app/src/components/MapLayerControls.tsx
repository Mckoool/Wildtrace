import { Icon } from './Icon'
import { LAYER_DEFS, type LayerKey } from '../lib/mapLayers'

interface MapLayerControlsProps {
  layers: Record<LayerKey, boolean>
  onToggle: (key: LayerKey) => void
  compact?: boolean
}

export function MapLayerControls({ layers, onToggle, compact = false }: MapLayerControlsProps) {
  return (
    <div
      className={`rounded-xl border border-[#24362c] bg-[#0a120e]/95 backdrop-blur ${
        compact ? 'w-52 p-2.5' : 'p-3'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon name="layers" size={13} />
        Map layers
      </div>
      <div className="flex flex-col gap-0.5">
        {LAYER_DEFS.map((layer) => {
          const disabled = !layer.available
          return (
            <label
              key={layer.key}
              title={disabled ? 'No dataset available for this layer' : layer.description}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] ${
                disabled
                  ? 'cursor-not-allowed text-slate-600'
                  : 'cursor-pointer text-slate-300 hover:bg-white/5'
              }`}
            >
              <input
                type="checkbox"
                checked={layers[layer.key]}
                disabled={disabled}
                onChange={() => onToggle(layer.key)}
                className="h-3.5 w-3.5 accent-emerald-500 disabled:opacity-40"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: disabled ? '#3f4c44' : layer.color }}
              />
              <span className="flex-1">{layer.label}</span>
              {disabled && <span className="text-[10px] text-slate-600">n/a</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
