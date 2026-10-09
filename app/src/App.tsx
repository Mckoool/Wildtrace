import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import Papa from 'papaparse'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Humid Chaco, Paraguay (approximate centre of the study area)
const HUMID_CHACO_CENTER: [number, number] = [-23.3, -58.03]
const DATA_URL = `${import.meta.env.BASE_URL}data/jaguar_movement_data.csv`

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

  return (
    <main>
      <h1>Jaguar movement — Humid Chaco, Paraguay</h1>
      <p>Total valid observations: {observations.length.toLocaleString()}</p>
      <MapContainer
        center={HUMID_CHACO_CENTER}
        zoom={9}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {displayObservations.map((obs) => (
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
    </main>
  )
}

export default App