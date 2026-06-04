import React, { useState, useEffect } from 'react'
import { Download, MapPin, AlertTriangle, TrendingUp, Users, FileText, Loader2, CheckCircle, UserPlus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getStores, getReps, getNPDTracker, generatePPT, addUrgentVisit, getVisits } from '../api'

export default function Dashboard() {
  const [stores, setStores] = useState([])
  const [reps, setReps] = useState([])
  const [npdData, setNpdData] = useState([])
  const [visits, setVisits] = useState([])
  const [generating, setGenerating] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('All')

  useEffect(() => {
    Promise.all([getStores(), getReps(), getNPDTracker(), getVisits()])
      .then(([s, r, n, v]) => {
        setStores(s.data)
        setReps(r.data.filter(rep => rep.MANAGER_ID))
        setNpdData(n.data)
        setVisits(v.data)
      })
      .catch(console.error)
  }, [])

  const handleGeneratePPT = async () => {
    setGenerating(true)
    try {
      const response = await generatePPT()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'Velvet_FB_Leadership_Review.pptx'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (e) { alert('Erreur lors de la génération') }
    setGenerating(false)
  }

  const handleAddUrgent = (store) => {
    const repId = prompt(`Assigner visite urgente à "${store.RETAILER_NAME} - ${store.ADDRESS}"\nRep ID (1-5):`)
    if (!repId) return
    addUrgentVisit({ rep_id: parseInt(repId), store_id: store.STORE_ID, notes: `Urgent: sous-performance détectée` })
      .then(() => alert('Visite urgente ajoutée'))
      .catch(() => alert('Erreur'))
  }

  const regions = ['All', ...new Set(stores.map(s => s.REGION))]
  const filteredStores = selectedRegion === 'All' ? stores : stores.filter(s => s.REGION === selectedRegion)
  const npdProducts = [...new Set(npdData.map(d => d.PRODUCT_NAME))]
  const colors = ['#1a1a2e', '#e6c87a', '#0f3460', '#c4a07a', '#16213e']
  const chartData = [...new Set(npdData.map(d => d.DATE))].sort().map(date => {
    const entry = { date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }
    npdProducts.forEach(p => { const m = npdData.find(d => d.DATE === date && d.PRODUCT_NAME === p); entry[p] = m ? m.DISTRIBUTION_PERCENT : null })
    return entry
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-velvet-dark">Intelligence Desk</h1>
          <p className="text-sm text-gray-500">Pilotage territoire & équipe</p>
        </div>
        <button onClick={handleGeneratePPT} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-velvet-dark text-velvet-gold rounded-xl hover:bg-velvet-navy disabled:opacity-50 font-medium text-sm shadow-lg shadow-velvet-dark/20">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {generating ? 'Génération...' : 'Générer PPT Leadership'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: MapPin, color: 'text-velvet-gold', label: 'Points de Vente', value: stores.length },
          { icon: Users, color: 'text-blue-500', label: 'Commerciaux', value: reps.length },
          { icon: AlertTriangle, color: 'text-red-500', label: 'Visites Urgentes', value: visits.filter(v => v.STATUS === 'Urgent').length },
          { icon: CheckCircle, color: 'text-emerald-500', label: 'Complétées', value: visits.filter(v => v.STATUS === 'Completed').length },
        ].map(({ icon: Icon, color, label, value }, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Icon size={16} className={color} />
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-3xl font-bold text-velvet-dark">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-velvet-gold" />
          NPD Tracker — Distribution Numérique (60j)
        </h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {npdProducts.map((p, i) => <Line key={p} type="monotone" dataKey={p} stroke={colors[i % 5]} strokeWidth={2.5} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="py-16 text-center text-gray-400">Aucun lancement récent</div>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Équipe Terrain</h2>
        <div className="grid grid-cols-5 gap-4">
          {reps.map(rep => {
            const rv = visits.filter(v => v.REP_ID === rep.REP_ID)
            return (
              <div key={rep.REP_ID} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-velvet-gold/50 transition-colors">
                <div className="w-11 h-11 rounded-full bg-velvet-dark flex items-center justify-center mx-auto mb-2">
                  <span className="text-velvet-gold text-xs font-bold">{rep.REP_NAME.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{rep.REP_NAME}</p>
                <p className="text-xs text-gray-500">{rep.REGION}</p>
                <p className="text-xs text-velvet-accent mt-1 font-medium">{rv.filter(v => v.STATUS === 'Completed').length}/{rv.length} visites</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Carte Territoire</h2>
            <p className="text-xs text-gray-500 mt-0.5">Clic droit → Ajouter visite urgente</p>
          </div>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-velvet-gold/30">
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-4 gap-3 p-4">
          {filteredStores.map(store => (
            <div key={store.STORE_ID} onContextMenu={(e) => { e.preventDefault(); handleAddUrgent(store) }}
              className="p-4 rounded-xl border border-gray-100 hover:border-velvet-gold hover:shadow-md cursor-context-menu transition-all group">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-velvet-gold group-hover:animate-pulse" />
                <span className="text-sm font-medium text-gray-800">{store.RETAILER_NAME}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{store.ADDRESS}</p>
              <span className="text-[10px] text-gray-400">{store.REGION}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
