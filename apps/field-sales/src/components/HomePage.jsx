import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, MessageSquare, TrendingUp, Target, BarChart3, Store, Calendar, Settings, Plus, Map, List, Home } from 'lucide-react'
import { getVisits, getRepKPIs, getRepVisitsMonth, getRepProfile, createVisit } from '../api'
import RouteMapView from './RouteMapView'

const BRAND_COLORS = {
  'Sephora': 'from-gray-900 to-gray-700',
  'Marionnaud': 'from-rose-900 to-rose-700',
  'Nocibé': 'from-purple-900 to-purple-700',
  'Galeries Lafayette': 'from-amber-900 to-amber-700',
  'Printemps': 'from-emerald-900 to-emerald-700',
  'Beauty Success': 'from-teal-900 to-teal-700',
}

const MEUDON_COORDS = { lat: 48.8133, lng: 2.2350 }

export default function HomePage() {
  const [visits, setVisits] = useState([])
  const [territoryKpis, setTerritoryKpis] = useState(null)
  const [visitsMonth, setVisitsMonth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list')
  const [homeAddress, setHomeAddress] = useState('6 Av. le Corbeiller, 92190 Meudon')
  const [homeCoords, setHomeCoords] = useState(MEUDON_COORDS)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getVisits(), getRepKPIs(), getRepVisitsMonth(), getRepProfile()])
      .then(([visitsRes, kpisRes, visitsMonthRes, repRes]) => {
        setVisits(visitsRes.data)
        setTerritoryKpis(kpisRes.data)
        setVisitsMonth(visitsMonthRes.data.VISITS_THIS_MONTH || 0)
        if (repRes.data.HOME_ADDRESS) {
          setHomeAddress(repRes.data.HOME_ADDRESS)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const today = new Date()
  const dateStr = selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const dayStr = selectedDate.toLocaleDateString('en-GB', { weekday: 'long' })
  const isToday = selectedDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]

  const visitsForDate = visits.filter(v => {
    const vDate = v.SCHEDULED_DATETIME.split(' ')[0].split('T')[0]
    const selStr = selectedDate.toISOString().split('T')[0]
    return vDate === selStr
  })

  const urgentCount = visitsForDate.filter(v => v.STATUS === 'Urgent').length

  const navigateDay = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const statusColor = (status) => ({
    Completed: 'bg-emerald-500',
    Urgent: 'bg-red-500',
    Planned: 'bg-blue-500'
  }[status] || 'bg-gray-400')

  const handleAddVisitFromMap = async (store) => {
    const dateS = selectedDate.toISOString().split('T')[0]
    try {
      await createVisit({ rep_id: 1, store_id: store.STORE_ID, scheduled_datetime: `${dateS} 12:00:00`, status: 'Planned' })
      const res = await getVisits()
      setVisits(res.data)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="pb-24 h-screen flex flex-col">
      <div className="bg-velvet-dark px-5 pt-12 pb-6 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Hello, Eric</h1>
            <p className="text-gray-400 text-sm mt-0.5">{visits.length} visits planned · Paris West</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-velvet-gold flex items-center justify-center">
            <span className="text-velvet-dark font-bold text-xs">ES</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Sell-Out</span>
              <TrendingUp size={12} className="text-emerald-400" />
            </div>
            <p className="text-white text-xl font-bold">{territoryKpis?.TOTAL_SELL_OUT ? Math.round(territoryKpis.TOTAL_SELL_OUT).toLocaleString() : '—'}</p>
            <p className="text-gray-500 text-[10px]">units/month territory</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">DN</span>
              <Target size={12} className="text-velvet-gold" />
            </div>
            <p className="text-white text-xl font-bold">{territoryKpis?.DISTRIBUTION_RATE || '—'}<span className="text-sm">%</span></p>
            <p className="text-gray-500 text-[10px]">distribution</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Visits</span>
              <CheckCircle size={12} className="text-emerald-400" />
            </div>
            <p className="text-white text-xl font-bold">{visitsMonth}<span className="text-sm text-gray-400">/month</span></p>
            <p className="text-gray-500 text-[10px]">this month</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Market Share</span>
              <BarChart3 size={12} className="text-blue-400" />
            </div>
            <p className="text-white text-xl font-bold">{territoryKpis?.AVG_MARKET_SHARE || '—'}<span className="text-sm">%</span></p>
            <p className="text-gray-500 text-[10px]">avg territory</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 flex items-center justify-between flex-shrink-0">
        <button onClick={() => navigateDay(-1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 capitalize">{isToday ? 'Today' : dayStr}</p>
          <p className="text-xs text-gray-500">{dateStr}</p>
        </div>
        <button onClick={() => navigateDay(1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="px-5 mt-4 mb-3 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900">
          {visitsForDate.length} visit{visitsForDate.length !== 1 ? 's' : ''}
          {urgentCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle size={10} /> {urgentCount} urgent
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('map')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              <Map size={14} />
            </button>
          </div>
          <button onClick={() => navigate('/new-visit')}
            className="flex items-center gap-1 text-xs text-velvet-dark bg-velvet-gold/20 px-2.5 py-1.5 rounded-full font-medium">
            <Plus size={11} /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === 'map' && visitsForDate.length > 0 ? (
          <div className="px-5 h-full pb-2" style={{ minHeight: '300px' }}>
            <RouteMapView
              visits={visitsForDate}
              homeAddress={homeAddress}
              homeCoords={homeCoords}
              onAddVisit={handleAddVisitFromMap}
            />
          </div>
        ) : (
          <div className="px-5 space-y-3 overflow-y-auto h-full pb-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
            ) : visitsForDate.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MapPin size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No visits scheduled</p>
                <button onClick={() => navigate('/new-visit')} className="mt-3 text-xs text-velvet-dark bg-velvet-gold/20 px-4 py-2 rounded-full font-medium">
                  + Schedule a visit
                </button>
              </div>
            ) : (
              visitsForDate.map((visit) => (
                <div key={visit.VISIT_ID}
                  onClick={() => navigate(`/store/${visit.STORE_ID}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
                  <div className="flex">
                    <div className={`w-24 h-24 relative flex-shrink-0 bg-gradient-to-br ${BRAND_COLORS[visit.RETAILER_NAME] || 'from-gray-800 to-gray-600'} flex items-center justify-center`}>
                      <span className="text-white/90 text-[10px] font-bold text-center px-1 leading-tight">{visit.RETAILER_NAME}</span>
                      <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full ${statusColor(visit.STATUS)} shadow-sm`} />
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">{visit.STORE_NAME || visit.RETAILER_NAME}</h3>
                          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{visit.ADDRESS}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={11} />
                          <span>{new Date(visit.SCHEDULED_DATETIME).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          visit.STATUS === 'Urgent' ? 'bg-red-100 text-red-700' :
                          visit.STATUS === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{visit.STATUS}</span>
                      </div>
                      {visit.AI_RECOMMENDATION_NOTES && (
                        <p className="text-[11px] text-velvet-accent mt-1 line-clamp-1 italic">
                          {visit.AI_RECOMMENDATION_NOTES}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom max-w-md mx-auto lg:max-w-none z-50">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-0.5 text-velvet-dark">
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/pos')} className="flex flex-col items-center gap-0.5 text-gray-400">
            <Store size={20} />
            <span className="text-[10px] font-medium">POS</span>
          </button>
          <button onClick={() => navigate('/calendar')} className="flex flex-col items-center gap-0.5 text-gray-400">
            <Calendar size={20} />
            <span className="text-[10px] font-medium">Agenda</span>
          </button>
          <button onClick={() => navigate('/assistant')} className="flex flex-col items-center gap-0.5 text-gray-400">
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium">Assistant</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-0.5 text-gray-400">
            <Settings size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
