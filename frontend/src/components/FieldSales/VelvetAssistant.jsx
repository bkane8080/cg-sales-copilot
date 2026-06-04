import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Mic, MicOff, Bot, Sparkles } from 'lucide-react'
import { chatWithAgent } from '../../api'

export default function VelvetAssistant({ storeId, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour Eric! Je suis ton coach retail Velvet. Comment puis-je t\'aider à préparer cette visite?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEnd = useRef(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await chatWithAgent(text, storeId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Veuillez réessayer.' }])
    }
    setLoading(false)
  }

  const toggleRecording = async () => {
    if (!recording) {
      setRecording(true)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const chunks = []
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          setRecording(false)
          sendMessage('Prépare-moi pour ma prochaine visite. Sur quoi dois-je me concentrer?')
        }
        mediaRecorder.start()
        setTimeout(() => mediaRecorder.stop(), 5000)
      } catch (e) {
        setRecording(false)
      }
    }
  }

  const quickActions = [
    'Prépare ma visite',
    'Arguments de négociation',
    'Opportunités promo',
  ]

  return (
    <div className="fixed bottom-24 right-6 w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-velvet-dark to-velvet-navy text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-velvet-gold/20 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-velvet-gold" />
          </div>
          <div>
            <span className="font-semibold text-sm">Velvet Assistant</span>
            <p className="text-[10px] text-gray-400">Powered by Snowflake Cortex</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 bg-velvet-dark rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={12} className="text-velvet-gold" />
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-velvet-dark text-white rounded-br-md'
                : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-velvet-dark rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-velvet-gold" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-velvet-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-velvet-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-velvet-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => sendMessage(action)}
              className="text-xs px-3 py-1.5 bg-velvet-gold/10 text-velvet-dark rounded-full whitespace-nowrap hover:bg-velvet-gold/20 transition-colors font-medium">
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-all ${recording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Pose ta question..."
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30 border border-gray-100"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="p-2.5 bg-velvet-dark text-velvet-gold rounded-xl hover:bg-velvet-navy transition-all disabled:opacity-30">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
