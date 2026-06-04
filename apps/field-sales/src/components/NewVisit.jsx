import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, Check, Store } from 'lucide-react'
import { getStores, createVisit } from '../api'

export default function NewVisit() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedStore = searchParams.get('store')

  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(preselectedStore || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Planned')
  const [submitted, setSubmitted] = useState(false)
  const [storeSearch, setStoreSearch] = useState('')

  useEffect(() => {
    getStores().then(res => setStores(res.data)).catch(console.error)
  }, [])

  const filteredStores = stores.filter(s =>
    s.RETAILER_NAME.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.ADDRESS.toLowerCase().includes(storeSearch.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!selectedStore) return
    try {
      await createVisit({
        rep_id: 1,
        store_id: parseInt(selectedStore),
        scheduled_datetime: `${date} ${time}:00`,
        status,
        notes
      })
      setSubmitted(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (e) {
      alert('Erreur lors de la création')
    }
  }

  const selectedStoreData = stores.find(s => s.STORE_ID === parseInt(selectedStore))

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">Nouvelle Visite</h1>
        </div>
      </div>

      {submitted ? (
        <div className="px-5 mt-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Visite Créée</h2>
          <p className="text-sm text-gray-500 mt-1">Redirection...</p>
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-5">
          {/* Store Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Point de Vente</label>
            {!selectedStore ? (
              <div className="space-y-2">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Rechercher un magasin..."
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                  {filteredStores.slice(0, 8).map(store => (
                    <button key={store.STORE_ID} onClick={() => setSelectedStore(String(store.STORE_ID))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-velvet-gold/50 text-left transition-colors">
                      <Store size={14} className="text-velvet-gold flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{store.RETAILER_NAME}</p>
                        <p className="text-xs text-gray-500 truncate">{store.ADDRESS}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-velvet-gold/10 border border-velvet-gold/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-velvet-dark" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selectedStoreData?.RETAILER_NAME}</p>
                    <p className="text-xs text-gray-500">{selectedStoreData?.ADDRESS}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStore('')} className="text-xs text-velvet-accent font-medium">Changer</button>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Heure</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Statut</label>
            <div className="flex gap-2">
              {['Planned', 'Urgent'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    status === s
                      ? s === 'Urgent' ? 'bg-red-500 text-white' : 'bg-velvet-dark text-velvet-gold'
                      : 'bg-gray-100 text-gray-600'
                  }`}>{s === 'Planned' ? 'Planifiée' : 'Urgente'}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">Notes / Objectif</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Négocier 2ème facing pour Oud Mystique..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-velvet-gold/30" />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!selectedStore}
            className="w-full py-3.5 bg-velvet-dark text-velvet-gold rounded-xl text-sm font-semibold disabled:opacity-30 transition-all">
            Créer la Visite
          </button>
        </div>
      )}
    </div>
  )
}
