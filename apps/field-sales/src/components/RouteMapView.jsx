import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Plus, RotateCcw, Clock } from 'lucide-react'
import { optimizeRoute, getStores, createVisit } from '../api'
import 'leaflet/dist/leaflet.css'

const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#1a1a2e;border:3px solid #d4af37;border-radius:50%;display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const visitIcon = (index, color) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:${color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="color:white;font-size:11px;font-weight:700">${index + 1}</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const BRAND_HEX = {
  'Sephora': '#1f2937',
  'Marionnaud': '#9f1239',
  'Nocibé': '#581c87',
  'Galeries Lafayette': '#78350f',
  'Printemps': '#064e3b',
  'Beauty Success': '#134e4a',
}

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [bounds, map])
  return null
}

export default function RouteMapView({ visits, homeAddress, homeCoords, onAddVisit }) {
  const navigate = useNavigate()
  const [routeGeometry, setRouteGeometry] = useState([])
  const [totalDistance, setTotalDistance] = useState(null)
  const [durationMin, setDurationMin] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [stores, setStores] = useState([])
  const [storeSearch, setStoreSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const waypoints = useMemo(() => visits.filter(v => v.LOCATION_LAT).map(v => ({
    lat: v.LOCATION_LAT,
    lng: v.LOCATION_LONG,
    store_id: v.STORE_ID,
    name: v.STORE_NAME,
    brand: v.RETAILER_NAME,
    time: v.SCHEDULED_DATETIME,
  })), [visits])

  const runOptimization = async () => {
    if (waypoints.length === 0) return
    setLoading(true)
    try {
      const res = await optimizeRoute(waypoints, homeCoords)
      setRouteGeometry(res.data.geometry || [])
      setTotalDistance(res.data.total_distance_km)
      setDurationMin(res.data.duration_min)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { runOptimization() }, [waypoints, homeCoords])

  const bounds = useMemo(() => {
    const pts = []
    if (homeCoords) pts.push([homeCoords.lat, homeCoords.lng])
    visits.forEach(v => { if (v.LOCATION_LAT) pts.push([v.LOCATION_LAT, v.LOCATION_LONG]) })
    return pts.length > 0 ? pts : [[48.8, 2.3]]
  }, [visits, homeCoords])

  const handleAddWaypoint = async (store) => {
    setShowAddPanel(false)
    setStoreSearch('')
    if (onAddVisit) onAddVisit(store)
  }

  const loadStores = () => {
    if (stores.length === 0) {
      getStores().then(res => setStores(res.data)).catch(() => {})
    }
    setShowAddPanel(true)
  }

  const filteredStores = storeSearch.length >= 2
    ? stores.filter(s => s.STORE_NAME.toLowerCase().includes(storeSearch.toLowerCase())).slice(0, 8)
    : []

  const center = homeCoords ? [homeCoords.lat, homeCoords.lng] : [48.85, 2.35]

  return (
    <div className="relative h-full">
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button onClick={runOptimization} disabled={loading}
          className="bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 active:scale-95 transition-transform disabled:opacity-50">
          <RotateCcw size={13} className={loading ? 'animate-spin' : ''} /> Optimize
        </button>
        <button onClick={loadStores}
          className="bg-velvet-dark shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-white active:scale-95 transition-transform">
          <Plus size={13} /> Add Stop
        </button>
      </div>

      {totalDistance !== null && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center gap-1.5">
            <Navigation size={12} className="text-velvet-gold" />
            <span className="text-xs font-semibold text-gray-800">{totalDistance} km</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-gray-500">{visits.length} stops</p>
            {durationMin > 0 && (
              <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <Clock size={9} /> {durationMin} min
              </p>
            )}
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={12} className="h-full w-full rounded-2xl" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />

        {routeGeometry.length > 1 && (
          <Polyline positions={routeGeometry} pathOptions={{ color: '#1a1a2e', weight: 4, opacity: 0.85 }} />
        )}

        {homeCoords && (
          <Marker position={[homeCoords.lat, homeCoords.lng]} icon={homeIcon}>
            <Popup><strong>Home</strong><br/>{homeAddress}</Popup>
          </Marker>
        )}

        {visits.filter(v => v.LOCATION_LAT).map((v, i) => (
          <Marker key={v.VISIT_ID || i}
            position={[v.LOCATION_LAT, v.LOCATION_LONG]}
            icon={visitIcon(i, BRAND_HEX[v.RETAILER_NAME] || '#374151')}
          >
            <Popup>
              <div className="text-xs">
                <strong>{v.STORE_NAME}</strong><br/>
                {v.RETAILER_NAME}<br/>
                {new Date(v.SCHEDULED_DATETIME).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showAddPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 p-4 max-h-[50%] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Add a Stop</h3>
            <button onClick={() => setShowAddPanel(false)} className="text-xs text-gray-500">Cancel</button>
          </div>
          <input
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
            placeholder="Search stores..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30 mb-2"
            autoFocus
          />
          <div className="space-y-1">
            {filteredStores.map(s => (
              <button key={s.STORE_ID} onClick={() => handleAddWaypoint(s)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <p className="text-sm font-medium text-gray-800">{s.STORE_NAME}</p>
                <p className="text-xs text-gray-500">{s.ADDRESS}</p>
              </button>
            ))}
            {storeSearch.length >= 2 && filteredStores.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No stores found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
