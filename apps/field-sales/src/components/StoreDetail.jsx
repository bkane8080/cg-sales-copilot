import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, ClipboardCheck, Package, PieChart, Target, TrendingUp, BarChart3, Clock, AlertTriangle, FileText, Play, ChevronRight, X, Loader2, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getStore, getStoreKPIs, getStorePerformance, getStoreAudits, getStoreCases, getStoreVisits, prepareVisit, getStorePlanogram, getStoreAssortment } from '../api'

export default function StoreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [performance, setPerformance] = useState([])
  const [audits, setAudits] = useState([])
  const [cases, setCases] = useState([])
  const [storeVisits, setStoreVisits] = useState([])
  const [planogram, setPlanogram] = useState([])
  const [assortment, setAssortment] = useState([])
  const [activeTab, setActiveTab] = useState('kpis')
  const [showPrepare, setShowPrepare] = useState(false)
  const [briefing, setBriefing] = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)

  useEffect(() => {
    Promise.all([
      getStore(id),
      getStoreKPIs(id),
      getStorePerformance(id),
      getStoreAudits(id),
      getStoreCases(id),
      getStoreVisits(id),
      getStorePlanogram(id),
      getStoreAssortment(id),
    ]).then(([s, k, p, a, c, v, plano, assort]) => {
      setStore(s.data)
      setKpis(k.data)
      setPerformance(p.data)
      setAudits(a.data)
      setCases(c.data)
      setStoreVisits(v.data)
      setPlanogram(plano.data)
      setAssortment(assort.data)
    }).catch(console.error)
  }, [id])

  const handlePrepare = async () => {
    setShowPrepare(true)
    setBriefingLoading(true)
    try {
      const res = await prepareVisit(id)
      setBriefing(res.data.briefing)
    } catch (e) {
      setBriefing('Unable to generate briefing. Please try again.')
    }
    setBriefingLoading(false)
  }

  const chartData = performance.slice(0, 14).reverse().map(r => ({
    date: new Date(r.DATE).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    sellIn: r.SELL_IN_UNITS,
    sellOut: r.SELL_OUT_UNITS,
  }))

  if (!store) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>

  const openCases = cases.filter(c => c.STATUS === 'Open')

  return (
    <div className="pb-20">
      <div className="bg-velvet-dark px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{store.STORE_NAME}</h1>
            <p className="text-gray-400 text-xs truncate">{store.RETAILER_NAME} · {store.ADDRESS}</p>
          </div>
        </div>

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

      <div className="px-5 mt-4">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
          {['kpis', 'planogram', 'assortment', 'audits', 'cases', 'visits'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap px-2 ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'kpis' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Sell-In vs Sell-Out (Last 14 entries)</h3>
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

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Store Manager</h3>
              <p className="text-sm text-gray-600">{store.STORE_MANAGER_NAME}</p>
              <p className="text-xs text-gray-400 mt-1">{store.STORE_TYPE} · {store.REGION}</p>
            </div>
          </div>
        )}

        {activeTab === 'planogram' && (
          <div className="space-y-3">
            {planogram.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No planogram defined for this store type</p>
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Theoretical Planogram — {store.RETAILER_NAME} {store.STORE_TYPE}</h3>
                <div className="space-y-1">
                  {planogram.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{p.PRODUCT_NAME}</p>
                        <p className="text-[10px] text-gray-400">Shelf {p.SHELF_NUMBER}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.SHELF_POSITION === 'High' ? 'bg-blue-50 text-blue-700' : p.SHELF_POSITION === 'Middle' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {p.SHELF_POSITION}
                        </span>
                        <span className="text-sm font-bold text-gray-900 w-6 text-right">{p.FACING_COUNT}f</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>Total facings: {planogram.reduce((s, p) => s + p.FACING_COUNT, 0)}</span>
                  <span>{planogram.length} products</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assortment' && (
          <div className="space-y-3">
            {assortment.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No assortment data</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{assortment.length} products listed</p>
                </div>
                {['Fragrance', 'Skincare', 'Makeup'].map(cat => {
                  const items = assortment.filter(a => a.CATEGORY === cat)
                  if (items.length === 0) return null
                  return (
                    <div key={cat} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat} ({items.length})</h3>
                      <div className="space-y-1.5">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {item.IMAGE_URL && <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 truncate">{item.PRODUCT_NAME}</p>
                                <p className="text-[10px] text-gray-400">{item.SKU}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">€{item.PRICE}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-3">
            {audits.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No audits yet</p>
            ) : audits.map(audit => (
              <div key={audit.AUDIT_ID} onClick={() => setSelectedAudit(selectedAudit?.AUDIT_ID === audit.AUDIT_ID ? null : audit)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${audit.OVERALL_SCORE >= 8 ? 'bg-emerald-50' : audit.OVERALL_SCORE >= 7 ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <span className={`text-sm font-bold ${audit.OVERALL_SCORE >= 8 ? 'text-emerald-600' : audit.OVERALL_SCORE >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                        {audit.OVERALL_SCORE}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{new Date(audit.AUDIT_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500">Overall score: {audit.OVERALL_SCORE}/10</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${selectedAudit?.AUDIT_ID === audit.AUDIT_ID ? 'rotate-90' : ''}`} />
                </div>
                {selectedAudit?.AUDIT_ID === audit.AUDIT_ID && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs"><span className="text-gray-500">Planogram:</span> <span className="font-medium">{audit.PLANOGRAM_COMPLIANCE_SCORE}/10</span></div>
                      <div className="text-xs"><span className="text-gray-500">Price:</span> <span className="font-medium">{audit.PRICE_COMPLIANCE_SCORE}/10</span></div>
                      <div className="text-xs"><span className="text-gray-500">Stock:</span> <span className="font-medium">{audit.STOCK_AVAILABILITY_SCORE}/10</span></div>
                      <div className="text-xs"><span className="text-gray-500">Visibility:</span> <span className="font-medium">{audit.VISIBILITY_SCORE}/10</span></div>
                    </div>
                    {audit.NOTES && <p className="text-xs text-gray-600 italic mt-2">{audit.NOTES}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No cases</p>
            ) : cases.map(c => (
              <div key={c.CASE_ID} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.STATUS === 'Open' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className="text-xs font-medium text-gray-500">{c.CASE_TYPE}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.SEVERITY === 'High' ? 'bg-red-100 text-red-700' : c.SEVERITY === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{c.SEVERITY}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{c.SUBJECT}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.DESCRIPTION}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{new Date(c.CASE_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                {c.RESOLUTION && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-emerald-700"><span className="font-medium">Resolution:</span> {c.RESOLUTION}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-3">
            {storeVisits.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No visits recorded</p>
            ) : storeVisits.map(v => (
              <div key={v.VISIT_ID} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${v.STATUS === 'Completed' ? 'bg-emerald-500' : v.STATUS === 'Urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(v.SCHEDULED_DATETIME).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(v.SCHEDULED_DATETIME).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {v.STATUS}
                      </p>
                    </div>
                  </div>
                  {v.AUDIT_PLANOGRAM_COMPLIANCE_SCORE && (
                    <span className="text-xs font-medium bg-velvet-gold/20 text-velvet-dark px-2 py-1 rounded-lg">
                      Audit: {v.AUDIT_PLANOGRAM_COMPLIANCE_SCORE}
                    </span>
                  )}
                </div>
                {v.AI_RECOMMENDATION_NOTES && (
                  <p className="text-xs text-gray-600 italic mt-2 line-clamp-2">{v.AI_RECOMMENDATION_NOTES}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPrepare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Visit Preparation</h2>
              <button onClick={() => setShowPrepare(false)} className="p-2 rounded-xl bg-gray-100">
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            {briefingLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-velvet-gold" />
                <span className="ml-3 text-sm text-gray-500">Generating visit briefing...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{briefing}</div>
              </div>
            )}
            {openCases.length > 0 && !briefingLoading && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-red-600 uppercase mb-2">
                  <AlertTriangle size={11} className="inline mr-1" />{openCases.length} Open Case{openCases.length > 1 ? 's' : ''}
                </h3>
                {openCases.map(c => (
                  <div key={c.CASE_ID} className="bg-red-50 rounded-xl p-3 mb-2">
                    <p className="text-xs font-medium text-red-800">{c.SUBJECT}</p>
                    <p className="text-[10px] text-red-600 mt-0.5">{c.CASE_TYPE} · {c.SEVERITY}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom max-w-md mx-auto lg:max-w-none">
        <div className="flex gap-3">
          <button onClick={handlePrepare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-velvet-dark text-velvet-dark rounded-xl font-semibold text-sm">
            <FileText size={16} /> Prepare
          </button>
          <button onClick={() => navigate(`/store/${id}/execution`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-velvet-dark text-velvet-gold rounded-xl font-semibold text-sm">
            <Play size={16} /> Start Visit
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
