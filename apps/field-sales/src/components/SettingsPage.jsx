import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Check, Loader2, User, Database } from 'lucide-react'
import { resetDemo } from '../api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [result, setResult] = useState(null)

  const handleReset = async () => {
    setResetting(true)
    setResetDone(false)
    try {
      const res = await resetDemo()
      setResult(res.data)
      setResetDone(true)
    } catch (e) {
      alert('Reset failed: ' + (e.response?.data?.error || e.message))
    }
    setResetting(false)
  }

  return (
    <div className="pb-6">
      <div className="bg-velvet-dark px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">Settings</h1>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-velvet-dark flex items-center justify-center">
              <User size={16} className="text-velvet-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Eric Sarr</p>
              <p className="text-xs text-gray-500">Field Sales · Paris West</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Manager: Isabelle Morin</p>
            <p>Region: Île-de-France</p>
            <p>REP ID: 1</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Database size={18} className="text-velvet-gold" />
            <h2 className="font-semibold text-gray-800">Demo Configuration</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Reset all visits for Eric Sarr. This will delete existing visits and create a new 4-week schedule with Sephora Clamart as today's first visit.
          </p>

          {resetDone ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <Check size={24} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-800">Demo Reset Complete</p>
              <p className="text-xs text-emerald-600 mt-1">{result?.visits_created} visits created</p>
              <button onClick={() => navigate('/')} className="mt-3 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium">
                Back to Home
              </button>
            </div>
          ) : (
            <button onClick={handleReset} disabled={resetting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-all">
              {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {resetting ? 'Resetting...' : 'Reset Demo Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
