'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/presentation/hooks/useAuth'

interface BuyRequestItem {
  id: string
  from_user_id: string
  to_user_id: string
  mensaje_inicial: string
  estado: string
  created_at?: string
}

export default function BuyRequestsPage() {
  const { user } = useAuth(false)
  const [received, setReceived] = useState<BuyRequestItem[]>([])
  const [sent, setSent] = useState<BuyRequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/buy-requests?userId=${user.id}`)
        if (!res.ok) {
          throw new Error('Error al cargar solicitudes')
        }
        const data = await res.json()
        if (!mounted) return
        setReceived(data.received || [])
        setSent(data.sent || [])
      } catch (error) {
        console.error('Error cargando buy requests:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user?.id])

  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Inicia sesión para ver tus solicitudes de compra.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Cargando solicitudes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-black mb-2">Solicitudes de compra</h1>
        <p className="text-gray-700 mb-6">
          Aquí verás las solicitudes que te han enviado otros ganaderos y las que tú has enviado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-xl font-bold text-black mb-3">Recibidas</h2>
            {received.length === 0 ? (
              <p className="text-sm text-gray-600">Aún no tienes solicitudes recibidas.</p>
            ) : (
              <ul className="space-y-3">
                {received.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/buy-requests/${r.id}`}
                      className="block bg-white rounded-xl p-4 shadow border border-gray-200 hover:shadow-md transition-all"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        De: {r.from_user_id}
                      </p>
                      <p className="text-sm text-gray-800 mb-1 line-clamp-2">
                        {r.mensaje_inicial}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estado: <span className="font-semibold">{r.estado}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">Enviadas</h2>
            {sent.length === 0 ? (
              <p className="text-sm text-gray-600">Aún no has enviado solicitudes.</p>
            ) : (
              <ul className="space-y-3">
                {sent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/buy-requests/${r.id}`}
                      className="block bg-white rounded-xl p-4 shadow border border-gray-200 hover:shadow-md transition-all"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        Para: {r.to_user_id}
                      </p>
                      <p className="text-sm text-gray-800 mb-1 line-clamp-2">
                        {r.mensaje_inicial}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estado: <span className="font-semibold">{r.estado}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

