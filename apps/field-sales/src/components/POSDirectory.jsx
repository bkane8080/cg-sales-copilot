import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, MapPin, Store, ChevronRight, Package, TrendingUp, Target, PieChart, BarChart3, Phone, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { getStores, getStoreKPIs, getStorePerformance } from '../api'

export default function POSDirectory() {
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [search, setSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStores().then(res => { setStores(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filteredStores = stores.filter(s =>
    s.RETAILER_NAME.toLowerCase().includes(search.toLowerCase()) ||
    s.ADDRESS.toLowerCase().includes(search.toLowerCase()) ||
    s.REGION.toLowerCase().includes(search.toLowerCase())
  )

  const selectStore = (store) => {
    setSelectedStore(store)
    Promise.all([getStoreKPIs(store.STORE_ID), getStorePerformance(store.STORE_ID)])
      .then(([k, p]) => { setKpis(k.data); setPerformance(p.data) })
      .catch(console.error)
  }

  const chartData = performance.slice(0, 14).reverse().map(r => ({
    date: new Date(r.DATE).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    sellIn: r.SELL_IN_UNITS,
    sellOut: r.SELL_OUT_UNITS,
    shelfShare: r.SHELF_SHARE_PERCENT,
  }))

  if (selectedStore) {
    return (
      <div className="pb-6">
        <div className="bg-velvet-dark px-5 pt-12 pb-5 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSelectedStore(null)} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg truncate">{selectedStore.RETAILER_NAME}</h1>
              <p className="text-gray-400 text-xs truncate">{selectedStore.ADDRESS}</p>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Package, label: 'Sell-In', value: kpis?.AVG_SELL_IN, suffix: 'u' },
              { icon: TrendingUp, label: 'Sell-Out', value: kpis?.AVG_SELL_OUT, suffix: 'u' },
              { icon: PieChart, label: 'Shelf', value: kpis?.AVG_SHELF_SHARE, suffix: '%' },
              { icon: Target, label: 'DN', value: kpis?.DISTRIBUTION_RATE, suffix: '%' },
              { icon: BarChart3, label: 'Promo', value: kpis?.AVG_PROMO_EFFICIENCY, suffix: '/10' },
              { icon: TrendingUp, label: 'PDM', value: kpis?.AVG_MARKET_SHARE, suffix: '%' },
            ].map(({ icon: Icon, label, value, suffix }, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon size={10} className="text-velvet-gold" />
                  <span className="text-[9px] text-gray-400 uppercase font-medium">{label}</span>
                </div>
                <p className="text-white text-base font-bold">{value || '—'}<span className="text-[10px] text-gray-400">{suffix}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 mt-5 space-y-4">
          {/* Store Info Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Store size={14} className="text-velvet-gold" /> Informations
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <User size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Responsable</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStore.STORE_MANAGER_NAME}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStore.ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Store size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Type / Région</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStore.STORE_TYPE} · {selectedStore.REGION}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sell-In vs Sell-Out Chart */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Sell-In vs Sell-Out</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={1}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={25} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="sellIn" fill="#1a1a2e" name="Sell-In" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sellOut" fill="#e6c87a" name="Sell-Out" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shelf Share Trend */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Shelf Share Évolution</h3>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={25} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="shelfShare" stroke="#0f3460" fill="#0f3460" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => navigate(`/store/${selectedStore.STORE_ID}`)}
              className="flex-1 py-3 bg-velvet-dark text-velvet-gold rounded-xl text-sm font-semibold text-center">
              Voir Détail Complet
            </button>
            <button onClick={() => navigate(`/new-visit?store=${selectedStore.STORE_ID}`)}
              className="flex-1 py-3 bg-velvet-gold/10 text-velvet-dark border border-velvet-gold/30 rounded-xl text-sm font-semibold text-center">
              Planifier Visite
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">Points de Vente</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un magasin..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-velvet-gold/30"
          />
        </div>
      </div>

      {/* Store List */}
      <div className="px-5 mt-4 space-y-2">
        <p className="text-xs text-gray-500 mb-2">{filteredStores.length} point{filteredStores.length > 1 ? 's' : ''} de vente</p>
        {filteredStores.map(store => (
          <div key={store.STORE_ID}
            onClick={() => selectStore(store)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-velvet-dark/5 flex items-center justify-center flex-shrink-0">
                  <Store size={18} className="text-velvet-dark" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{store.RETAILER_NAME}</h3>
                  <p className="text-xs text-gray-500 truncate">{store.ADDRESS}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{store.STORE_TYPE} · {store.REGION}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
