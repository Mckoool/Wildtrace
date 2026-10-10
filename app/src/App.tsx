import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { WildlifeMap } from './components/WildlifeMap'
import { MapLayerControls } from './components/MapLayerControls'
import { MapLegend } from './components/MapLegend'
import { InterventionPlanner } from './components/InterventionPlanner'
import { SimulationResults } from './components/SimulationResults'
import { OverviewPanel } from './components/OverviewPanel'
import { LayersPanel } from './components/LayersPanel'
import { ReportsPanel } from './components/ReportsPanel'
import { EmptyState } from './components/EmptyState'
import { Icon } from './components/Icon'
import { useWildlifeData } from './hooks/useWildlifeData'
import { useRoadData } from './hooks/useRoadData'
import { useCandidateRoads } from './hooks/useCandidateRoads'
import { useSimulation } from './hooks/useSimulation'
import { DEFAULT_LAYERS, type LayerKey } from './lib/mapLayers'
import { SPECIES, STUDY_AREAS, type ViewId } from './lib/nav'
import { indexSummaries } from './lib/geo'
import { extractInterventionOverlay } from './lib/simulationView'
import {
  isApiConfigured,
  isSupportedIntervention,
  type InterventionInput,
  type InterventionType,
} from './api/simulation'
import 'leaflet/dist/leaflet.css'
import './App.css'

