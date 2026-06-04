import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { auditVisit } from '../api'

const ORDER_PRODUCTS = [
  { product: 'Oud Mystique', sku: 'VFB-001', price: '€185' },
  { product: 'Lumière de Soie', sku: 'VFB-002', price: '€145' },
  { product: 'Éclat Suprême Sérum', sku: 'VFB-006', price: '€92' },
  { product: 'Rouge Velours Éternel', sku: 'VFB-011', price: '€42' },
  { product: 'Palette Regard Opéra', sku: 'VFB-012', price: '€68' },
  { product: 'Mascara Volume Infini', sku: 'VFB-014', price: '€38' },
]

export default function RetailExecution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('audit')
  const [compliance, setCompliance] = useState(85)
  const [checks, setChecks] = useState([false, false, false, false, false])
  const [submitted, setSubmitted] = useState(false)
  const [orderItems, setOrderItems] = useState(ORDER_PRODUCTS.map(p => ({ ...p, qty: 0 })))

  const checkItems = ['Facing conformes au planogramme', 'PLV & ILV en place', 'Prix affichés correctement', 'Stock rayon suffisant', 'Propreté du linéaire']

  const toggleCheck = (i) => {
    const c = [...checks]
    c[i] = !c[i]
    setChecks(c)
    setCompliance(Math.round((c.filter(Boolean).length / c.length) * 100))
  }

  const updateQty = (idx, delta) => {
    const items = [...orderItems]
    items[idx].qty = Math.max(0, items[idx].qty + delta)
    setOrderItems(items)
  }

  const handleSubmitAudit = async () => {
    setSubmitted(true)
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/store/${id}`)} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold">Retail Execution</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4 flex gap-2">
        <button onClick={() => setTab('audit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'audit' ? 'bg-velvet-dark text-velvet-gold' : 'bg-gray-100 text-gray-600'
          }`}>
          <ClipboardCheck size={15} /> Audit
        </button>
        <button onClick={() => setTab('order')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'order' ? 'bg-velvet-dark text-velvet-gold' : 'bg-gray-100 text-gray-600'
          }`}>
          <ShoppingCart size={15} /> Commande
        </button>
      </div>

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div className="px-5 mt-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-center mb-4">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#f0f0f0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={compliance >= 80 ? '#10b981' : compliance >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${compliance}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{compliance}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Score de conformité</p>
            </div>

            <div className="space-y-2">
              {checkItems.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    checks[i] ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100'
                  }`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                    checks[i] ? 'bg-emerald-500' : 'border-2 border-gray-300'
                  }`}>
                    {checks[i] && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm ${checks[i] ? 'text-emerald-800' : 'text-gray-700'}`}>{item}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmitAudit} disabled={submitted}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
              submitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-velvet-dark text-velvet-gold'
            }`}>
            {submitted ? <span className="flex items-center justify-center gap-2"><Check size={16} /> Audit Soumis</span> : 'Soumettre l\'Audit'}
          </button>
        </div>
      )}

      {/* Order Tab */}
      {tab === 'order' && (
        <div className="px-5 mt-5 space-y-3">
          {orderItems.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.product}</p>
                <p className="text-xs text-gray-400">{item.sku} · {item.price}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => updateQty(idx, -1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200">
                  <Minus size={14} className="text-gray-600" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                <button onClick={() => updateQty(idx, 1)}
                  className="w-8 h-8 rounded-lg bg-velvet-dark flex items-center justify-center active:bg-velvet-navy">
                  <Plus size={14} className="text-velvet-gold" />
                </button>
              </div>
            </div>
          ))}

          <div className="bg-velvet-dark rounded-2xl p-4 mt-4">
            <div className="flex justify-between items-center text-white mb-3">
              <span className="text-sm">Total unités</span>
              <span className="text-xl font-bold">{orderItems.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
            <button className="w-full py-3 bg-velvet-gold text-velvet-dark rounded-xl font-semibold text-sm">
              Valider la Commande
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
