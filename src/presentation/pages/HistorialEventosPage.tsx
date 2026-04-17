'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { TIPOS_EVENTO, type TipoEvento } from '@/domain/entities/EventoAnimal'

function HistorialEventosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animalId = searchParams.get('id')
  const { user } = useAuth(false)
  const [eventos, setEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    tipo_evento: 'REVISION_GENERAL' as TipoEvento,
    fecha_evento: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  useEffect(() => {
    if (animalId && user?.id) loadHistorial()
  }, [animalId, user?.id])

  const loadHistorial = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithAuth(`/api/eventos-animal?animal_id=${encodeURIComponent(animalId || '')}&userId=${encodeURIComponent(user?.id || '')}&orden=desc`)
      const data = await res.json().catch(() => [])
      if (!res.ok) {
        setError((data as any)?.error || 'No se pudo cargar el historial de eventos.')
        setEventos([])
      } else {
        setEventos(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
      setError('Error de red al cargar eventos.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!animalId || !user?.id) return
    try {
      setSaving(true)
      setError(null)
      const payload = {
        userId: user.id,
        animal_id: animalId,
        tipo_evento: form.tipo_evento,
        fecha_evento: form.fecha_evento,
        observaciones: form.observaciones?.trim() || undefined,
      }
      const res = await fetchWithAuth('/api/eventos-animal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as any)?.error || 'No se pudo registrar el evento.')
        return
      }
      setForm({
        tipo_evento: 'REVISION_GENERAL',
        fecha_evento: new Date().toISOString().split('T')[0],
        observaciones: '',
      })
      await loadHistorial()
    } catch {
      setError('Error de red al registrar evento.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando historial...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard/gestion" inline />
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-cownect-green/20">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900">Historial de Eventos</h1>
                <p className="text-gray-600 mt-1">Bitácora completa de movimientos, cambios y sucesos del animal</p>
              </div>

              <form onSubmit={handleAddEvento} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <select
                  value={form.tipo_evento}
                  onChange={(e) => setForm({ ...form, tipo_evento: e.target.value as TipoEvento })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TIPOS_EVENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.fecha_evento}
                  onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                <input
                  type="text"
                  placeholder="Observaciones"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-1"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-cownect-green text-white rounded-lg px-4 py-2 font-bold disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : 'Agregar evento'}
                </button>
              </form>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-100"></div>
                
                {eventos.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-400 italic">No se han registrado eventos para este animal aún</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative">
                    {eventos.map((ev, idx) => (
                      <div key={ev.id || idx} className="relative pl-20">
                        <div className="absolute left-6 top-1 w-5 h-5 rounded-full bg-cownect-green border-4 border-white shadow"></div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase">{ev.tipo_evento || 'EVENTO'}</p>
                          <p className="text-sm text-gray-900 font-semibold mt-1">{ev.fecha_evento || '-'}</p>
                          {ev.observaciones && <p className="text-sm text-gray-700 mt-2">{ev.observaciones}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function HistorialEventosPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Cargando...</div>}>
      <HistorialEventosContent />
    </Suspense>
  )
}

export default function HistorialEventosPage() {
  return (
    <ProtectedRoute>
      <HistorialEventosPageWrapper />
    </ProtectedRoute>
  )
}
