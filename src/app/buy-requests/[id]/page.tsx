'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/presentation/hooks/useAuth'

interface ChatMessage {
  id: string
  author_id: string
  texto: string
  created_at?: string
}

export default function BuyRequestChatPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  const buyRequestId = params.id

  useEffect(() => {
    if (!buyRequestId) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/buy-requests/${buyRequestId}/chat`)
        if (!res.ok) throw new Error('Error al cargar mensajes')
        const data = await res.json()
        if (!mounted) return
        setMessages(data.messages || [])
      } catch (error) {
        console.error('Error cargando chat:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [buyRequestId])

  const handleSend = async () => {
    if (!user?.id || !texto.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/buy-requests/${buyRequestId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: user.id,
          texto: texto.trim(),
        }),
      })
      if (!res.ok) throw new Error('Error al enviar mensaje')
      setTexto('')
      // recargar mensajes rápido (para MVP)
      const reload = await fetch(`/api/buy-requests/${buyRequestId}/chat`)
      if (reload.ok) {
        const data = await reload.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    } finally {
      setSending(false)
    }
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Inicia sesión para ver este chat.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Cargando chat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-3xl flex flex-col h-[calc(100vh-3rem)]">
        <h1 className="text-2xl font-bold text-black mb-4">
          Chat de solicitud #{buyRequestId}
        </h1>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No hay mensajes todavía.</p>
          ) : (
            messages.map((m) => {
              const isMine = m.author_id === user.id
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-cownect-green text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p>{m.texto}</p>
                    {m.created_at && (
                      <p className="mt-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cownect-green resize-none"
            placeholder="Escribe un mensaje para negociar el trato..."
          />
          <button
            onClick={handleSend}
            disabled={sending || !texto.trim()}
            className="self-end bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}

