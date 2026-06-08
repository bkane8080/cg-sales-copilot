import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Minus, Camera, Eye, X, Tag, Gift, Sparkles, Home, Loader2, TrendingUp, TrendingDown, Equal, PlusCircle } from 'lucide-react'
import { getStore, getCatalog, getStorePlanogram, getStoreAssortment, getLastMerchandising, getPromotions, getQuotas, submitMerchandising, uploadVisitPhoto, completeVisit, generateVisitReport, REP_ID } from '../api'

const STEPS = [
  { id: 'prep', label: 'Preparation' },
  { id: 'merchandising', label: 'Store Check' },
  { id: 'competition', label: 'Competition' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'order', label: 'Order' },
  { id: 'report', label: 'Report' },
]

const DEFAULT_ACTIONS = [
  { id: 'merch', label: 'Merchandising Check', description: 'Count facings, check shelf position, mark OOS', checked: true },
  { id: 'competition', label: 'Competition Survey', description: 'Check competitor presence and pricing', checked: true },
  { id: 'promotion', label: 'Promotion Activation', description: 'Activate in-store promotions', checked: false },
  { id: 'order', label: 'Order Taking', description: 'Place orders for products and packs', checked: true },
  { id: 'report', label: 'Report & Next Visit', description: 'Take notes and configure next visit', checked: true },
]

const POSITIONS = ['High', 'Middle', 'Low', 'Bin']

