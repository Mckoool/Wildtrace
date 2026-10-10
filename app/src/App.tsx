import { useEffect, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
} from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import Papa from 'papaparse'
import 'leaflet/dist/leaflet.css'
import './App.css'


// Humid Chaco, Paraguay (approximate centre of the study area)
const HUMID_CHACO_CENTER: [number, number] = [-23.3, -58.03]
const DATA_URL = `${import.meta.env.BASE_URL}data/jaguar_movement_data.csv`
const ROADS_URL = `${import.meta.env.BASE_URL}data/roads.geojson`

type LayerKey = 'points' | 'trails' | 'roads' | 'vegetation' | 'water'

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'points', label: 'GPS observation points' },
  { key: 'trails', label: 'Jaguar movement trails' },
  { key: 'roads', label: 'Roads' },
  { key: 'vegetation', label: 'Vegetation' },
  { key: 'water', label: 'Water' },
]

interface Observation {
  eventId: string
  timestamp: string
  tagId: string
  lat: number
  lng: number
}

function parseObservations(rows: Papa.ParseResult<Record<string, string>>) {
  const observations: Observation[] = []

  for (const row of rows.data) {
    const latRaw = row['location.lat']?.trim()
    const lngRaw = row['location.long']?.trim()
    if (latRaw === undefined || lngRaw === undefined) continue
    if (latRaw === '' || lngRaw === '') continue

    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

    const eventId = row['Event_ID']?.trim()
    const timestamp = row['timestamp']?.trim()
    const tagId = row['tag.local.identifier']?.trim()
    if (eventId === undefined || timestamp === undefined || tagId === undefined) continue

    observations.push({ eventId, timestamp, tagId, lat, lng })
  }

    observations.sort((a, b) => {
    return Date.parse(a.timestamp) - Date.parse(b.timestamp)
  })

  return observations
}

function App() {
  const [observations, setObservations] = useState<Observation[]>([])

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    points: true,
    trails: true,
    roads: false,
    vegetation: false,
    water: false,
  })

  const [roadData, setRoadData] = useState<FeatureCollection | null>(null)
  const [roadError, setRoadError] = useState<string | null>(null)

  const toggleLayer = (key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  
  const observationsByTag = new Map<string, Observation[]>()

  for (const obs of observations) {
    const existing = observationsByTag.get(obs.tagId) ?? []
    existing.push(obs)
    observationsByTag.set(obs.tagId, existing)
  }
for (const group of observationsByTag.values()) {
  group.sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  )
}

  const displayLimit = 2500

  const displayObservations =
  observations.length > displayLimit
    ? observations.filter(
        (_, index) =>
          index % Math.ceil(observations.length / displayLimit) === 0
      )
    : observations

  useEffect(() => {
    Papa.parse<Record<string, string>>(DATA_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => setObservations(parseObservations(results)),
    })
  }, [])

  // Load the local roads GeoJSON (no network requests). Toggling the "Roads"
  // layer renders it; a missing/broken file surfaces a non-blocking notice
  // instead of crashing the map.
  useEffect(() => {
    let cancelled = false

    const loadRoads = async () => {
      try {
        const response = await fetch(ROADS_URL)
        if (!response.ok) {
          throw new Error(
            `Roads data request failed (HTTP ${response.status})`,
          )
        }
        const data = (await response.json()) as FeatureCollection
        if (!data || !Array.isArray(data.features)) {
          throw new Error(
            'Roads file is not a valid GeoJSON FeatureCollection',
          )
        }
        if (!cancelled) setRoadData(data)
      } catch (error) {
        if (!cancelled) {
          setRoadError(
            error instanceof Error
              ? error.message
              : 'Failed to load roads data',
          )
        }
      }
    }

    void loadRoads()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main>
      <h1>Jaguar movement — Humid Chaco, Paraguay</h1>
      <p>Total valid observations: {observations.length.toLocaleString()}</p>
      <div className="map-wrap">
      <MapContainer
        center={HUMID_CHACO_CENTER}
        zoom={9}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

    {layers.roads &&
      roadData && (
        <GeoJSON
          data={roadData}
          style={{ color: '#b0aaa0', weight: 1, opacity: 0.7 }}
          interactive={false}
        />
      )}
        
    {layers.trails &&
      Array.from(observationsByTag.entries()).map(([tagId, group]) => {
    const trailPoints = group
      .filter((_, index) => index % 10 === 0)
      .map((obs) => [obs.lat, obs.lng] as [number, number])

    if (trailPoints.length < 2) return null

    return (
    <Polyline
      key={tagId}
      positions={trailPoints}
      pathOptions={{
        color: '#16866b',
        weight: 2,
        opacity: 0.65,
      }}
    />
   )
})}

        {layers.points &&
          displayObservations.map((obs) => (
          <CircleMarker
            key={obs.eventId}
            center={[obs.lat, obs.lng] as [number, number]}
          >
            <Popup>
              <strong>Event_ID:</strong> {obs.eventId}
              <br />
              <strong>timestamp:</strong> {obs.timestamp}
              <br />
              <strong>tag.local.identifier:</strong> {obs.tagId}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <aside className="layer-panel">
        <span className="layer-panel__title">Layers</span>
        {LAYERS.map((layer) => (
          <label className="layer-row" key={layer.key}>
            <input
              type="checkbox"
              checked={layers[layer.key]}
              onChange={() => toggleLayer(layer.key)}
            />
            {layer.label}
          </label>
        ))}
      </aside>
      {roadError && (
        <p className="layer-notice" role="status">
          Roads layer unavailable: {roadError}
        </p>
      )}
      </div>
    </main>
  )
}

export default App