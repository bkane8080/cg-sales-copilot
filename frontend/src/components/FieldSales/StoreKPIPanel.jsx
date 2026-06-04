import React, { useState, useEffect } from 'react'
import { Package, PieChart, BarChart3, Target, TrendingUp, Store } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { getStoreKPIs, getStorePerformance, getStore } from '../../api'

export default function StoreKPIPanel({ storeId }) {
  const [store, setStore] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return
    setLoading(true)
    Promise.all([getStore(storeId), getStoreKPIs(storeId), getStorePerformance(storeId)])
      .then(([s, k, p]) => {
        setStore(s.data)
        setKpis(k.data)
        setPerformance(p.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [storeId])

  if (loading) return (
    <div className="bg-white rounded-2xl p-12 text-center animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
    </div>
  )

  const chartData = performance.slice(0, 28).reverse().map(r => ({
    date: new Date(r.DATE).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    sellIn: r.SELL_IN_UNITS,
    sellOut: r.SELL_OUT_UNITS,
    shelfShare: r.SHELF_SHARE_PERCENT,
  }))

  const categoryPerf = performance.reduce((acc, r) => {
    if (!acc[r.CATEGORY]) acc[r.CATEGORY] = { category: r.CATEGORY, sellOut: 0, count: 0 }
    acc[r.CATEGORY].sellOut += r.SELL_OUT_UNITS
    acc[r.CATEGORY].count++
    return acc
  }, {})
  const categoryData = Object.values(categoryPerf).map(c => ({ ...c, sellOut: Math.round(c.sellOut / c.count) }))

  const KPICard = ({ icon: Icon, label, value, suffix = '', color = 'velvet-dark' }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <div className={`p-1.5 rounded-lg bg-${color}/10`}>
          <Icon size={14} className={`text-${color}`} />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-400">{suffix}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-velvet-dark to-velvet-navy rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Store size={20} className="text-velvet-gold" />
              <h2 className="text-xl font-bold">{store?.RETAILER_NAME}</h2>
              <span className="px-2.5 py-0.5 bg-velvet-gold/20 text-velvet-gold text-xs font-semibold rounded-full">
                {store?.STORE_TYPE}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{store?.ADDRESS}</p>
            <p className="text-xs text-gray-400 mt-0.5">Responsable: {store?.STORE_MANAGER_NAME}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Derniers 30 jours</p>
            <p className="text-2xl font-bold text-velvet-gold">{kpis?.DATA_POINTS || 0}</p>
            <p className="text-xs text-gray-400">data points</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard icon={Package} label="Sell-In" value={kpis?.AVG_SELL_IN || 0} suffix="u/sem" />
        <KPICard icon={TrendingUp} label="Sell-Out" value={kpis?.AVG_SELL_OUT || 0} suffix="u/sem" />
        <KPICard icon={PieChart} label="Shelf Share" value={kpis?.AVG_SHELF_SHARE || 0} suffix="%" />
        <KPICard icon={Target} label="DN" value={kpis?.DISTRIBUTION_RATE || 0} suffix="%" />
        <KPICard icon={BarChart3} label="Promo" value={kpis?.AVG_PROMO_EFFICIENCY || 0} suffix="/10" />
        <KPICard icon={TrendingUp} label="PDM" value={kpis?.AVG_MARKET_SHARE || 0} suffix="%" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Sell-In vs Sell-Out</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sellIn" fill="#1a1a2e" name="Sell-In" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sellOut" fill="#e6c87a" name="Sell-Out" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Shelf Share Evolution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="shelfShare" stroke="#0f3460" fill="#0f3460" fillOpacity={0.1} name="Shelf Share %" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Performance par Catégorie</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="sellOut" fill="#e6c87a" name="Avg Sell-Out" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
