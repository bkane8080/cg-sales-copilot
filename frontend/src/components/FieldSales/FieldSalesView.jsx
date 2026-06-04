import React, { useState, useEffect } from 'react'
import { MapPin, Clock, AlertTriangle, CheckCircle, MessageSquare, Navigation, ChevronRight } from 'lucide-react'
import StoreKPIPanel from './StoreKPIPanel'
import VelvetAssistant from './VelvetAssistant'
import RetailExecution from './RetailExecution'
import { getVisits, getStores } from '../../api'

export default function FieldSalesView() {
  const [visits, setVisits] = useState([])
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [activeTab, setActiveTab] = useState('kpis')
  const REP_ID = 1

  useEffect(() => {
    Promise.all([getVisits(REP_ID), getStores()])
      .then(([v, s]) => {
        setVisits(v.data)
        setStores(s.data)
        if (v.data.length > 0) setSelectedStore(v.data[0].STORE_ID)
      })
      .catch(console.error)
  }, [])

  const statusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} className="text-emerald-500" />
      case 'Urgent': return <AlertTriangle size={16} className="text-red-500 animate-pulse" />
      default: return <Clock size={16} className="text-blue-500" />
    }
  }

  const statusColor = (status) => ({
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Urgent: 'bg-red-50 text-red-700 border border-red-200',
    Planned: 'bg-blue-50 text-blue-700 border border-blue-200'
  }[status] || 'bg-gray-50 text-gray-700')

  const selectedVisit = visits.find(v => v.STORE_ID === selectedStore)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
      {/* Left Panel - Route */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
          <div className="p-5 bg-gradient-to-r from-velvet-dark to-velvet-navy text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Navigation size={18} className="text-velvet-gold" />
                  Route du Jour
                </h2>
                <p className="text-xs text-gray-400 mt-1">Paris Ouest · {visits.length} visites</p>
              </div>
              <span className="text-xs bg-velvet-gold/20 text-velvet-gold px-2 py-1 rounded-full">
                {visits.filter(v => v.STATUS === 'Completed').length}/{visits.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-hide">
            {visits.map((visit, idx) => (
              <div key={visit.VISIT_ID}
                onClick={() => setSelectedStore(visit.STORE_ID)}
                className={`p-4 cursor-pointer transition-all hover:bg-velvet-gold/5 ${
                  selectedStore === visit.STORE_ID ? 'bg-velvet-gold/10 border-l-4 border-velvet-gold' : 'border-l-4 border-transparent'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    {idx < visits.length - 1 && <div className="w-px h-6 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon(visit.STATUS)}
                        <span className="font-medium text-sm text-gray-900 truncate">{visit.RETAILER_NAME}</span>
                      </div>
                      <ChevronRight size={14} className={`text-gray-300 transition-transform ${selectedStore === visit.STORE_ID ? 'text-velvet-gold rotate-90' : ''}`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{visit.ADDRESS}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(visit.SCHEDULED_DATETIME).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(visit.STATUS)}`}>
                        {visit.STATUS}
                      </span>
                    </div>
                    {visit.AI_RECOMMENDATION_NOTES && (
                      <p className="text-xs text-velvet-accent mt-2 italic line-clamp-2 bg-blue-50/50 rounded p-1.5">
                        {visit.AI_RECOMMENDATION_NOTES}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Store Detail */}
      <div className="lg:col-span-8 xl:col-span-9">
        {selectedStore ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('kpis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'kpis' ? 'bg-velvet-dark text-velvet-gold' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                Store KPIs
              </button>
              <button onClick={() => setActiveTab('execution')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'execution' ? 'bg-velvet-dark text-velvet-gold' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                Retail Execution
              </button>
            </div>

            {activeTab === 'kpis' && <StoreKPIPanel storeId={selectedStore} />}
            {activeTab === 'execution' && <RetailExecution storeId={selectedStore} visit={selectedVisit} />}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <MapPin size={56} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Sélectionnez une visite</h3>
            <p className="text-sm text-gray-400 mt-2">Cliquez sur un point de vente pour voir les KPIs</p>
          </div>
        )}
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-velvet-dark to-velvet-navy rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-all z-50 group ring-4 ring-velvet-gold/20">
        <MessageSquare size={22} className="text-velvet-gold group-hover:scale-110 transition-transform" />
      </button>

      {showAssistant && <VelvetAssistant storeId={selectedStore} onClose={() => setShowAssistant(false)} />}
    </div>
  )
}
