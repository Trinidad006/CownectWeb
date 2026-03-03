'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import {
  TIPOS_EVENTO,
  MOTIVOS_POR_TIPO,
  type TipoEvento,
  type EventoAnimal,
} from '@/domain/entities/EventoAnimal'
import { Animal } from '@/domain/entities/Animal'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { FirebaseEventoAnimalRepository } from '@/infrastructure/repositories/FirebaseEventoAnimalRepository'
import { EventoTemporalValidator } from '@/domain/validators/EventoTemporalValidator'

const animalRepository = new FirebaseAnimalRepository()
const eventoRepository = new FirebaseEventoAnimalRepository()
const eventoTemporalValidator = new EventoTemporalValidator(eventoRepository)

const ETIQUETAS_TIPO: Record<TipoEvento, string> = {
  NACIMIENTO: 'Nacimiento',
  CELO: 'Celo (Estro)',
  SERVICIO: 'Servicio',
  DIAGNOSTICO_GESTACION: 'Diagnóstico gestación',
  PARTO: 'Parto',
  ABORTO: 'Aborto',
  DESTETE: 'Destete',
  MUERTE: 'Muerte',
  VENTA: 'Venta',
  ROBO: 'Robo',
  DESCARTE: 'Descarte',
}

const ETIQUETAS_MOTIVO: Record<string, string> = {
  NORMAL: 'Normal',
  GEMELAR: 'Gemelar',
  DISTOCIA: 'Distocia',
  OTRO: 'Otro',
  DETECTADO: 'Celo detectado',
  OBSERVADO: 'Celo observado',
  MONTA_NATURAL: 'Monta natural',
  INSEMINACION: 'Inseminación',
  POSITIVO: 'Positivo',
  NEGATIVO: 'Negativo',
  NATIMORTO: 'Natimorto',
  NATURAL: 'Natural',
  INFECCION: 'Infección',
  TRAUMATICO: 'Traumático',
  EDAD: 'Edad',
  PESO: 'Peso',
  MANUAL: 'Manual',
  ENFERMEDAD: 'Enfermedad',
  ACCIDENTE: 'Accidente',
  SACRIFICIO: 'Sacrificio',
  VENTA_NORMAL: 'Venta normal',
  SUBASTA: 'Subasta',
  ROBO_PARCIAL: 'Robo parcial',
  ROBO_TOTAL: 'Robo total',
  BAJA_PRODUCCION: 'Baja producción',
  ENFERMEDAD_CRONICA: 'Enfermedad crónica',
  SIN_MOTIVO: 'Sin especificar',
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function HistorialEventosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const animalId = searchParams.get('id')

  const [animal, setAnimal] = useState<Animal | null>(null)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [eventos, setEventos] = useState<EventoAnimal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    tipo_evento: '' as TipoEvento | '',
    fecha_evento: new Date().toISOString().split('T')[0],
    motivo_id: '',
    observaciones: '',
    madre_id: '',
    cria_id: '',
  })

  const loadAnimal = useCallback(async () => {
    if (!animalId || !user?.id) return
    try {
      const a = await animalRepository.getById(animalId, user.id)
      if (!a) {
        setError('Animal no encontrado')
        return
      }
      setAnimal(a)
    } catch (e) {
      setError('Error al cargar el animal')
    }
  }, [animalId, user?.id])

  const loadAnimales = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = await animalRepository.getAll(user.id)
      setAnimales(list.filter((a) => a.activo !== false))
    } catch {
      setAnimales([])
    }
  }, [user?.id])

  const loadEventos = useCallback(async () => {
    if (!animalId || !user?.id) return
    try {
      setError(null)
      const list = await eventoRepository.getByAnimalId(animalId, user.id, 'asc')
      setEventos(list)
    } catch (e) {
      setEventos([])
      setError(e instanceof Error ? e.message : 'Error al cargar eventos')
    }
  }, [animalId, user?.id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!animalId) {
      router.replace('/dashboard/gestion')
      return
    }
    setError(null)
    setLoading(true)
    Promise.all([loadAnimal(), loadAnimales(), loadEventos()]).finally(() => setLoading(false))
  }, [user, authLoading, animalId, router, loadAnimal, loadAnimales, loadEventos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !animalId || !form.tipo_evento) return
    if (form.tipo_evento === 'NACIMIENTO' && !form.madre_id.trim()) {
      setError('En evento de nacimiento debe indicar la madre.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const nuevoEvento: EventoAnimal = {
        animal_id: animalId,
        tipo_evento: form.tipo_evento,
        fecha_evento: form.fecha_evento,
        usuario_id: user.id,
        observaciones: form.observaciones.trim() || undefined,
        motivo_id: form.motivo_id || undefined,
        madre_id: form.tipo_evento === 'NACIMIENTO' ? form.madre_id : undefined,
        cria_id: form.cria_id?.trim() || undefined,
      }
      const eventosExistentes = await eventoRepository.getByAnimalId(animalId, user.id, 'asc')
      const validacion = await eventoTemporalValidator.validarAntesDeRegistrar(nuevoEvento, eventosExistentes)
      if (!validacion.valido) {
        throw new Error(validacion.error)
      }
      await eventoRepository.create(nuevoEvento)

      setSuccess('Evento registrado correctamente.')
      setForm({
        tipo_evento: '',
        fecha_evento: new Date().toISOString().split('T')[0],
        motivo_id: '',
        observaciones: '',
        madre_id: '',
        cria_id: '',
      })
      setShowForm(false)
      await loadEventos()
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar el evento')
    } finally {
      setSaving(false)
    }
  }

  const motivosDisponibles = form.tipo_evento ? (MOTIVOS_POR_TIPO[form.tipo_evento] || []) : []
  const hembras = animales.filter((a) => a.sexo === 'H')

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center"
        style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="text-white text-xl relative z-10">Cargando...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter"
      style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10 animate-contentFadeIn">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/30">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/dashboard/gestion" inline />
          </div>

          <h1 className="text-2xl font-bold text-black mb-1">Historial de eventos</h1>
          {animal && (
            <p className="text-gray-700 mb-6">
              {animal.nombre || 'Sin nombre'} — {animal.numero_identificacion || animal.id}
            </p>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
              {success}
            </div>
          )}

          {/* Botón agregar evento */}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mb-6 bg-cownect-green text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-cownect-dark-green transition-all"
            >
              + Registrar evento
            </button>
          )}

          {/* Formulario nuevo evento */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-8 p-6 border-2 border-cownect-green/30 rounded-xl bg-gray-50/80"
            >
              <h2 className="text-lg font-bold text-black mb-4">Nuevo evento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de evento *</label>
                  <select
                    value={form.tipo_evento}
                    onChange={(e) => {
                      const v = e.target.value as TipoEvento | ''
                      setForm((f) => ({ ...f, tipo_evento: v, motivo_id: '' }))
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cownect-green"
                  >
                    <option value="">Seleccione...</option>
                    {TIPOS_EVENTO.map((t) => (
                      <option key={t} value={t}>
                        {ETIQUETAS_TIPO[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha del evento *</label>
                  <input
                    type="date"
                    value={form.fecha_evento}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_evento: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cownect-green"
                  />
                </div>
                {motivosDisponibles.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo</label>
                    <select
                      value={form.motivo_id}
                      onChange={(e) => setForm((f) => ({ ...f, motivo_id: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cownect-green"
                    >
                      <option value="">— Opcional —</option>
                      {motivosDisponibles.map((m) => (
                        <option key={m} value={m}>
                          {ETIQUETAS_MOTIVO[m] ?? m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {form.tipo_evento === 'NACIMIENTO' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Madre (obligatorio en nacimiento)</label>
                    <select
                      value={form.madre_id}
                      onChange={(e) => setForm((f) => ({ ...f, madre_id: e.target.value }))}
                      required={form.tipo_evento === 'NACIMIENTO'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cownect-green"
                    >
                      <option value="">Seleccione la madre...</option>
                      {hembras.filter((a) => a.id !== animalId).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre || a.numero_identificacion || a.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cownect-green"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-cownect-green text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-cownect-dark-green disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Registrar evento'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                  }}
                  className="bg-gray-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Timeline de eventos */}
          <h2 className="text-lg font-bold text-black mb-3">Línea de tiempo</h2>
          {eventos.length === 0 ? (
            <p className="text-gray-600">Aún no hay eventos registrados para este animal.</p>
          ) : (
            <ul className="space-y-0">
              {eventos.map((ev, i) => (
                <li key={ev.id || i} className="flex gap-4 py-3 border-b border-gray-200 last:border-0">
                  <div className="flex-shrink-0 w-24 text-sm text-gray-600">
                    {formatFecha(ev.fecha_evento)}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-black">
                      {ETIQUETAS_TIPO[ev.tipo_evento] ?? ev.tipo_evento}
                    </span>
                    {ev.motivo_id && (
                      <span className="ml-2 text-gray-600">
                        ({ETIQUETAS_MOTIVO[ev.motivo_id] ?? ev.motivo_id})
                      </span>
                    )}
                    {ev.observaciones && (
                      <p className="text-sm text-gray-600 mt-0.5">{ev.observaciones}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