const VIEW_TITLES: Record<ViewId, string> = {
  overview: 'Study Overview',
  map: 'Map Layers',
  simulations: 'Simulation Results',
  planner: 'Intervention Planner',
  reports: 'Reports',
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('planner')
  const [studyAreaId, setStudyAreaId] = useState(STUDY_AREAS[0].id)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ ...DEFAULT_LAYERS })
  const [intervention, setIntervention] = useState<InterventionType>('overpass')
  const [selectedRoadId, setSelectedRoadId] = useState<number | null>(null)
  const [radiusM, setRadiusM] = useState(500)

  const wildlife = useWildlifeData()
  const roadData = useRoadData()
  const candidates = useCandidateRoads(roadData.roads, roadData.loading)
  const simulation = useSimulation(candidates.roads)

  const studyArea = STUDY_AREAS.find((area) => area.id === studyAreaId) ?? STUDY_AREAS[0]

  const summaryMap = useMemo(
    () => indexSummaries(candidates.summaries),
    [candidates.summaries],
  )

  const selectedSummary = selectedRoadId !== null ? summaryMap.get(selectedRoadId) ?? null : null

  const interventionOverlay = useMemo(
    () => (simulation.result ? extractInterventionOverlay(simulation.result) : null),
    [simulation.result],
  )

  // Drop a stale selection if the candidate set changes (e.g. backend ↔ demo).
  useEffect(() => {
    if (selectedRoadId === null) return
    if (!candidates.loading && !candidates.roads.some((road) => road.roadId === selectedRoadId)) {
      setSelectedRoadId(null)
    }
  }, [candidates.roads, candidates.loading, selectedRoadId])

  const radiusError = useMemo(() => {
    if (!Number.isFinite(radiusM)) return 'Enter a numeric radius.'
    if (radiusM <= 0) return 'Radius must be greater than 0 m.'
    if (radiusM > 5000) return 'Radius must be 5000 m or less.'
    return null
  }, [radiusM])

  const issues = useMemo(() => {
    const list: string[] = []
    if (!isSupportedIntervention(intervention)) {
      list.push('The selected intervention is not supported by the simulation engine.')
    }
    if (selectedRoadId === null) {
      list.push('Select a candidate road from the list or the map.')
    }
    if (candidates.loading) {
      list.push('Candidate roads are still loading.')
    }
    if (candidates.error) {
      list.push(`Candidate roads unavailable: ${candidates.error}`)
    }
    if (radiusError) {
      list.push(radiusError)
    }
    return list
  }, [intervention, selectedRoadId, candidates.loading, candidates.error, radiusError])

  const canRun = issues.length === 0 && simulation.status !== 'loading'

  const handleToggleLayer = (key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectRoad = (roadId: number) => {
    setSelectedRoadId(roadId)
    simulation.reset()
  }

  const handleInterventionChange = (value: InterventionType) => {
    setIntervention(value)
    simulation.reset()
  }

  const handleRun = () => {
    if (!canRun || selectedRoadId === null || !isSupportedIntervention(intervention)) return
    const input: InterventionInput = {
      intervention,
      road_id: selectedRoadId,
      radius_m: radiusM,
    }
    setActiveView('simulations')
    void simulation.run(input)
  }

  const handleReset = () => {
    simulation.reset()
    setActiveView('planner')
  }

  const mapEmpty =
    !wildlife.loading &&
    wildlife.totalCount === 0 &&
    !roadData.roads &&
    candidates.roads.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-[#08110d] text-slate-200 lg:h-screen lg:flex-row lg:overflow-hidden">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        studyAreas={STUDY_AREAS}
        studyAreaId={studyAreaId}
        onStudyAreaChange={setStudyAreaId}
        species={SPECIES}
        observationCount={wildlife.totalCount}
        status={{
          source: candidates.source,
          backendConfigured: isApiConfigured(),
          candidateCount: candidates.summaries.length,
          loading: candidates.loading,
        }}
      />

      <main className="relative h-[52vh] min-h-[340px] w-full shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        {!mapEmpty && (
          <WildlifeMap
            center={studyArea.center}
            zoom={studyArea.zoom}
            layers={layers}
            observations={wildlife.displayObservations}
            trails={wildlife.trails}
            roadData={roadData.roads}
            candidateRoads={candidates.roads}
            summaries={summaryMap}
            selectedRoadId={selectedRoadId}
            onSelectRoad={handleSelectRoad}
            intervention={interventionOverlay}
          />
        )}

        {mapEmpty && (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              icon="map"
              title="No map data available"
              message="The GPS dataset and road network could not be loaded. Check that public/data contains jaguar_movement_data.csv and roads.geojson."
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <MapLayerControls layers={layers} onToggle={handleToggleLayer} compact />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="pointer-events-auto">
              <MapLegend layers={layers} />
            </div>
            {selectedRoadId !== null && (
              <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-sky-500/30 bg-[#0a120e]/95 px-3 py-2 text-[11px] text-sky-300 backdrop-blur">
                <Icon name="crosshair" size={13} />
                Selected road #{selectedRoadId}
                {selectedSummary ? ` · ${selectedSummary.highway}` : ''}
              </div>
            )}
          </div>
        </div>

        {wildlife.loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex justify-center p-3">
            <span className="rounded-full border border-[#24362c] bg-[#0a120e]/95 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
              Loading GPS observations…
            </span>
          </div>
        )}

        {wildlife.error && !wildlife.loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex justify-center p-3">
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-300">
              GPS dataset: {wildlife.error}
            </span>
          </div>
        )}
      </main>

      <aside className="flex w-full flex-col border-t border-[#1c2a23] bg-[#0c1611] lg:w-[392px] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1c2a23] bg-[#0c1611] px-5 py-4">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-100">
              {VIEW_TITLES[activeView]}
            </h1>
            <p className="text-[11px] text-slate-500">
              {studyArea.name}, {studyArea.country}
            </p>
          </div>
          <Icon name="planner" size={18} className="text-slate-600" />
        </header>

        <div className="px-5 py-5">
          {activeView === 'overview' && (
            <OverviewPanel
              studyArea={studyArea}
              species={SPECIES}
              observationCount={wildlife.totalCount}
              candidateCount={candidates.summaries.length}
              source={candidates.source}
              demoReason={candidates.demoReason}
              status={simulation.status}
              isDemo={simulation.isDemo}
              error={simulation.error}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'map' && (
            <LayersPanel
              layers={layers}
              onToggle={handleToggleLayer}
              source={candidates.source}
              roadCount={roadData.roads ? roadData.roads.features.length : null}
              candidateCount={candidates.roads.length}
            />
          )}

          {activeView === 'planner' && (
            <InterventionPlanner
              intervention={intervention}
              onInterventionChange={handleInterventionChange}
              candidates={candidates.summaries}
              selectedRoadId={selectedRoadId}
              onSelectRoad={handleSelectRoad}
              selectedSummary={selectedSummary}
              radiusM={radiusM}
              onRadiusChange={setRadiusM}
              radiusError={radiusError}
              issues={issues}
              canRun={canRun}
              status={simulation.status}
              isDemo={simulation.isDemo}
              demoReason={simulation.demoReason}
              error={simulation.error}
              onRun={handleRun}
              onReset={handleReset}
            />
          )}

          {activeView === 'simulations' && (
            <SimulationResults
              status={simulation.status}
              result={simulation.result}
              error={simulation.error}
              isDemo={simulation.isDemo}
              demoReason={simulation.demoReason}
              summary={selectedSummary}
            />
          )}

          {activeView === 'reports' && (
            <ReportsPanel
              status={simulation.status}
              result={simulation.result}
              error={simulation.error}
              isDemo={simulation.isDemo}
              demoReason={simulation.demoReason}
              summary={selectedSummary}
            />
          )}
        </div>
      </aside>
    </div>
  )
}
