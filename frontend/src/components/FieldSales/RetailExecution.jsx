import React, { useState } from 'react'
import { ClipboardCheck, ShoppingCart, Star, Check } from 'lucide-react'
import { auditVisit } from '../../api'

export default function RetailExecution({ storeId, visit }) {
  const [compliance, setCompliance] = useState(visit?.AUDIT_PLANOGRAM_COMPLIANCE_SCORE || 85)
  const [submitted, setSubmitted] = useState(false)
  const [orderItems, setOrderItems] = useState([
    { product: 'Oud Mystique', qty: 0 },
    { product: 'Lumière de Soie', qty: 0 },
    { product: 'Éclat Suprême Sérum', qty: 0 },
    { product: 'Rouge Velours Éternel', qty: 0 },
    { product: 'Palette Regard Opéra', qty: 0 },
  ])

  const handleAuditSubmit = async () => {
    if (!visit) return
    try {
      await auditVisit(visit.VISIT_ID, compliance)
      setSubmitted(true)
    } catch (e) {
      alert('Error submitting audit')
    }
  }

  const updateQty = (idx, val) => {
    const items = [...orderItems]
    items[idx].qty = Math.max(0, parseInt(val) || 0)
    setOrderItems(items)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Planogram Audit */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ClipboardCheck size={20} className="text-velvet-gold" />
          <h3 className="font-semibold text-gray-800">Audit Planogramme</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-600 font-medium">Score de Conformité</label>
            <div className="mt-3">
              <input type="range" min="0" max="100" value={compliance}
                onChange={(e) => setCompliance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-velvet-gold" />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">0%</span>
                <span className={`text-lg font-bold ${compliance >= 80 ? 'text-emerald-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {compliance}%
                </span>
                <span className="text-xs text-gray-400">100%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">Checklist Rapide</label>
            {['Facing produits conformes', 'PLV en place', 'Prix affichés correctement', 'Stock rayon suffisant'].map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-velvet-gold focus:ring-velvet-gold" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>

          <button onClick={handleAuditSubmit} disabled={submitted}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              submitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-velvet-dark text-velvet-gold hover:bg-velvet-navy'
            }`}>
            {submitted ? (
              <span className="flex items-center justify-center gap-2"><Check size={16} /> Audit Soumis</span>
            ) : 'Soumettre l\'Audit'}
          </button>
        </div>
      </div>

      {/* Order Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingCart size={20} className="text-velvet-gold" />
          <h3 className="font-semibold text-gray-800">Prise de Commande</h3>
        </div>

        <div className="space-y-3">
          {orderItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">{item.product}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(idx, item.qty - 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold">
                  −
                </button>
                <input type="number" value={item.qty} onChange={(e) => updateQty(idx, e.target.value)}
                  className="w-12 text-center text-sm font-medium border border-gray-200 rounded-lg py-1" />
                <button onClick={() => updateQty(idx, item.qty + 1)}
                  className="w-7 h-7 rounded-lg bg-velvet-dark text-velvet-gold hover:bg-velvet-navy flex items-center justify-center text-sm font-bold">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Total unités</span>
            <span className="text-lg font-bold text-velvet-dark">
              {orderItems.reduce((sum, i) => sum + i.qty, 0)}
            </span>
          </div>
          <button className="w-full py-3 bg-velvet-dark text-velvet-gold rounded-xl text-sm font-semibold hover:bg-velvet-navy transition-all">
            Valider la Commande
          </button>
        </div>
      </div>
    </div>
  )
}
