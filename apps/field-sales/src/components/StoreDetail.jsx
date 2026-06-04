import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, ClipboardCheck, Package, PieChart, Target, TrendingUp, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { getStore, getStoreKPIs, getStorePerformance } from '../api'

export default function StoreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [performance, setPerformance] = useState([])

  useEffect(() => {
    Promise.all([getStore(id), getStoreKPIs(id), getStorePerformance(id)])
      .then(([s, k, p]) => {
        setStore(s.data)
        setKpis(k.data)
        setPerformance(p.data)
      })
      .catch(console.error)
  }, [id])

  const chartData = performance.slice(0, 14).reverse().map(r => ({
    date: new Date(r.DATE).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    sellIn: r.SELL_IN_UNITS,
    sellOut: r.SELL_OUT_UNITS,
  }))

  if (!store) return <div className="p-8 text-center text-gray-400 animate-pulse">Chargement...</div>

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{store.RETAILER_NAME}</h1>
            <p className="text-gray-400 text-xs truncate">{store.ADDRESS}</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Package, label: 'Sell-In', value: kpis?.AVG_SELL_IN, suffix: 'u' },
            { icon: TrendingUp, label: 'Sell-Out', value: kpis?.AVG_SELL_OUT, suffix: 'u' },
            { icon: PieChart, label: 'Shelf', value: kpis?.AVG_SHELF_SHARE, suffix: '%' },
            { icon: Target, label: 'DN', value: kpis?.DISTRIBUTION_RATE, suffix: '%' },
            { icon: BarChart3, label: 'Promo', value: kpis?.AVG_PROMO_EFFICIENCY, suffix: '/10' },
            { icon: TrendingUp, label: 'PDM', value: kpis?.AVG_MARKET_SHARE, suffix: '%' },
          ].map(({ icon: Icon, label, value, suffix }, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon size={10} className="text-velvet-gold" />
                <span className="text-[9px] text-gray-400 uppercase font-medium">{label}</span>
              </div>
              <p className="text-white text-lg font-bold">{value || '—'}<span className="text-xs text-gray-400">{suffix}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="px-5 mt-5 space-y-4">
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

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Responsable Magasin</h3>
          <p className="text-sm text-gray-600">{store.STORE_MANAGER_NAME}</p>
          <p className="text-xs text-gray-400 mt-1">{store.STORE_TYPE} · {store.REGION}</p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom max-w-md mx-auto lg:max-w-none">
        <div className="flex gap-3">
          <button onClick={() => navigate(`/store/${id}/execution`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-velvet-dark text-velvet-gold rounded-xl font-semibold text-sm">
            <ClipboardCheck size={16} /> Audit & Commande
          </button>
          <button onClick={() => navigate('/assistant')}
            className="w-12 h-12 bg-velvet-gold/10 border border-velvet-gold/30 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-velvet-dark" />
          </button>
        </div>
      </div>
    </div>
  )
}
