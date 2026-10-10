/** Map layer definitions shared by the controls and the legend. */

export type LayerKey =
  | 'observations'
  | 'trails'
  | 'roads'
  | 'candidates'
  | 'conflicts'
  | 'intervention'
  | 'habitat'

export type LayerKind = 'point' | 'line' | 'area'

export interface LayerDef {
  key: LayerKey
  label: string
  description: string
  kind: LayerKind
  color: string
  /** Layers without a bundled dataset are shown but not toggleable. */
  available: boolean
}

export const LAYER_DEFS: LayerDef[] = [
  {
    key: 'observations',
    label: 'GPS observations',
    description: 'Jaguar GPS fixes (panthera onca)',
    kind: 'point',
    color: '#34d399',
    available: true,
  },
  {
    key: 'trails',
    label: 'Movement trails',
    description: 'Chronological paths per tagged animal',
    kind: 'line',
    color: '#10b981',
    available: true,
  },
  {
    key: 'roads',
    label: 'Road network',
    description: 'OpenStreetMap road centrelines',
    kind: 'line',
    color: '#64748b',
    available: true,
  },
  {
    key: 'candidates',
    label: 'Candidate conflict roads',
    description: 'Roads crossed by observed movement',
    kind: 'line',
    color: '#f59e0b',
    available: true,
  },
  {
    key: 'conflicts',
    label: 'Conflict hotspots',
    description: 'Candidate roads sized by crossing count',
    kind: 'area',
    color: '#fbbf24',
    available: true,
  },
  {
    key: 'intervention',
    label: 'Intervention overlay',
    description: 'Proposed structure & influence radius',
    kind: 'area',
    color: '#38bdf8',
    available: true,
  },
  {
    key: 'habitat',
    label: 'Habitat zones',
    description: 'No land-cover dataset bundled',
    kind: 'area',
    color: '#4ade80',
    available: false,
  },
]

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  observations: true,
  trails: true,
  roads: true,
  candidates: true,
  conflicts: false,
  intervention: true,
  habitat: false,
}
