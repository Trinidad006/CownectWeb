'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/presentation/hooks/useAuth'
import BackButton from '@/presentation/components/ui/BackButton'

interface BuyRequestItem {
  id: string
  from_user_id: string
  to_user_id: string
  from_user_label?: string
  to_user_label?: string
  mensaje_inicial: string
  estado: string
  created_at?: string
  contacto_compartido_tipo?: 'telefono' | 'correo'
  contacto_compartido_valor?: string
}

type PendingAction = {
  id: string
  status: 'accepted' | 'rejected' | 'cancelled'
  title: string
  description: string
}

export default function BuyRequestsPage() {
  const { user } = useAuth(false)
  const [received, setReceived] = useState<BuyRequestItem[]>([])
  const [sent, setSent] = useState<BuyRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string>('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const loadRequests = async (uid: string) => {
    const res = await fetch(`/api/buy-requests?userId=${uid}`)
    if (!res.ok) throw new Error('Error al cargar solicitudes')
    const data = await res.json()
    setReceived(data.received || [])
    setSent(data.sent || [])
  }

  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    ;(async () => {
      try {
        await loadRequests(user.id)
        if (!mounted) return
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

  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    if (!user?.id) return

    setUpdatingId(id)
    try {
      const res = await fetch(`/api/buy-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: user.id,
          status,
          consentimientoCompartirContacto: status === 'accepted',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as any)?.error || 'No se pudo actualizar la solicitud.')
      await loadRequests(user.id)
      setPageError('')
    } catch (error) {
      console.error('Error actualizando estado:', error)
      setPageError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.')
    } finally {
      setUpdatingId(null)
    }
  }

  const requestAction = (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    if (status === 'accepted') {
      setPendingAction({
        id,
        status,
        title: 'Confirmar aceptación',
        description:
          'Al aceptar se compartirá tu número de teléfono. Si no tienes teléfono, se compartirá tu correo. Confirmas que autorizas este intercambio de contacto bajo tu responsabilidad.',
      })
      return
    }
    if (status === 'cancelled') {
      setPendingAction({
        id,
        status,
        title: 'Cancelar solicitud',
        description: '¿Seguro que deseas cancelar esta solicitud de compra?',
      })
      return
    }
    if (status === 'rejected') {
      setPendingAction({
        id,
        status,
        title: 'Rechazar solicitud',
        description: '¿Deseas rechazar esta solicitud?',
      })
      return
    }
  }

  if (!user?.id) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat relative"
        style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <p className="relative z-10 text-lg text-white">Inicia sesión para ver tus solicitudes de compra.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat relative"
        style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <p className="relative z-10 text-lg text-white">Cargando solicitudes...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative py-10"
      style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <div className="mb-4">
          <BackButton href="/dashboard" inline />
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Solicitudes de compra</h1>
          <p className="text-gray-700">
            Gestión directa de solicitudes. Al aceptar, se comparte contacto y continúan fuera de la plataforma.
          </p>
        </div>

        {pageError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {pageError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
            <h2 className="text-xl font-bold text-black mb-3">Recibidas</h2>
            {received.length === 0 ? (
              <p className="text-sm text-gray-600">Aún no tienes solicitudes recibidas.</p>
            ) : (
              <ul className="space-y-3">
                {received.map((r) => (
                  <li key={r.id}>
                    <div className="block bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">
                        De: {r.from_user_label || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-800 mb-1 line-clamp-2">
                        {r.mensaje_inicial}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estado: <span className="font-semibold">{r.estado}</span>
                      </p>
                      {r.estado === 'accepted' && r.contacto_compartido_valor && (
                        <p className="text-xs text-emerald-700 mt-1 font-semibold">
                          Contacto compartido ({r.contacto_compartido_tipo === 'telefono' ? 'teléfono' : 'correo'}):{' '}
                          {r.contacto_compartido_valor}
                        </p>
                      )}
                    </div>
                    {r.estado === 'pending' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => requestAction(r.id, 'accepted')}
                          disabled={updatingId === r.id}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-cownect-dark-green text-white disabled:opacity-60"
                        >
                          {updatingId === r.id ? 'Procesando...' : 'Aceptar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => requestAction(r.id, 'rejected')}
                          disabled={updatingId === r.id}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-200 text-gray-700 disabled:opacity-60"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
            <h2 className="text-xl font-bold text-black mb-3">Enviadas</h2>
            {sent.length === 0 ? (
              <p className="text-sm text-gray-600">Aún no has enviado solicitudes.</p>
            ) : (
              <ul className="space-y-3">
                {sent.map((r) => (
                  <li key={r.id}>
                    <div className="block bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">
                        Para: {r.to_user_label || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-800 mb-1 line-clamp-2">
                        {r.mensaje_inicial}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estado: <span className="font-semibold">{r.estado}</span>
                      </p>
                      {r.estado === 'accepted' && r.contacto_compartido_valor && (
                        <p className="text-xs text-emerald-700 mt-1 font-semibold">
                          Contacto recibido ({r.contacto_compartido_tipo === 'telefono' ? 'teléfono' : 'correo'}):{' '}
                          {r.contacto_compartido_valor}
                        </p>
                      )}
                    </div>
                    {r.estado === 'pending' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => requestAction(r.id, 'cancelled')}
                          disabled={updatingId === r.id}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-red-600 text-white disabled:opacity-60"
                        >
                          {updatingId === r.id ? 'Procesando...' : 'Cancelar solicitud'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[9999] bg-black/60 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{pendingAction.title}</h3>
            <p className="text-sm text-gray-700 mb-5">{pendingAction.description}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const action = pendingAction
                  setPendingAction(null)
                  void updateStatus(action.id, action.status)
                }}
                className="flex-1 bg-cownect-dark-green text-white py-2.5 rounded-lg font-bold"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