export default function RetailExecution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [currentStep, setCurrentStep] = useState('prep')
  const [actions, setActions] = useState(DEFAULT_ACTIONS)
  const [catalog, setCatalog] = useState([])
  const [planogram, setPlanogram] = useState([])
  const [showPlanogram, setShowPlanogram] = useState(false)
  const [merchData, setMerchData] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [quotas, setQuotas] = useState([])
  const [promotions, setPromotions] = useState([])
  const [activatedPromos, setActivatedPromos] = useState([])
  const [competitionNotes, setCompetitionNotes] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [photos, setPhotos] = useState([])
  const [showAddProduct, setShowAddProduct] = useState(false)

  useEffect(() => {
    Promise.all([
      getStore(id),
      getCatalog(),
      getStorePlanogram(id),
      getStoreAssortment(id),
      getLastMerchandising(id),
      getPromotions(),
      getQuotas(),
    ]).then(([s, c, p, assortment, lastMerch, promos, q]) => {
      setStore(s.data)
      setCatalog(c.data)
      setPlanogram(p.data)
      setPromotions(promos.data)
      setQuotas(q.data)

      const lastData = lastMerch.data || []
      const assortmentIds = (assortment.data || []).map(a => a.CATALOG_ID)
      const sellable = c.data.filter(item => item.PRODUCT_TYPE === 'Sellable' && assortmentIds.includes(item.CATALOG_ID))
      setMerchData(sellable.map(item => {
        const prev = lastData.find(l => l.CATALOG_ID === item.CATALOG_ID)
        const planoRef = p.data.find(pl => pl.CATALOG_ID === item.CATALOG_ID)
        const defaultFacing = planoRef ? Math.max(1, planoRef.FACING_COUNT + Math.floor(Math.random() * 3) - 1) : Math.floor(Math.random() * 3) + 1
        const positions = ['High', 'Middle', 'Low']
        const defaultPosition = planoRef ? planoRef.SHELF_POSITION : positions[Math.floor(Math.random() * 3)]
        const prevFacing = prev ? prev.FACING_COUNT : defaultFacing
        return {
          catalog_id: item.CATALOG_ID,
          product_name: item.PRODUCT_NAME,
          category: item.CATEGORY,
          sku: item.SKU,
          ean: item.EAN,
          price: item.PRICE,
          image_url: item.IMAGE_URL,
          shelf_position: prev ? prev.SHELF_POSITION : defaultPosition,
          facing_count: prevFacing,
          previous_facing: prevFacing,
          is_out_of_stock: prev ? prev.IS_OUT_OF_STOCK : false,
          has_previous: !!prev,
        }
      }))

      const orderables = c.data.filter(item => item.PRODUCT_TYPE === 'Pack' || item.PRODUCT_TYPE === 'Non-sellable')
      setOrderItems(orderables.map(item => ({ ...item, qty: 0 })))
    }).catch(console.error)
  }, [id])

  const toggleAction = (idx) => {
    const a = [...actions]
    a[idx].checked = !a[idx].checked
    setActions(a)
  }

  const updateMerch = (idx, field, value) => {
    const d = [...merchData]
    d[idx][field] = value
    setMerchData(d)
  }

  const updateOrderQty = (idx, delta) => {
    const items = [...orderItems]
    const item = items[idx]
    const quota = getQuotaForItem(item.CATALOG_ID)
    let newQty = Math.max(0, item.qty + delta)
    if (quota) {
      const remaining = Math.max(0, quota.QUOTA_QTY - quota.USED_QTY)
      newQty = Math.min(newQty, remaining)
    }
    items[idx].qty = newQty
    setOrderItems(items)
  }


  const addProductToMerch = (catalogId) => {
    if (merchData.find(m => m.catalog_id === catalogId)) return
    const item = catalog.find(c => c.CATALOG_ID === catalogId)
    if (!item) return
    const planoRef = planogram.find(pl => pl.CATALOG_ID === catalogId)
    setMerchData(prev => [...prev, {
      catalog_id: item.CATALOG_ID,
      product_name: item.PRODUCT_NAME,
      category: item.CATEGORY,
      sku: item.SKU,
      ean: item.EAN,
      price: item.PRICE,
      image_url: item.IMAGE_URL,
      shelf_position: planoRef ? planoRef.SHELF_POSITION : 'Middle',
      facing_count: 0,
      previous_facing: 0,
      is_out_of_stock: false,
      has_previous: false,
    }])
    setShowAddProduct(false)
  }

  const togglePromo = (promoId) => {
    setActivatedPromos(prev =>
      prev.includes(promoId) ? prev.filter(id => id !== promoId) : [...prev, promoId]
    )
  }

  const handlePhotoCapture = (type) => {
    const fileName = `${type}_${Date.now()}.jpg`
    setPhotos([...photos, { type, fileName, timestamp: new Date().toISOString() }])
    uploadVisitPhoto(0, { store_id: id, rep_id: 1, photo_type: type, notes: '', file_name: fileName }).catch(() => {})
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    try {
      const oosItems = merchData.filter(m => m.is_out_of_stock)
      const checkedCount = merchData.filter(m => m.facing_count > 0).length
      const totalFacings = merchData.reduce((s, m) => s + m.facing_count, 0)
      const expectedFacings = planogram.reduce((s, p) => s + p.FACING_COUNT, 0)
      const compliance = expectedFacings > 0 ? Math.round((totalFacings / expectedFacings) * 100) : null
      const orderedItems = orderItems.filter(i => i.qty > 0)
      const activatedPromoNames = promotions.filter(p => activatedPromos.includes(p.PROMO_ID)).map(p => p.PROMO_NAME)

      const res = await generateVisitReport({
        store_name: store.STORE_NAME,
        merch_summary: {
          checked_count: checkedCount,
          total_products: merchData.length,
          total_facings: totalFacings,
          oos_count: oosItems.length,
          oos_items: oosItems.map(i => i.product_name).join(', '),
          compliance,
          facing_changes: merchData.filter(m => m.facing_count !== m.previous_facing).map(m => ({
            product: m.product_name,
            previous: m.previous_facing,
            current: m.facing_count,
            change: m.facing_count - m.previous_facing,
          })),
        },
        competition_notes: competitionNotes,
        promotions_activated: activatedPromoNames,
        orders: orderedItems.map(i => ({ name: i.PRODUCT_NAME, qty: i.qty })),
        photos_count: photos.length,
      })
      setReportNotes(res.data.report)
    } catch (e) {
      console.error(e)
      setReportNotes('Error generating report. Please write manually.')
    }
    setGeneratingReport(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const merchItems = merchData.filter(m => m.facing_count > 0 || m.is_out_of_stock)
      if (merchItems.length > 0) {
        await submitMerchandising(0, id, merchItems.map(m => ({
          catalog_id: m.catalog_id,
          shelf_position: m.shelf_position,
          facing_count: m.facing_count,
          is_out_of_stock: m.is_out_of_stock,
        })))
      }
      const totalFacings = merchData.reduce((s, m) => s + m.facing_count, 0)
      const expectedFacings = planogram.reduce((s, p) => s + p.FACING_COUNT, 0)
      const score = expectedFacings > 0 ? Math.round((totalFacings / expectedFacings) * 100) : null
      const oosCount = merchData.filter(m => m.is_out_of_stock).length
      const res = await completeVisit(0, {
        compliance_score: score,
        notes: reportNotes,
        store_id: parseInt(id),
        rep_id: REP_ID,
        merch_summary: { oos_count: oosCount, total_products: merchData.length }
      })
      setScores(res.data.scores)
    } catch (e) {
      console.error(e)
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  const getActiveSteps = () => {
    const mapping = { merch: 'merchandising', competition: 'competition', promotion: 'promotion', order: 'order', report: 'report' }
    return ['prep', ...actions.filter(a => a.checked).map(a => mapping[a.id])]
  }

  const goNext = () => {
    const activeSteps = getActiveSteps()
    const idx = activeSteps.indexOf(currentStep)
    if (idx < activeSteps.length - 1) setCurrentStep(activeSteps[idx + 1])
  }

  const goPrev = () => {
    const activeSteps = getActiveSteps()
    const idx = activeSteps.indexOf(currentStep)
    if (idx > 0) setCurrentStep(activeSteps[idx - 1])
  }

  if (!store) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>

  const activeSteps = getActiveSteps()
  const stepIndex = activeSteps.indexOf(currentStep)

  const getQuotaForItem = (catalogId) => quotas.find(q => q.CATALOG_ID === catalogId)

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <div className="bg-velvet-dark px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold truncate">{store.STORE_NAME}</h1>
            <p className="text-gray-400 text-xs">{store.RETAILER_NAME} · Visit in progress</p>
          </div>
        </div>
        <div className="flex gap-1 mt-4">
          {activeSteps.map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center">
              <div className={`w-full h-1.5 rounded-full ${i <= stepIndex ? 'bg-velvet-gold' : 'bg-white/20'}`} />
              <span className={`text-[9px] mt-1.5 capitalize text-center ${step === currentStep ? 'text-velvet-gold font-medium' : 'text-gray-500'}`}>
                {STEPS.find(s => s.id === step)?.label || step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5">
        {currentStep === 'prep' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">Visit Actions</h2>
              </div>
              <div className="space-y-2">
                {actions.map((action, i) => (
                  <button key={action.id} onClick={() => toggleAction(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${action.checked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${action.checked ? 'bg-emerald-500' : 'border-2 border-gray-300'}`}>
                      {action.checked && <Check size={13} className="text-white" />}
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${action.checked ? 'text-emerald-800' : 'text-gray-700'}`}>{action.label}</span>
                      <p className="text-[11px] text-gray-500">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'merchandising' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Merchandising Check</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowPlanogram(!showPlanogram)}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg font-medium">
                  <Eye size={12} /> Planogram
                </button>
                <button onClick={() => handlePhotoCapture('merchandising')}
                  className="flex items-center gap-1 text-xs bg-velvet-gold/20 text-velvet-dark px-2.5 py-1.5 rounded-lg font-medium">
                  <Camera size={12} /> Photo
                </button>
              </div>
            </div>

            {showPlanogram && (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-blue-800">Theoretical Planogram — {store.RETAILER_NAME}</h3>
                  <button onClick={() => setShowPlanogram(false)}><X size={14} className="text-blue-400" /></button>
                </div>
                <div className="space-y-1">
                  {planogram.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-blue-100 last:border-0">
                      <span className="text-blue-900 font-medium truncate flex-1">{p.PRODUCT_NAME}</span>
                      <span className="text-blue-600 mx-2">{p.SHELF_POSITION}</span>
                      <span className="text-blue-800 font-bold">{p.FACING_COUNT}f</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {merchData.map((item, idx) => {
              const diff = item.facing_count - item.previous_facing
              return (
              <div key={idx} className={`bg-white rounded-2xl p-4 shadow-sm border ${item.is_out_of_stock ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-[11px] text-gray-500">{item.category} · {item.sku}</p>
                    </div>
                  </div>
                  <button onClick={() => updateMerch(idx, 'is_out_of_stock', !item.is_out_of_stock)}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium ${item.is_out_of_stock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_out_of_stock ? 'OOS' : 'In Stock'}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Position:</span>
                    <select value={item.shelf_position} onChange={(e) => updateMerch(idx, 'shelf_position', e.target.value)}
                      className="text-xs bg-gray-100 border-0 rounded-lg px-2 py-1.5 font-medium text-gray-700">
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Facing:</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateMerch(idx, 'facing_count', Math.max(0, item.facing_count - 1))}
                        className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Minus size={12} className="text-gray-600" />
                      </button>
                      <span className={`w-8 text-center text-sm font-bold ${item.facing_count > 0 ? 'text-velvet-dark' : 'text-gray-300'}`}>{item.facing_count}</span>
                      <button onClick={() => updateMerch(idx, 'facing_count', item.facing_count + 1)}
                        className="w-7 h-7 rounded-lg bg-velvet-dark flex items-center justify-center">
                        <Plus size={12} className="text-velvet-gold" />
                      </button>
                      {diff !== 0 && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ml-1 ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      )}
                      {diff === 0 && item.facing_count > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400 ml-1">
                          <Equal size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {planogram.find(p => p.CATALOG_ID === item.catalog_id) && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-blue-600">
                      Plano: {planogram.find(p => p.CATALOG_ID === item.catalog_id).SHELF_POSITION} / {planogram.find(p => p.CATALOG_ID === item.catalog_id).FACING_COUNT} facings
                    </p>
                  </div>
                )}
              </div>
              )
            })}

            <button onClick={() => setShowAddProduct(!showAddProduct)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-500 hover:border-velvet-gold hover:text-velvet-dark">
              <PlusCircle size={16} /> Add Product (not in assortment)
            </button>

            {showAddProduct && (
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 max-h-60 overflow-y-auto space-y-1">
                {catalog.filter(c => c.PRODUCT_TYPE === 'Sellable' && !merchData.find(m => m.catalog_id === c.CATALOG_ID)).map(item => (
                  <button key={item.CATALOG_ID} onClick={() => addProductToMerch(item.CATALOG_ID)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-left">
                    {item.IMAGE_URL && <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} className="w-8 h-8 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.PRODUCT_NAME}</p>
                      <p className="text-[10px] text-gray-500">{item.CATEGORY}</p>
                    </div>
                    <Plus size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'competition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Competition Survey</h2>
              <button onClick={() => handlePhotoCapture('competition')}
                className="flex items-center gap-1 text-xs bg-velvet-gold/20 text-velvet-dark px-2.5 py-1.5 rounded-lg font-medium">
                <Camera size={12} /> Take Photo
              </button>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Competitor Observations</h3>
              <textarea
                value={competitionNotes}
                onChange={(e) => setCompetitionNotes(e.target.value)}
                placeholder="Note competitor brands, their positioning, pricing, promotions..."
                className="w-full h-32 text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-velvet-gold"
              />
            </div>
            {photos.filter(p => p.type === 'competition').length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Photos taken</h3>
                <div className="flex gap-2 flex-wrap">
                  {photos.filter(p => p.type === 'competition').map((p, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Camera size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'promotion' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Promotions</h2>
              <span className="text-xs text-gray-500">{activatedPromos.length} activated</span>
            </div>
            <p className="text-xs text-gray-500 -mt-2">Activate promotions for this store</p>
            {promotions.map(promo => {
              const isActive = activatedPromos.includes(promo.PROMO_ID)
              return (
                <button key={promo.PROMO_ID} onClick={() => togglePromo(promo.PROMO_ID)}
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${isActive ? 'border-purple-300 bg-purple-50/50' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${promo.PROMO_TYPE === 'BOGOF' ? 'bg-red-100 text-red-700' : promo.PROMO_TYPE === 'GWP' ? 'bg-amber-100 text-amber-700' : promo.PROMO_TYPE === 'SAMPLING' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {promo.PROMO_TYPE}
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate">{promo.PROMO_NAME}</p>
                      </div>
                      <p className="text-xs text-gray-600">{promo.DESCRIPTION}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400">
                          {new Date(promo.START_DATE).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {new Date(promo.END_DATE).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-gray-400">{promo.APPLICABLE_CATEGORIES}</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${isActive ? 'bg-purple-500' : 'border-2 border-gray-300'}`}>
                      {isActive && <Check size={13} className="text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {currentStep === 'order' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900">Order Taking</h2>
            <p className="text-xs text-gray-500 -mt-2">Packs & Non-sellable items (displays, samples, testers)</p>
            {orderItems.map((item, idx) => {
              const quota = getQuotaForItem(item.CATALOG_ID)
              return (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {item.IMAGE_URL && <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${item.PRODUCT_TYPE === 'Pack' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.PRODUCT_TYPE === 'Pack' ? 'Pack' : 'Non-sell'}
                          </span>
                          <p className="text-sm font-medium text-gray-900 truncate">{item.PRODUCT_NAME}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.SKU} {item.PRICE > 0 ? `· €${item.PRICE}` : ''}</p>
                        {item.PACK_CONTENTS && <p className="text-[10px] text-purple-600 mt-0.5 italic">{item.PACK_CONTENTS}</p>}
                        {item.SEASON && <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded mt-1 inline-block">{item.SEASON}</span>}
                        {quota && (
                          <div className="mt-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500">Quota {quota.QUARTER}:</span>
                              <span className={`text-[10px] font-bold ${quota.USED_QTY >= quota.QUOTA_QTY ? 'text-red-600' : 'text-emerald-600'}`}>
                                {quota.USED_QTY}/{quota.QUOTA_QTY} used
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-0.5">
                              <div className={`h-full rounded-full ${quota.USED_QTY >= quota.QUOTA_QTY ? 'bg-red-400' : quota.USED_QTY / quota.QUOTA_QTY > 0.7 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(100, (quota.USED_QTY / quota.QUOTA_QTY) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => updateOrderQty(idx, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200">
                        <Minus size={14} className="text-gray-600" />
                      </button>
                      <span className={`w-8 text-center text-sm font-bold ${item.qty > 0 ? 'text-velvet-dark' : 'text-gray-300'}`}>{item.qty}</span>
                      <button onClick={() => updateOrderQty(idx, 1)}
                        className="w-8 h-8 rounded-lg bg-velvet-dark flex items-center justify-center active:bg-velvet-navy">
                        <Plus size={14} className="text-velvet-gold" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {orderItems.some(i => i.qty > 0) && (
              <div className="bg-velvet-dark rounded-2xl p-4 mt-2">
                <div className="flex justify-between items-center text-white mb-1">
                  <span className="text-sm">Total items ordered</span>
                  <span className="text-xl font-bold">{orderItems.reduce((s, i) => s + i.qty, 0)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'report' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Visit Report</h2>
              <button onClick={generateReport} disabled={generatingReport}
                className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-60">
                {generatingReport ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><Sparkles size={12} /> Auto-generate</>}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Notes & Observations</h3>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Write your visit report notes here..."
                className="w-full h-28 text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-velvet-gold"
              />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Next Visit</h3>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-velvet-gold"
              />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Visit Summary</h3>
              <div className="space-y-1.5 text-xs text-gray-600">
                <p>Products checked: {merchData.filter(m => m.facing_count > 0).length}/{merchData.length}</p>
                <p>Out-of-stock: {merchData.filter(m => m.is_out_of_stock).length}</p>
                <p>Total facings: {merchData.reduce((s, m) => s + m.facing_count, 0)}</p>
                <p>Promotions activated: {activatedPromos.length}</p>
                <p>Orders placed: {orderItems.reduce((s, i) => s + i.qty, 0)} items</p>
                <p>Photos taken: {photos.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom max-w-md mx-auto lg:max-w-none">
        {submitted ? (
          <div>
            <div className="flex items-center justify-center gap-2 text-emerald-700 mb-3">
              <Check size={18} /> <span className="font-semibold text-sm">Visit Complete</span>
            </div>
            {scores && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[
                  { label: 'Plano', value: scores.planogram },
                  { label: 'Price', value: scores.price },
                  { label: 'Stock', value: scores.stock },
                  { label: 'Visibility', value: scores.visibility },
                  { label: 'Overall', value: scores.overall },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`text-lg font-bold ${s.value >= 8 ? 'text-emerald-600' : s.value >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{s.value}</div>
                    <div className="text-[9px] text-gray-500 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 w-full py-3 bg-velvet-dark text-velvet-gold rounded-xl font-semibold text-sm">
              <Home size={16} /> Back to Home
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <button onClick={goPrev}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm">
                Back
              </button>
            )}
            {currentStep === activeSteps[activeSteps.length - 1] ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Finalizing...</> : 'Complete Visit'}
              </button>
            ) : (
              <button onClick={goNext}
                className="flex-1 py-3 bg-velvet-dark text-velvet-gold rounded-xl font-semibold text-sm">
                {currentStep === 'prep' ? 'Start Visit' : 'Continue'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
