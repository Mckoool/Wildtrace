import type { IconName } from '../components/Icon'

/** Right-hand workspace sections. Each maps to a panel in the dashboard. */
export type ViewId = 'overview' | 'map' | 'simulations' | 'planner' | 'reports'

export interface NavItem {
  id: ViewId
  label: string
  icon: IconName
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'map', label: 'Wildlife Map', icon: 'map' },
  { id: 'simulations', label: 'Simulations', icon: 'simulation' },
  { id: 'planner', label: 'Intervention Planner', icon: 'planner' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
]

/** The five chapter/section panels the right side can render. */
export const WORKSPACE_VIEWS: ViewId[] = NAV_ITEMS.map((item) => item.id)

export interface StudyArea {
  id: string
  name: string
  country: string
  center: [number, number]
  zoom: number
}

export const STUDY_AREAS: StudyArea[] = [
  {
    id: 'humid-chaco',
    name: 'Humid Chaco',
    country: 'Paraguay',
    center: [-23.3, -58.03],
    zoom: 9,
  },
]

export interface Species {
  id: string
  commonName: string
  scientificName: string
  tags: number
}

export const SPECIES: Species = {
  id: 'panthera-onca',
  commonName: 'Jaguar',
  scientificName: 'Panthera onca',
  tags: 0,
}
