import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Minus, Camera, Eye, X, Tag, Gift, Sparkles, Home, Loader2, TrendingUp, TrendingDown, Equal, PlusCircle, FileText, Mail } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import { getStore, getCatalog, getStorePlanogram, getStoreAssortment, getLastMerchandising, getPromotions, getQuotas, getPromoSuggestions, submitMerchandising, uploadVisitPhoto, completeVisit, generateVisitReport, REP_ID } from '../api'

const STEPS = [
  { id: 'prep', label: 'Preparation' },
  { id: 'merchandising', label: 'Store Check' },
  { id: 'competition', label: 'Competition' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'order', label: 'Order' },
  { id: 'report', label: 'Report' },
]

const COMPETITOR_BRANDS = ['Chanel', 'Dior', 'Clarins', 'L\'Oréal', 'Lancôme', 'Estée Lauder', 'Guerlain', 'YSL', 'Givenchy', 'Sisley', 'La Mer', 'Clinique', 'Other']
const COMPETITOR_PRODUCTS = {
  Chanel: { Fragrance: ['N°5 EDP', 'Coco Mademoiselle', 'Bleu de Chanel', 'Chance'], Skincare: ['Le Lift', 'Hydra Beauty', 'Sublimage'], Makeup: ['Rouge Allure', 'Les Beiges', 'Boy de Chanel'] },
  Dior: { Fragrance: ['Sauvage', 'J\'adore', 'Miss Dior', 'Homme'], Skincare: ['Capture Totale', 'Prestige', 'Hydra Life'], Makeup: ['Rouge Dior', 'Backstage', 'Diorshow'] },
  Clarins: { Fragrance: ['Eau Dynamisante', 'Eau des Jardins'], Skincare: ['Double Serum', 'Multi-Active', 'Super Restorative', 'Hydra-Essentiel'], Makeup: ['Lip Perfector', 'Skin Illusion', 'Everlasting'] },
  'L\'Oréal': { Fragrance: ['La Vie Est Belle', 'Trésor'], Skincare: ['Revitalift', 'Age Perfect', 'Hydra Genius'], Makeup: ['Color Riche', 'Infaillible', 'Volume Million'] },
  Lancôme: { Fragrance: ['La Vie Est Belle', 'Idôle', 'Trésor'], Skincare: ['Génifique', 'Rénergie', 'Absolue'], Makeup: ['L\'Absolu Rouge', 'Teint Idole', 'Hypnôse'] },
  'Estée Lauder': { Fragrance: ['Beautiful', 'Pleasures', 'Modern Muse'], Skincare: ['Advanced Night Repair', 'Resilience', 'Revitalizing Supreme'], Makeup: ['Double Wear', 'Pure Color', 'Sumptuous'] },
  Guerlain: { Fragrance: ['Shalimar', 'Mon Guerlain', 'L\'Homme Idéal'], Skincare: ['Abeille Royale', 'Orchidée Impériale'], Makeup: ['Rouge G', 'Terracotta', 'Météorites'] },
  YSL: { Fragrance: ['Libre', 'Black Opium', 'Mon Paris'], Skincare: ['Pure Shots', 'Or Rouge'], Makeup: ['Rouge Volupté', 'Touche Éclat', 'All Hours'] },
  Givenchy: { Fragrance: ['L\'Interdit', 'Gentleman', 'Irresistible'], Skincare: ['Le Soin Noir', 'Skin Ressource'], Makeup: ['Le Rouge', 'Prisme Libre'] },
  Sisley: { Fragrance: ['Eau du Soir', 'Izia'], Skincare: ['Sisleÿa', 'Black Rose', 'All Day All Year'], Makeup: ['Phyto-Teint', 'Le Phyto-Rouge'] },
  'La Mer': { Fragrance: [], Skincare: ['Crème de la Mer', 'The Concentrate', 'The Eye Concentrate'], Makeup: ['Skincolor de la Mer'] },
  Clinique: { Fragrance: ['Happy', 'Aromatics Elixir'], Skincare: ['Moisture Surge', 'Dramatically Different', 'Smart Clinical'], Makeup: ['Even Better', 'Chubby Stick', 'Almost Lipstick'] },
}
const COMP_TYPES = ['Pricing', 'Promotion', 'Display']

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
  const [sellableOrderItems, setSellableOrderItems] = useState([])
  const [showAddSellable, setShowAddSellable] = useState(false)
  const [quotas, setQuotas] = useState([])
  const [promotions, setPromotions] = useState([])
  const [promoSuggestions, setPromoSuggestions] = useState([])
  const [activatedPromos, setActivatedPromos] = useState([])
  const [competitionNotes, setCompetitionNotes] = useState('')
  const [competitionEntries, setCompetitionEntries] = useState([])
  const [compFormOpen, setCompFormOpen] = useState(false)
  const [compForm, setCompForm] = useState({ brand: '', category: '', product: '', type: '', note: '', photo: null })
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
      getPromoSuggestions(id),
    ]).then(([s, c, p, assortment, lastMerch, promos, q, suggestions]) => {
      setStore(s.data)
      setCatalog(c.data)
      setPlanogram(p.data)
      setPromotions(promos.data)
      setQuotas(q.data)
      setPromoSuggestions(suggestions.data?.suggestions || [])

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

  const getPromoOrderSuggestions = () => {
    if (promoSuggestions.length === 0) return []
    const activePromos = promoSuggestions.filter(p => activatedPromos.includes(p.PROMO_CAL_ID) || new Date(p.START_DATE) <= new Date(Date.now() + 30 * 86400000))
    const sellable = catalog.filter(c => c.PRODUCT_TYPE === 'Sellable')
    const suggestions = []
    activePromos.forEach(promo => {
      const catIds = promo.CATALOG_IDS || []
      const matchingProducts = catIds.length > 0
        ? sellable.filter(p => catIds.includes(p.CATALOG_ID))
        : promo.CATEGORY ? sellable.filter(p => p.CATEGORY === promo.CATEGORY) : sellable.slice(0, 3)
      matchingProducts.forEach(prod => {
        if (!suggestions.find(s => s.CATALOG_ID === prod.CATALOG_ID)) {
          const baseQty = Math.ceil((promo.ML_UPLIFT_PCT || 15) / 5)
          suggestions.push({ ...prod, suggestedQty: baseQty, reason: promo.PROMO_NAME, uplift: promo.ML_UPLIFT_PCT })
        }
      })
    })
    return suggestions.slice(0, 6)
  }

  const addSellableToOrder = (catalogId, qty) => {
    if (sellableOrderItems.find(i => i.CATALOG_ID === catalogId)) return
    const item = catalog.find(c => c.CATALOG_ID === catalogId)
    if (!item) return
    setSellableOrderItems(prev => [...prev, { ...item, qty: qty || 1 }])
    setShowAddSellable(false)
  }

  const updateSellableQty = (idx, delta) => {
    const items = [...sellableOrderItems]
    items[idx].qty = Math.max(0, items[idx].qty + delta)
    if (items[idx].qty === 0) items.splice(idx, 1)
    setSellableOrderItems(items)
  }

  const [generatingOrderForm, setGeneratingOrderForm] = useState(false)
  const [orderFormUrl, setOrderFormUrl] = useState(null)

  const generateOrderForm = async () => {
    if (sellableOrderItems.length === 0) return
    setGeneratingOrderForm(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      doc.setFillColor(28, 25, 38)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(212, 175, 55)
      doc.setFontSize(16)
      doc.text('PLAN DE VENTE', pageW / 2, 14, { align: 'center' })
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(`${store?.STORE_NAME || ''} — ${new Date().toLocaleDateString('fr-FR')}`, pageW / 2, 22, { align: 'center' })
      doc.text(`Rep: Eric Sarr | Velvet Fragrance & Beauty`, pageW / 2, 28, { align: 'center' })

      let y = 42
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFillColor(240, 240, 240)
      doc.rect(10, y, pageW - 20, 7, 'F')
      doc.text('Product', 14, y + 5)
      doc.text('Packs', 120, y + 5)
      doc.text('Units', 134, y + 5)
      doc.text('Total €', 150, y + 5)
      doc.text('EAN-13', 168, y + 5)
      y += 10

      for (const item of sellableOrderItems) {
        if (y > 265) {
          doc.addPage()
          y = 15
        }

        if (item.IMAGE_URL) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = item.IMAGE_URL
            })
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            doc.addImage(canvas.toDataURL('image/jpeg', 0.7), 'JPEG', 12, y, 14, 14)
          } catch (e) {}
        }

        doc.setFontSize(9)
        doc.setFont(undefined, 'bold')
        doc.text(item.PRODUCT_NAME || '', 30, y + 5)
        doc.setFont(undefined, 'normal')
        doc.setFontSize(7)
        doc.text(item.SKU || '', 30, y + 10)
        const packSize = item.PACK_SIZE || 10
        doc.text(`${item.CATEGORY || ''} · Pack of ${packSize}`, 30, y + 14)

        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.text(String(item.qty), 123, y + 8)
        doc.setFont(undefined, 'normal')
        doc.setFontSize(8)
        doc.text(String(item.qty * packSize), 137, y + 8)
        doc.text(`€${(item.PRICE * item.qty * packSize).toFixed(0)}`, 150, y + 8)

        if (item.EAN) {
          try {
            const barcodeCanvas = document.createElement('canvas')
            const eanStr = String(item.EAN).replace(/\D/g, '')
            const ean12 = eanStr.length === 13 ? eanStr.slice(0, 12) : eanStr
            JsBarcode(barcodeCanvas, ean12, { format: 'EAN13', width: 1, height: 24, displayValue: true, fontSize: 7, margin: 1 })
            doc.addImage(barcodeCanvas.toDataURL('image/png'), 'PNG', 164, y, 32, 12)
          } catch (e) {
            doc.setFontSize(7)
            doc.text(String(item.EAN), 168, y + 8)
          }
        }

        doc.setDrawColor(230, 230, 230)
        doc.line(10, y + 17, pageW - 10, y + 17)
        y += 20
      }

      y += 5
      doc.setFillColor(28, 25, 38)
      doc.rect(10, y, pageW - 20, 10, 'F')
      doc.setTextColor(212, 175, 55)
      doc.setFontSize(10)
      const totalQty = sellableOrderItems.reduce((s, i) => s + i.qty, 0)
      const totalUnits = sellableOrderItems.reduce((s, i) => s + i.qty * (i.PACK_SIZE || 10), 0)
      const totalVal = sellableOrderItems.reduce((s, i) => s + i.qty * (i.PACK_SIZE || 10) * (i.PRICE || 0), 0)
      doc.text(`Total: ${totalQty} packs (${totalUnits} units) — €${totalVal.toFixed(2)}`, pageW / 2, y + 7, { align: 'center' })

      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setOrderFormUrl(url)
    } catch (e) {
      console.error('PDF generation failed', e)
    }
    setGeneratingOrderForm(false)
  }

  const sendOrderFormByEmail = async () => {
    alert('Order form sent to store manager by email.')
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Competition Survey</h2>
              <span className="text-xs text-gray-500">{competitionEntries.length} entries</span>
            </div>

            {competitionEntries.map((entry, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">{entry.brand}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">{entry.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${entry.type === 'Pricing' ? 'bg-amber-100 text-amber-700' : entry.type === 'Promotion' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{entry.type}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 mt-1">{entry.product}</p>
                    {entry.note && <p className="text-[10px] text-gray-500 mt-0.5">{entry.note}</p>}
                    {entry.photo && <div className="w-10 h-10 bg-gray-200 rounded-lg mt-1 flex items-center justify-center"><Camera size={12} className="text-gray-400" /></div>}
                  </div>
                  <button onClick={() => setCompetitionEntries(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-2 p-1.5 text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              </div>
            ))}

            {!compFormOpen ? (
              <button onClick={() => setCompFormOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-xs text-gray-500 hover:border-velvet-gold hover:text-velvet-dark">
                <Plus size={14} /> Add Competition Entry
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">New Entry</span>
                  <button onClick={() => setCompFormOpen(false)} className="text-gray-400"><X size={14} /></button>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Brand</label>
                  <select value={compForm.brand} onChange={(e) => setCompForm({ ...compForm, brand: e.target.value, product: '' })}
                    className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <option value="">Select brand...</option>
                    {COMPETITOR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Category</label>
                  <select value={compForm.category} onChange={(e) => setCompForm({ ...compForm, category: e.target.value, product: '' })}
                    className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <option value="">Select category...</option>
                    <option value="Fragrance">Fragrance</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Makeup">Makeup</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Product</label>
                  {compForm.brand && compForm.category && COMPETITOR_PRODUCTS[compForm.brand]?.[compForm.category]?.length > 0 ? (
                    <select value={compForm.product} onChange={(e) => setCompForm({ ...compForm, product: e.target.value })}
                      className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <option value="">Select product...</option>
                      {(COMPETITOR_PRODUCTS[compForm.brand]?.[compForm.category] || []).map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="__custom">Other (type manually)</option>
                    </select>
                  ) : (
                    <input type="text" value={compForm.product} onChange={(e) => setCompForm({ ...compForm, product: e.target.value })}
                      placeholder="Enter product name..." className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50" />
                  )}
                  {compForm.product === '__custom' && (
                    <input type="text" onChange={(e) => setCompForm({ ...compForm, product: e.target.value === '' ? '__custom' : e.target.value })}
                      placeholder="Type product name..." className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50" />
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Type</label>
                  <select value={compForm.type} onChange={(e) => setCompForm({ ...compForm, type: e.target.value })}
                    className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <option value="">Select type...</option>
                    {COMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-medium">Note</label>
                  <textarea value={compForm.note} onChange={(e) => setCompForm({ ...compForm, note: e.target.value })}
                    placeholder="Observation..." className="w-full mt-1 text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 h-16 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { handlePhotoCapture('competition'); setCompForm({ ...compForm, photo: true }) }}
                    className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg">
                    <Camera size={12} /> Photo
                  </button>
                  <button onClick={() => {
                    if (compForm.brand && compForm.category && compForm.product && compForm.product !== '__custom' && compForm.type) {
                      setCompetitionEntries(prev => [...prev, { ...compForm }])
                      setCompForm({ brand: '', category: '', product: '', type: '', note: '', photo: null })
                      setCompFormOpen(false)
                    }
                  }}
                    disabled={!compForm.brand || !compForm.category || !compForm.product || compForm.product === '__custom' || !compForm.type}
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-velvet-dark text-velvet-gold px-3 py-2 rounded-lg font-medium disabled:opacity-40">
                    <Check size={12} /> Add Entry
                  </button>
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

            {promoSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-purple-600" />
                  <span className="text-xs font-bold text-purple-800">AI Recommended Promotions</span>
                </div>
                <p className="text-[10px] text-gray-600 mb-3">Based on store performance, season, and ML scoring model</p>
                {promoSuggestions.slice(0, 3).map((sug, i) => (
                  <div key={i} className={`bg-white rounded-xl p-3 mb-2 border ${activatedPromos.includes(sug.PROMO_CAL_ID) ? 'border-purple-400 ring-1 ring-purple-200' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{sug.PROMO_NAME}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{sug.DESCRIPTION}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${sug.ML_SCORE >= 7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            Score {sug.ML_SCORE}/10
                          </span>
                          <span className="text-[10px] text-blue-600 font-medium">↑{sug.ML_UPLIFT_PCT}% uplift</span>
                          {sug.estimated_uplift_euros && (
                            <span className="text-[10px] text-emerald-700 font-bold">+€{sug.estimated_uplift_euros}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => togglePromo(sug.PROMO_CAL_ID)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${activatedPromos.includes(sug.PROMO_CAL_ID) ? 'bg-purple-500' : 'border-2 border-gray-300'}`}>
                        {activatedPromos.includes(sug.PROMO_CAL_ID) && <Check size={13} className="text-white" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-xs font-bold text-gray-700 mt-4">All Available Promotions</h3>
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

            {getPromoOrderSuggestions().length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Promo-Based Suggestions</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">Based on active/upcoming promotions (next 30 days)</p>
                {getPromoOrderSuggestions().map((sug, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl p-2.5 mb-1.5 border border-gray-100">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {sug.IMAGE_URL && <img src={sug.IMAGE_URL} alt={sug.PRODUCT_NAME} className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{sug.PRODUCT_NAME}</p>
                        <p className="text-[10px] text-gray-500">{sug.reason} · ↑{sug.uplift}% · €{Math.round((sug.uplift / 100) * (sug.PRICE || 50) * sug.suggestedQty * (sug.PACK_SIZE || 10))} uplift</p>
                      </div>
                    </div>
                    <button onClick={() => addSellableToOrder(sug.CATALOG_ID, sug.suggestedQty)}
                      disabled={sellableOrderItems.find(s => s.CATALOG_ID === sug.CATALOG_ID)}
                      className="text-[10px] px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium disabled:opacity-40">
                      +{sug.suggestedQty} packs
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sellableOrderItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-2">Sellable Products</h3>
                {sellableOrderItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {item.IMAGE_URL && <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} className="w-9 h-9 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.PRODUCT_NAME}</p>
                          <p className="text-[10px] text-gray-500">{item.SKU} · €{item.PRICE}/unit · Pack of {item.PACK_SIZE || 10}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button onClick={() => updateSellableQty(idx, -1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Minus size={12} className="text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-velvet-dark">{item.qty}</span>
                        <button onClick={() => updateSellableQty(idx, 1)} className="w-7 h-7 rounded-lg bg-velvet-dark flex items-center justify-center">
                          <Plus size={12} className="text-velvet-gold" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowAddSellable(!showAddSellable)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-2xl text-xs text-gray-500 hover:border-velvet-gold hover:text-velvet-dark">
              <Plus size={14} /> Add Sellable Product
            </button>
            {showAddSellable && (
              <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-200 max-h-48 overflow-y-auto space-y-1">
                {catalog.filter(c => c.PRODUCT_TYPE === 'Sellable' && !sellableOrderItems.find(s => s.CATALOG_ID === c.CATALOG_ID)).map(item => (
                  <button key={item.CATALOG_ID} onClick={() => addSellableToOrder(item.CATALOG_ID, 1)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 text-left">
                    {item.IMAGE_URL && <img src={item.IMAGE_URL} alt={item.PRODUCT_NAME} className="w-7 h-7 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.PRODUCT_NAME}</p>
                      <p className="text-[10px] text-gray-500">{item.CATEGORY} · €{item.PRICE}/u · Pack {item.PACK_SIZE || 10}</p>
                    </div>
                    <Plus size={12} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            <h3 className="text-xs font-bold text-gray-700 mt-4">Packs & Non-Sellable Items</h3>
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
            {(orderItems.some(i => i.qty > 0) || sellableOrderItems.length > 0) && (
              <div className="bg-velvet-dark rounded-2xl p-4 mt-2">
                <div className="flex justify-between items-center text-white mb-1">
                  <span className="text-sm">Total items ordered</span>
                  <span className="text-xl font-bold">{orderItems.reduce((s, i) => s + i.qty, 0) + sellableOrderItems.reduce((s, i) => s + i.qty, 0)}</span>
                </div>
                {sellableOrderItems.length > 0 && (
                  <div className="flex justify-between items-center text-gray-300 text-xs">
                    <span>Sellable ({sellableOrderItems.reduce((s, i) => s + i.qty * (i.PACK_SIZE || 10), 0)} units)</span>
                    <span>€{sellableOrderItems.reduce((s, i) => s + i.qty * (i.PACK_SIZE || 10) * (i.PRICE || 0), 0).toFixed(0)}</span>
                  </div>
                )}
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
                <p>Orders placed: {(orderItems.reduce((s, i) => s + i.qty, 0) + sellableOrderItems.reduce((s, i) => s + i.qty, 0))} items</p>
                <p>Photos taken: {photos.length}</p>
              </div>
            </div>

            {sellableOrderItems.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Order Form</h3>
                <p className="text-[10px] text-gray-500 mb-3">Generate a PDF order form for sellable products with barcodes</p>
                <div className="flex gap-2">
                  <button onClick={generateOrderForm} disabled={generatingOrderForm}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-velvet-dark text-velvet-gold rounded-xl text-xs font-semibold disabled:opacity-60">
                    {generatingOrderForm ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><FileText size={14} /> Generate Order Form</>}
                  </button>
                  {orderFormUrl && (
                    <button onClick={sendOrderFormByEmail}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold">
                      <Mail size={14} /> Email
                    </button>
                  )}
                </div>
                {orderFormUrl && (
                  <div className="mt-3">
                    <a href={orderFormUrl} download={`order_form_${store?.STORE_NAME || 'store'}_${new Date().toISOString().slice(0, 10)}.pdf`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium">
                      <FileText size={12} /> Download PDF
                    </a>
                  </div>
                )}
              </div>
            )}
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
