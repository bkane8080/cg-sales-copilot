import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, Bot, Sparkles, MapPin, Calendar, CheckCircle2, X, Loader2, Target, Mail, Route, Clock, Mic, Volume2, VolumeX } from 'lucide-react'
import { chatWithFieldAgent, createVisit, sendManagerEmail, optimizeRoute, speechToText, textToSpeech } from '../api'

const QUICK_ACTIONS = [
  'Prepare my next visit to Sephora Clamart',
  'What should I focus on today?',
  'I have some time, any POS nearby I can visit?',
  'Summarize last visit for Sephora Clamart',
  'Create a visit for tomorrow morning',
]

export default function Assistant() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storeId = searchParams.get('store_id') || 65
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello Eric! I\'m your Velvet F&B field assistant, powered by Snowflake Cortex. I can help you prepare visits, find nearby opportunities, and manage your route. What can I help with?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [recording, setRecording] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const messagesEnd = useRef(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, pendingAction])

  const toggleRecording = async () => {
    if (recording) {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.stop) mediaRecorderRef.current.stop()
      }
      setRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      mediaRecorderRef.current = recognition
      setRecording(true)
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript
        console.log('[Voice] Recognized:', text)
        if (text && text.trim()) sendMessage(text)
        setRecording(false)
      }
      recognition.onerror = (event) => {
        console.error('[Voice] Recognition error:', event.error)
        setRecording(false)
      }
      recognition.onend = () => setRecording(false)
      recognition.start()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (audioChunksRef.current.length === 0) return
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        if (blob.size < 100) return
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1]
          try {
            const res = await speechToText(base64)
            const text = res.data.text
            if (text && text.trim()) sendMessage(text)
          } catch (e) {
            console.error('[Voice] STT error:', e)
          }
        }
        reader.readAsDataURL(blob)
      }
      mediaRecorder.start(250)
      setRecording(true)
    } catch (e) {
      console.error('Mic access denied:', e)
    }
  }

  const speakResponse = async (text) => {
    if (!ttsEnabled || !text) return
    try {
      setSpeaking(true)
      const cleanText = text.replace(/[→•\-\*#]/g, '').replace(/\n+/g, '. ').slice(0, 500)
      const res = await textToSpeech(cleanText)
      const audioData = res.data.audio
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`)
      audioRef.current = audio
      audio.onended = () => setSpeaking(false)
      audio.onerror = () => setSpeaking(false)
      audio.play()
    } catch (e) {
      setSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setPendingAction(null)
    try {
      const history = messages.slice(1).filter(m => m.role === 'user' || (m.role === 'assistant' && !m.content.startsWith('Hello Eric'))).slice(-6)
      const res = await chatWithFieldAgent(text, parseInt(storeId), history)
      const data = res.data

      const assistantMsg = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMsg])
      speakResponse(data.response)

      if (data.route_recommendation) {
        setPendingAction({ type: 'route', ...data.route_recommendation })
      } else if (data.visit_proposal) {
        setPendingAction({ type: 'visit', ...data.visit_proposal })
      } else if (data.email_action) {
        setPendingAction({ type: 'email', ...data.email_action })
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }])
    }
    setLoading(false)
  }

  const confirmAction = async (customDate) => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)

    if (action.type === 'visit' || action.type === 'route') {
      const now = new Date()
      const defaultDate = action.type === 'route'
        ? `${now.toISOString().split('T')[0]} ${String(now.getHours() + 1).padStart(2, '0')}:00:00`
        : new Date(Date.now() + 86400000).toISOString().split('T')[0] + ' 09:00:00'
      const visitDate = customDate || action.date || defaultDate
      try {
        await createVisit({
          rep_id: 1,
          store_id: action.store_id || parseInt(storeId),
          scheduled_datetime: visitDate,
          status: 'Planned',
          notes: `${action.objectives || action.reason || ''}`
        })
        setMessages(prev => [...prev, { role: 'assistant', content: `Done! Visit created for ${action.store_name} on ${visitDate}. Added to your agenda. Would you like me to notify the store manager?` }])
      } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to create visit. Please try again.' }])
      }
    } else if (action.type === 'email') {
      try {
        const res = await sendManagerEmail({
          store_name: action.store_name,
          manager_name: action.manager_name,
          visit_date: action.visit_date,
          message_body: action.message
        })
        setMessages(prev => [...prev, { role: 'assistant', content: `Email sent to ${action.manager_name} at ${action.store_name}. Subject: "${res.data.email.subject}"` }])
      } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to send email. Please try again.' }])
      }
    }
  }

  const addToRouteAndOptimize = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    setMessages(prev => [...prev, { role: 'assistant', content: `Adding ${action.store_name} to your current route and optimizing...` }])
    const now = new Date()
    const visitTime = `${now.toISOString().split('T')[0]} ${String(now.getHours() + 1).padStart(2, '0')}:00:00`
    try {
      await createVisit({
        rep_id: 1,
        store_id: action.store_id,
        scheduled_datetime: visitTime,
        status: 'Planned',
        notes: action.reason || `Nearby store visit — ${action.store_name}`
      })
      setMessages(prev => [...prev, { role: 'assistant', content: `Route updated! ${action.store_name} added as a stop at ${visitTime.slice(11, 16)}. Would you like me to notify the store manager about your visit?` }])
      setPendingAction({ type: 'email', store_name: action.store_name, manager_name: action.manager_name || 'Store Manager', visit_date: 'today', message: `Bonjour, I will be passing by ${action.store_name} today for a quick visit to review performance. Best regards, Eric Sarr - Velvet F&B` })
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to add to route. Please try again.' }])
    }
  }

  const renderMessage = (msg, idx) => {
    if (msg.role === 'user') {
      return (
        <div key={idx} className="flex justify-end">
          <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-velvet-dark text-white text-sm leading-relaxed">
            {msg.content}
          </div>
        </div>
      )
    }

    const lines = msg.content.split('\n')
    const actionItems = lines.filter(l => l.trim().startsWith('→') || l.trim().startsWith('->'))
    const bodyLines = lines.filter(l => !l.trim().startsWith('→') && !l.trim().startsWith('->'))

    return (
      <div key={idx} className="flex items-start gap-2">
        <div className="w-7 h-7 bg-velvet-dark rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={12} className="text-velvet-gold" />
        </div>
        <div className="max-w-[85%] space-y-2">
          <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {bodyLines.join('\n').trim()}
          </div>
          {actionItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1.5 flex items-center gap-1">
                <Target size={10} /> Action Items
              </p>
              {actionItems.map((item, i) => (
                <p key={i} className="text-xs text-amber-900 leading-relaxed">{item.trim()}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderActionCard = () => {
    if (!pendingAction) return null

    if (pendingAction.type === 'route') {
      return (
        <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-blue-200 mx-2">
          <div className="flex items-center gap-2 mb-3">
            <Route size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Recommended Store Visit</span>
          </div>
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-700"><span className="font-medium">Store:</span> {pendingAction.store_name}</p>
            {pendingAction.priority && <p className="text-xs text-gray-700"><span className="font-medium">Priority:</span> {pendingAction.priority}</p>}
            {pendingAction.reason && <p className="text-xs text-gray-600 italic">{pendingAction.reason}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={addToRouteAndOptimize}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold">
              <MapPin size={13} /> Add to Route
            </button>
            <button onClick={() => confirmAction()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
              <Calendar size={13} /> Schedule Visit
            </button>
            <button onClick={() => setPendingAction(null)}
              className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold">
              <X size={13} />
            </button>
          </div>
          <button onClick={() => sendMessage('Suggest another store nearby')}
            className="mt-2 w-full text-center text-[11px] text-blue-600 hover:text-blue-800 font-medium">
            Suggest another store
          </button>
        </div>
      )
    }

    if (pendingAction.type === 'visit') {
      return (
        <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-emerald-200 mx-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">Create Visit?</span>
          </div>
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-700"><span className="font-medium">Store:</span> {pendingAction.store_name}</p>
            {pendingAction.date && <p className="text-xs text-gray-700"><span className="font-medium">Date:</span> {pendingAction.date}</p>}
            {pendingAction.objectives && <p className="text-xs text-gray-700"><span className="font-medium">Objectives:</span> {pendingAction.objectives}</p>}
            {pendingAction.reason && <p className="text-xs text-gray-600 italic">{pendingAction.reason}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirmAction()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
              <CheckCircle2 size={14} /> Confirm
            </button>
            <button onClick={() => sendMessage('Choose another date for the visit')}
              className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">
              <Clock size={13} /> Other Date
            </button>
            <button onClick={() => setPendingAction(null)}
              className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold">
              <X size={13} />
            </button>
          </div>
        </div>
      )
    }

    if (pendingAction.type === 'email') {
      return (
        <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-200 mx-2">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-purple-600" />
            <span className="text-sm font-semibold text-gray-800">Notify Store Manager?</span>
          </div>
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-700"><span className="font-medium">To:</span> {pendingAction.manager_name} ({pendingAction.store_name})</p>
            <p className="text-xs text-gray-700"><span className="font-medium">Visit:</span> {pendingAction.visit_date}</p>
            {pendingAction.message && <p className="text-xs text-gray-500 italic truncate">{pendingAction.message}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirmAction()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-semibold">
              <Mail size={13} /> Send Email
            </button>
            <button onClick={() => setPendingAction(null)}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold">
              Skip
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-velvet-dark px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-velvet-gold/20 rounded-full flex items-center justify-center">
            <Sparkles size={14} className="text-velvet-gold" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Field Sales Assistant</h1>
            <p className="text-[10px] text-gray-400">Powered by Snowflake Cortex Agent</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.map((msg, i) => renderMessage(msg, i))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 bg-velvet-dark rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-velvet-gold" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-velvet-gold" />
                <span className="text-xs text-gray-400">Analyzing data...</span>
              </div>
            </div>
          </div>
        )}

        {renderActionCard()}

        <div ref={messagesEnd} />
      </div>

      {messages.length <= 2 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_ACTIONS.map((action, i) => (
            <button key={i} onClick={() => sendMessage(action)}
              className="text-xs px-3 py-1.5 bg-velvet-gold/10 text-velvet-dark rounded-full whitespace-nowrap hover:bg-velvet-gold/20 font-medium border border-velvet-gold/20">
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-center gap-2">
          <button onClick={() => { setTtsEnabled(!ttsEnabled); if (speaking) stopSpeaking() }}
            className={`p-3 rounded-xl border ${ttsEnabled ? 'bg-velvet-gold/10 border-velvet-gold/30 text-velvet-dark' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about visits, stores, actions..."
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30 border border-gray-100"
          />
          {input.trim() ? (
            <button onClick={() => sendMessage(input)} disabled={loading}
              className="p-3 bg-velvet-dark text-velvet-gold rounded-xl disabled:opacity-30">
              <Send size={18} />
            </button>
          ) : (
            <button
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition-all ${recording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-velvet-dark text-velvet-gold'}`}>
              <Mic size={18} />
            </button>
          )}
        </div>
        {recording && (
          <p className="text-center text-[10px] text-red-500 font-medium mt-1.5 animate-pulse">Recording... Tap mic to stop</p>
        )}
      </div>
    </div>
  )
}
