import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Mic, MicOff, Bot, Sparkles } from 'lucide-react'
import { chatWithAgent } from '../api'

export default function Assistant() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour Eric! Je suis ton coach retail Velvet. Comment puis-je t\'aider aujourd\'hui?' }
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
      const res = await chatWithAgent(text, 3)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Vérifie que le backend est actif.' }])
    }
    setLoading(false)
  }

  const quickActions = ['Prépare ma visite Sephora Clamart', 'Arguments pour négocier un 2ème facing', 'Quelle promo proposer?', 'Résumé KPIs du jour']

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-velvet-dark px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-velvet-gold/20 rounded-full flex items-center justify-center">
            <Sparkles size={14} className="text-velvet-gold" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Velvet Assistant</h1>
            <p className="text-[10px] text-gray-400">Powered by Snowflake Cortex</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-velvet-dark rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <Bot size={12} className="text-velvet-gold" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
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
            <div className="w-7 h-7 bg-velvet-dark rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-velvet-gold" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-velvet-gold rounded-full animate-bounce" />
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
              className="text-xs px-3 py-1.5 bg-velvet-gold/10 text-velvet-dark rounded-full whitespace-nowrap hover:bg-velvet-gold/20 font-medium border border-velvet-gold/20">
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-center gap-2">
          <button onClick={() => setRecording(!recording)}
            className={`p-3 rounded-xl transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-velvet-gold/30 border border-gray-100"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim()}
            className="p-3 bg-velvet-dark text-velvet-gold rounded-xl disabled:opacity-30">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
