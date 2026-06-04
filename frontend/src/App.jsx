import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { MapPin, BarChart3, TrendingUp, User } from 'lucide-react'
import FieldSalesView from './components/FieldSales/FieldSalesView'
import SalesManagerView from './components/SalesManager/SalesManagerView'
import CategoryManagerView from './components/CategoryManager/CategoryManagerView'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-velvet-dark text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-velvet-gold rounded-full flex items-center justify-center shadow-md">
                  <span className="text-velvet-dark font-bold text-sm">V</span>
                </div>
                <span className="font-display text-xl text-velvet-gold tracking-wide">Velvet F&B</span>
              </div>
              <div className="flex gap-1">
                <NavLink to="/"
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-velvet-gold text-velvet-dark font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                  <MapPin size={16} /> Field Sales
                </NavLink>
                <NavLink to="/manager"
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-velvet-gold text-velvet-dark font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                  <BarChart3 size={16} /> Sales Manager
                </NavLink>
                <NavLink to="/category"
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-velvet-gold text-velvet-dark font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                  <TrendingUp size={16} /> Category Manager
                </NavLink>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-8 h-8 rounded-full bg-velvet-accent flex items-center justify-center">
                  <User size={14} className="text-velvet-gold" />
                </div>
                <span className="font-medium">Eric Sarr</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<FieldSalesView />} />
            <Route path="/manager" element={<SalesManagerView />} />
            <Route path="/category" element={<CategoryManagerView />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
