import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import StoreDetail from './components/StoreDetail'
import RetailExecution from './components/RetailExecution'
import Assistant from './components/Assistant'
import POSDirectory from './components/POSDirectory'
import NewVisit from './components/NewVisit'
import CalendarView from './components/CalendarView'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto lg:max-w-none">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/store/:id/execution" element={<RetailExecution />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/pos" element={<POSDirectory />} />
          <Route path="/new-visit" element={<NewVisit />} />
          <Route path="/calendar" element={<CalendarView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
