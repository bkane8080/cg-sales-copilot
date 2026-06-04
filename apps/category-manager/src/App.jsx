import React from 'react'
import { TrendingUp, User } from 'lucide-react'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-velvet-dark text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-velvet-gold rounded-full flex items-center justify-center shadow-md">
                <span className="text-velvet-dark font-bold text-sm">V</span>
              </div>
              <div>
                <span className="font-display text-lg text-velvet-gold">Velvet F&B</span>
                <span className="ml-2 text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Category Manager</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-velvet-accent flex items-center justify-center">
                <User size={14} className="text-velvet-gold" />
              </div>
              <span className="text-sm font-medium text-gray-300">Camille Durand</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
