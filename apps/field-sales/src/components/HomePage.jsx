import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, MessageSquare, TrendingUp, Target, BarChart3, Store, Calendar, Plus } from 'lucide-react'
import { getVisits, getStoreKPIs } from '../api'

const STORE_IMAGES = {
  'Sephora': 'https://images.unsplash.com/photo-1604754742629-3f5d4b3e5d3e?w=400&h=200&fit=crop',
  'Marionnaud': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=200&fit=crop',
  'Nocibé': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=200&fit=crop',
  'Galeries Lafayette': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=200&fit=crop',
  'Printemps': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
}

export default function HomePage() {
  const [visits, setVisits] = useState([])
  const [heroKpis, setHeroKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const navigate = useNavigate()
  const REP_ID = 1

  useEffect(() => {
    getVisits(REP_ID)
      .then(res => {
        setVisits(res.data)
        if (res.data.length > 0) {
          getStoreKPIs(res.data[0].STORE_ID).then(k => setHeroKpis(k.data)).catch(() => {})
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const today = new Date()
  const dateStr = selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const dayStr = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })
  const isToday = selectedDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]

  const visitsForDate = visits.filter(v => {
    const vDate = v.SCHEDULED_DATETIME.split(' ')[0].split('T')[0]
    const selStr = selectedDate.toISOString().split('T')[0]
    return vDate === selStr
  })

  const completedCount = visits.filter(v => v.STATUS === 'Completed').length
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

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Bonjour, Eric</h1>
            <p className="text-gray-400 text-sm mt-0.5">{visits.length} visites planifiées · Paris Ouest</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-velvet-gold flex items-center justify-center">
            <span className="text-velvet-dark font-bold text-xs">ES</span>
          </div>
        </div>

        {/* KPI Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Sell-Out</span>
              <TrendingUp size={12} className="text-emerald-400" />
            </div>
            <p className="text-white text-xl font-bold">{heroKpis?.AVG_SELL_OUT || '—'}</p>
            <p className="text-gray-500 text-[10px]">u/semaine</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">DN</span>
              <Target size={12} className="text-velvet-gold" />
            </div>
            <p className="text-white text-xl font-bold">{heroKpis?.DISTRIBUTION_RATE || '—'}<span className="text-sm">%</span></p>
            <p className="text-gray-500 text-[10px]">distribution</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Visites</span>
              <CheckCircle size={12} className="text-emerald-400" />
            </div>
            <p className="text-white text-xl font-bold">{completedCount}<span className="text-sm text-gray-400">/{visits.length}</span></p>
            <p className="text-gray-500 text-[10px]">complétées</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-medium">PDM</span>
              <BarChart3 size={12} className="text-blue-400" />
            </div>
            <p className="text-white text-xl font-bold">{heroKpis?.AVG_MARKET_SHARE || '—'}<span className="text-sm">%</span></p>
            <p className="text-gray-500 text-[10px]">part de marché</p>
          </div>
        </div>
      </div>

      {/* Day Navigation - Simple prev/next */}
      <div className="px-5 mt-5 flex items-center justify-between">
        <button onClick={() => navigateDay(-1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900 capitalize">{isToday ? "Aujourd'hui" : dayStr}</p>
          <p className="text-xs text-gray-500">{dateStr}</p>
        </div>
        <button onClick={() => navigateDay(1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Visit Section Header */}
      <div className="px-5 mt-4 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          {visitsForDate.length} visite{visitsForDate.length !== 1 ? 's' : ''}
          {urgentCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle size={10} /> {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <button onClick={() => navigate('/new-visit')}
          className="flex items-center gap-1 text-xs text-velvet-dark bg-velvet-gold/20 px-2.5 py-1 rounded-full font-medium">
          <Plus size={11} /> Ajouter
        </button>
      </div>

      {/* Store Visit Cards */}
      <div className="px-5 space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))
        ) : visitsForDate.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MapPin size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Aucune visite ce jour</p>
            <button onClick={() => navigate('/new-visit')} className="mt-3 text-xs text-velvet-dark bg-velvet-gold/20 px-4 py-2 rounded-full font-medium">
              + Planifier une visite
            </button>
          </div>
        ) : (
          visitsForDate.map((visit) => (
            <div key={visit.VISIT_ID}
              onClick={() => navigate(`/store/${visit.STORE_ID}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex">
                <div className="w-28 h-28 relative flex-shrink-0">
                  <img
                    src={STORE_IMAGES[visit.RETAILER_NAME] || STORE_IMAGES['Sephora']}
                    alt={visit.STORE_NAME || visit.RETAILER_NAME}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full ${statusColor(visit.STATUS)} shadow-sm`} />
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{visit.STORE_NAME || visit.RETAILER_NAME}</h3>
                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{visit.ADDRESS}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{visit.RETAILER_NAME} · {visit.STORE_TYPE}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>{new Date(visit.SCHEDULED_DATETIME).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      visit.STATUS === 'Urgent' ? 'bg-red-100 text-red-700' :
                      visit.STATUS === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{visit.STATUS}</span>
                  </div>
                  {visit.AI_RECOMMENDATION_NOTES && (
                    <p className="text-[11px] text-velvet-accent mt-1.5 line-clamp-1 italic">
                      {visit.AI_RECOMMENDATION_NOTES}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom max-w-md mx-auto lg:max-w-none">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-0.5 text-velvet-dark">
            <MapPin size={20} />
            <span className="text-[10px] font-medium">Route</span>
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
        </div>
      </nav>
    </div>
  )
}
