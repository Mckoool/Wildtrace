import { useEffect } from 'react'
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import 'leaflet/dist/leaflet.css'
import type { Observation, WildlifeTrail } from '../hooks/useWildlifeData'
import type { CandidateRoad, LatLng } from '../lib/geo'
import type { LayerKey } from '../lib/mapLayers'
import type { CandidateRoadSummary } from '../api/simulation'

export interface InterventionOverlay {
  point: LatLng
  radiusM: number
  title: string
  subtitle: string
}

interface WildlifeMapProps {
  center: [number, number]
  zoom: number
  layers: Record<LayerKey, boolean>
  observations: Observation[]
  trails: WildlifeTrail[]
  roadData: FeatureCollection | null
  candidateRoads: CandidateRoad[]
  summaries: Map<number, CandidateRoadSummary>
  selectedRoadId: number | null
  onSelectRoad: (roadId: number) => void
  intervention: InterventionOverlay | null
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

export function WildlifeMap({
  center,
  zoom,
  layers,
  observations,
  trails,
  roadData,
  candidateRoads,
  summaries,
  selectedRoadId,
  onSelectRoad,
  intervention,
}: WildlifeMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full bg-[#0a120e]"
      style={{ height: '100%', width: '100%' }}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="wildtrace-tiles"
      />
      <ZoomControl position="topright" />
      <MapRecenter center={center} zoom={zoom} />

      {layers.roads && roadData && (
        <GeoJSON
          data={roadData}
          style={{ color: '#5b6b62', weight: 1, opacity: 0.55 }}
          interactive={false}
        />
      )}

      {layers.trails &&
        trails.map((trail) => (
          <Polyline
            key={trail.tagId}
            positions={trail.positions}
            pathOptions={{ color: '#10b981', weight: 2, opacity: 0.55 }}
          />
        ))}

      {layers.candidates &&
        candidateRoads.map((road) => {
          const selected = road.roadId === selectedRoadId
          const summary = summaries.get(road.roadId)
          return (
            <Polyline
              key={road.roadId}
              positions={road.paths}
              pathOptions={{
                color: selected ? '#38bdf8' : '#f59e0b',
                weight: selected ? 4 : 2.5,
                opacity: selected ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelectRoad(road.roadId),
              }}
            >
              <Tooltip sticky>
                Road #{road.roadId} · {road.highway}
                {summary ? ` · ${summary.movement_segments} crossing segments` : ''}
              </Tooltip>
            </Polyline>
          )
        })}

      {layers.conflicts &&
        candidateRoads.map((road) => {
          const anchor = road.paths[0]?.[0]
          if (!anchor) return null
          const segments = summaries.get(road.roadId)?.movement_segments ?? road.movementSegments
          const radius = 4 + Math.min(segments, 60) / 6
          return (
            <CircleMarker
              key={`hotspot-${road.roadId}`}
              center={anchor}
              radius={radius}
              pathOptions={{
                color: '#fbbf24',
                fillColor: '#fbbf24',
                fillOpacity: 0.18,
                weight: 1,
              }}
              eventHandlers={{ click: () => onSelectRoad(road.roadId) }}
            >
              <Tooltip>
                Road #{road.roadId} · {segments} crossing segments (model)
              </Tooltip>
            </CircleMarker>
          )
        })}

      {layers.observations &&
        observations.map((obs) => (
          <CircleMarker
            key={obs.eventId}
            center={[obs.lat, obs.lng]}
            radius={3}
            pathOptions={{
              color: '#34d399',
              fillColor: '#34d399',
              fillOpacity: 0.35,
              weight: 0,
            }}
          >
            <Popup>
              <strong>Event_ID:</strong> {obs.eventId}
              <br />
              <strong>timestamp:</strong> {obs.timestamp}
              <br />
              <strong>tag:</strong> {obs.tagId}
            </Popup>
          </CircleMarker>
        ))}

      {layers.intervention && intervention && (
        <>
          <Circle
            center={[intervention.point.lat, intervention.point.lng]}
            radius={intervention.radiusM}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.08,
              weight: 1,
              dashArray: '4 4',
            }}
          />
          <CircleMarker
            center={[intervention.point.lat, intervention.point.lng]}
            radius={7}
            pathOptions={{ color: '#0ea5e9', fillColor: '#38bdf8', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <strong>{intervention.title}</strong>
              <br />
              {intervention.subtitle}
            </Popup>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  )
}
