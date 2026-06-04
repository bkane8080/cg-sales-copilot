import React, { useState, useEffect } from 'react'
import { BarChart3, Zap, TrendingUp, Layers } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { getCrossRetailerAnalytics, simulatePromo } from '../../api'

export default function CategoryManagerView() {
  const [analytics, setAnalytics] = useState([])
  const [promoDesc, setPromoDesc] = useState('')
  const [promoCategory, setPromoCategory] = useState('Fragrance')
  const [prediction, setPrediction] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [metric, setMetric] = useState('AVG_SELL_OUT')

  useEffect(() => {
    getCrossRetailerAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(console.error)
  }, [])

  const handleSimulate = async () => {
    if (!promoDesc.trim()) return
    setSimulating(true)
    setPrediction(null)
    try {
      const res = await simulatePromo({ promotion_description: promoDesc, category: promoCategory })
      setPrediction(res.data)
    } catch (e) {
      alert('Erreur de simulation')
    }
    setSimulating(false)
  }

  const retailers = [...new Set(analytics.map(d => d.RETAILER_NAME))]
  const categories = [...new Set(analytics.map(d => d.CATEGORY))]
  const colors = { Fragrance: '#1a1a2e', Skincare: '#e6c87a', Makeup: '#0f3460' }

  const metricLabels = {
    AVG_SELL_OUT: 'Sell-Out Moyen',
    AVG_MARKET_SHARE: 'Part de Marché %',
    AVG_SHELF_SHARE: 'Shelf Share %',
    AVG_PROMO_SCORE: 'Score Promo'
  }

  const chartData = retailers.map(retailer => {
    const entry = { retailer }
    categories.forEach(cat => {
      const match = analytics.find(d => d.RETAILER_NAME === retailer && d.CATEGORY === cat)
      entry[cat] = match ? match[metric] : 0
    })
    return entry
  })

  const radarData = categories.map(cat => {
    const catData = analytics.filter(d => d.CATEGORY === cat)
    return {
      category: cat,
      sellOut: catData.reduce((s, d) => s + d.AVG_SELL_OUT, 0) / (catData.length || 1),
      marketShare: catData.reduce((s, d) => s + d.AVG_MARKET_SHARE, 0) / (catData.length || 1),
      shelfShare: catData.reduce((s, d) => s + d.AVG_SHELF_SHARE, 0) / (catData.length || 1),
      promoScore: catData.reduce((s, d) => s + d.AVG_PROMO_SCORE, 0) / (catData.length || 1),
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-velvet-dark">Insights Center</h1>
        <p className="text-sm text-gray-500">Analytique cross-enseigne & intelligence promotionnelle</p>
      </div>

      {/* Cross-Retailer Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-velvet-gold" />
              Performance Cross-Enseigne
            </h2>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-velvet-gold/30">
              {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="retailer" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {categories.map(cat => (
                <Bar key={cat} dataKey={cat} fill={colors[cat]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Layers size={18} className="text-velvet-gold" />
            Vue Catégorielle
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e5e5" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar name="Sell-Out" dataKey="sellOut" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.15} />
              <Radar name="PDM" dataKey="marketShare" stroke="#e6c87a" fill="#e6c87a" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Promo Simulator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-velvet-gold" />
          <h2 className="font-semibold text-gray-800">Simulateur ROI Promo</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Décrivez une promotion et l'IA prédit le volume lift basé sur l'historique d'efficacité promotionnelle.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Description de la Promotion</label>
              <textarea
                value={promoDesc}
                onChange={(e) => setPromoDesc(e.target.value)}
                placeholder="Ex: Achetez 1 Fragrance, recevez 1 miniature Skincare offerte"
                rows={3}
                className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velvet-gold/30 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Catégorie</label>
                <select value={promoCategory} onChange={(e) => setPromoCategory(e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30">
                  <option value="Fragrance">Fragrance</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Makeup">Makeup</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleSimulate} disabled={simulating || !promoDesc.trim()}
                  className="px-6 py-2.5 bg-velvet-dark text-velvet-gold rounded-xl hover:bg-velvet-navy transition-all disabled:opacity-30 text-sm font-semibold shadow-lg shadow-velvet-dark/20">
                  {simulating ? 'Simulation...' : 'Lancer Simulation'}
                </button>
              </div>
            </div>
          </div>

          {prediction ? (
            <div className="bg-gradient-to-br from-velvet-dark to-velvet-navy rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-velvet-gold mb-4 text-sm uppercase tracking-wider">Résultats de Prédiction</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Volume Lift Prédit</span>
                  <span className="text-2xl font-bold text-green-400">+{prediction.prediction?.predicted_lift_percent || 'N/A'}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Niveau de Confiance</span>
                  <span className={`font-semibold capitalize px-2.5 py-0.5 rounded-full text-xs ${
                    prediction.prediction?.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                    prediction.prediction?.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}>{prediction.prediction?.confidence || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Durée Recommandée</span>
                  <span className="font-semibold">{prediction.prediction?.recommended_duration_weeks || 'N/A'} semaines</span>
                </div>
                {prediction.prediction?.reasoning && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-300 leading-relaxed">{prediction.prediction.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-8">
              <div className="text-center">
                <Zap size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Les résultats apparaîtront ici</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
