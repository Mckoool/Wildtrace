import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Humid Chaco, Paraguay (approximate centre of the study area)
const HUMID_CHACO_CENTER: [number, number] = [-23.3, -58.03]

function App() {
  return (
    <main>
      <h1>Jaguar movement — Humid Chaco, Paraguay</h1>
      <MapContainer
        center={HUMID_CHACO_CENTER}
        zoom={9}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </main>
  )
}

export default App