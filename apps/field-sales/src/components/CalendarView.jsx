import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, AlertTriangle, MapPin, Plus } from 'lucide-react'
import { getVisits } from '../api'

export default function CalendarView() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    getVisits().then(res => setVisits(res.data)).catch(() => {})
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const navigateMonth = (delta) => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + delta)
    setCurrentMonth(d)
  }

  const getVisitsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return visits.filter(v => v.SCHEDULED_DATETIME.split(' ')[0].split('T')[0] === dateStr)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const selectedVisits = selectedDate ? getVisitsForDay(selectedDate) : []

  const statusColor = (status) => ({
    Completed: 'bg-emerald-500',
    Urgent: 'bg-red-500',
    Planned: 'bg-blue-500'
  }[status] || 'bg-gray-400')

  return (
    <div className="pb-6">
      <div className="bg-velvet-dark px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">Agenda</h1>
        </div>
      </div>

      <div className="px-5 mt-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <h2 className="text-base font-bold text-gray-900 capitalize">
            {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(startOffset).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayVisits = getVisitsForDay(day)
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = selectedDate === day
              const hasUrgent = dayVisits.some(v => v.STATUS === 'Urgent')

              return (
                <button key={day} onClick={() => setSelectedDate(day)}
                  className={`relative flex flex-col items-center py-2 rounded-xl transition-all ${
                    isSelected ? 'bg-velvet-dark text-white' :
                    isToday ? 'bg-velvet-gold/20 text-velvet-dark' :
                    'hover:bg-gray-50 text-gray-700'
                  }`}>
                  <span className={`text-sm font-medium ${isSelected ? 'text-velvet-gold' : ''}`}>{day}</span>
                  {dayVisits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayVisits.slice(0, 3).map((v, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-velvet-gold' :
                          v.STATUS === 'Urgent' ? 'bg-red-500' : 'bg-velvet-accent'
                        }`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Visits */}
        {selectedDate && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                {selectedVisits.length} visit{selectedVisits.length !== 1 ? 's' : ''} · {selectedDate} {currentMonth.toLocaleDateString('en-GB', { month: 'short' })}
              </h3>
              <button onClick={() => navigate(`/new-visit`)}
                className="flex items-center gap-1 text-xs text-velvet-dark bg-velvet-gold/20 px-2.5 py-1 rounded-full font-medium">
                <Plus size={11} /> Add
              </button>
            </div>
            {selectedVisits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No visits this day</p>
            ) : (
              <div className="space-y-2">
                {selectedVisits.map(visit => (
                  <div key={visit.VISIT_ID} onClick={() => navigate(`/store/${visit.STORE_ID}`)}
                    className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor(visit.STATUS)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{visit.STORE_NAME || visit.RETAILER_NAME}</p>
                      <p className="text-xs text-gray-500 truncate">{visit.ADDRESS}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(visit.SCHEDULED_DATETIME).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        visit.STATUS === 'Urgent' ? 'bg-red-100 text-red-700' :
                        visit.STATUS === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{visit.STATUS}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
