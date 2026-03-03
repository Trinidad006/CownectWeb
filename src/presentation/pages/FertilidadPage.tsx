'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import { Animal } from '@/domain/entities/Animal'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { FirebaseEventoAnimalRepository } from '@/infrastructure/repositories/FirebaseEventoAnimalRepository'
import { EventoTemporalValidator } from '@/domain/validators/EventoTemporalValidator'
import { RegistrarServicioUseCase } from '@/domain/use-cases/reproduccion/RegistrarServicioUseCase'
import { VerificarEstadoReproductivoUseCase } from '@/domain/use-cases/reproduccion/VerificarEstadoReproductivoUseCase'
import { crearExamenOvarico } from '@/domain/value-objects/ExamenOvarico'
import type { VerificarEstadoReproductivoOutput } from '@/domain/use-cases/reproduccion/VerificarEstadoReproductivoUseCase'

const animalRepository = new FirebaseAnimalRepository()
const eventoRepository = new FirebaseEventoAnimalRepository()
const eventoTemporalValidator = new EventoTemporalValidator(eventoRepository)
const registrarServicioUseCase = new RegistrarServicioUseCase(
  animalRepository,
  eventoRepository,
  eventoTemporalValidator
)
const verificarEstadoUseCase = new VerificarEstadoReproductivoUseCase(eventoRepository, animalRepository)

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

const FOLICULOS_MIN = 0
const FOLICULOS_MAX = 50

export default function FertilidadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const animalId = searchParams.get('id')

  const [animal, setAnimal] = useState<Animal | null>(null)
  const [estadoReproductivo, setEstadoReproductivo] = useState<VerificarEstadoReproductivoOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showCeloForm, setShowCeloForm] = useState(false)
  const [showServicioForm, setShowServicioForm] = useState(false)

  const [celoForm, setCeloForm] = useState({
    fecha_evento: new Date().toISOString().split('T')[0],
    signos_celo: '',
    conteo_folicular: 0,
    cuerpo_luteo_presente: false,
    metodo: 'palpacion' as 'palpacion' | 'ultrasonido',
    motivo_id: 'DETECTADO',
  })

  const [servicioForm, setServicioForm] = useState({
    fecha_evento: new Date().toISOString().split('T')[0],
    tipo_servicio: 'INSEMINACION' as 'INSEMINACION' | 'MONTA_NATURAL',
    toro_id: '',
    pajilla_id: '',
    observaciones: '',
  })

  const loadData = useCallback(async () => {
    if (!animalId || !user?.id) return
    try {
      setError(null)
      const a = await animalRepository.getById(animalId, user.id)
      if (!a) {
        setError('Animal no encontrado')
        setAnimal(null)
        setEstadoReproductivo(null)
        return
      }
      if (a.sexo !== 'H') {
        setError('La gestión de fertilidad solo aplica a hembras.')
        setAnimal(null)
        setEstadoReproductivo(null)
        return
      }
      setAnimal(a)
      const estado = await verificarEstadoUseCase.ejecutar(animalId, user.id)
      setEstadoReproductivo(estado)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
      setAnimal(null)
      setEstadoReproductivo(null)
    } finally {
      setLoading(false)
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
    setLoading(true)
    loadData()
  }, [user, authLoading, animalId, router, loadData])

  const handleRegistrarCelo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !animalId) return
    setError(null)
    setSaving(true)
    try {
      const examen = crearExamenOvarico(
        celoForm.conteo_folicular,
        celoForm.cuerpo_luteo_presente,
        celoForm.metodo
      )
      await registrarServicioUseCase.ejecutarCelo({
        animal_id: animalId,
        usuario_id: user.id,
        fecha_evento: celoForm.fecha_evento,
        signos_celo: celoForm.signos_celo.trim() || undefined,
        examen_ovarico: examen,
        motivo_id: celoForm.motivo_id,
      })
      setSuccess('Celo registrado correctamente.')
      setShowCeloForm(false)
      setCeloForm({
        fecha_evento: new Date().toISOString().split('T')[0],
        signos_celo: '',
        conteo_folicular: 0,
        cuerpo_luteo_presente: false,
        metodo: 'palpacion',
        motivo_id: 'DETECTADO',
      })
      await loadData()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar celo')
    } finally {
      setSaving(false)
    }
  }

  const handleRegistrarServicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !animalId) return
    setError(null)
    setSaving(true)
    try {
      await registrarServicioUseCase.ejecutarServicio({
        animal_id: animalId,
        usuario_id: user.id,
        fecha_evento: servicioForm.fecha_evento,
        tipo_servicio: servicioForm.tipo_servicio,
        toro_id: servicioForm.toro_id.trim() || undefined,
        pajilla_id: servicioForm.pajilla_id.trim() || undefined,
        observaciones: servicioForm.observaciones.trim() || undefined,
      })
      setSuccess('Servicio registrado correctamente.')
      setShowServicioForm(false)
      setServicioForm({
        fecha_evento: new Date().toISOString().split('T')[0],
        tipo_servicio: 'INSEMINACION',
        toro_id: '',
        pajilla_id: '',
        observaciones: '',
      })
      await loadData()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar servicio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0]" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black/40" />
        <DashboardHeader />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <p className="text-white text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!animal || error) {
    return (
      <div className="min-h-screen bg-[#f5f5f0]" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black/40" />
        <DashboardHeader />
        <div className="relative z-10 container mx-auto px-4 py-6">
          <BackButton href="/dashboard/gestion" inline />
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-4">
            <p className="text-red-800 font-medium">{error || 'Animal no encontrado'}</p>
            <button
              onClick={() => router.push('/dashboard/gestion')}
              className="mt-4 bg-cownect-dark-green text-white px-6 py-2 rounded-lg font-bold"
            >
              Volver a Gestión
            </button>
          </div>
        </div>
      </div>
    )
  }

  const estado = estadoReproductivo?.estado

  return (
    <div className="min-h-screen bg-[#f5f5f0]" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black/40" />
      <DashboardHeader />
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        <BackButton href="/dashboard/gestion" inline />
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-2 mb-1">
          Gestión de Fertilidad
        </h1>
        <p className="text-white/90 text-lg mb-6">
          {animal.nombre || 'Sin nombre'} — {animal.numero_identificacion || animal.id}
        </p>

        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl p-4 mb-4 font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded-xl p-4 mb-4 font-medium">
            {error}
          </div>
        )}

        {/* Estado reproductivo: FPP, días abiertos, alerta re-celo */}
        {estado && (
          <section className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Estado reproductivo</h2>
            <div className="space-y-3 text-gray-700">
              {estado.fechaProbableParto && (
                <p><strong>Fecha probable de parto (FPP):</strong> {formatFecha(estado.fechaProbableParto)}</p>
              )}
              {estado.diasAbiertos != null && (
                <p><strong>Días abiertos:</strong> {estado.diasAbiertos} días</p>
              )}
              {estado.ultimoServicio && (
                <p><strong>Último servicio:</strong> {formatFecha(estado.ultimoServicio)}</p>
              )}
              {estado.ultimoParto && (
                <p><strong>Último parto:</strong> {formatFecha(estado.ultimoParto)}</p>
              )}
              {estado.ultimoDiagnostico && (
                <p><strong>Último diagnóstico:</strong> {estado.ultimoDiagnostico.resultado} ({formatFecha(estado.ultimoDiagnostico.fecha)})</p>
              )}
              {estado.alertaRecelo && estado.mensajeAlertaRecelo && (
                <div className="bg-amber-100 border border-amber-400 rounded-lg p-4 mt-2">
                  <p className="font-bold text-amber-900">Alerta re-celo</p>
                  <p className="text-amber-800 text-sm">{estado.mensajeAlertaRecelo}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Botón grande: Celo detectado (UX ISO 25010 - registro rápido en campo) */}
        <section className="mb-6">
          <button
            type="button"
            onClick={() => { setShowCeloForm(true); setShowServicioForm(false); setError(null); }}
            className="w-full py-6 px-6 bg-cownect-green hover:bg-cownect-dark-green text-white rounded-2xl text-xl font-bold shadow-lg transition-all border-2 border-white/20"
          >
            Celo detectado
          </button>
        </section>

        {showCeloForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar celo (estro)</h3>
            <form onSubmit={handleRegistrarCelo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={celoForm.fecha_evento}
                  onChange={(e) => setCeloForm((f) => ({ ...f, fecha_evento: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Signos observados (opcional)</label>
                <input
                  type="text"
                  value={celoForm.signos_celo}
                  onChange={(e) => setCeloForm((f) => ({ ...f, signos_celo: e.target.value }))}
                  placeholder="Ej. mucus, monta, etc."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Conteo folicular (0–50)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min={FOLICULOS_MIN}
                    max={FOLICULOS_MAX}
                    value={celoForm.conteo_folicular}
                    onChange={(e) =>
                      setCeloForm((f) => ({
                        ...f,
                        conteo_folicular: Math.min(FOLICULOS_MAX, Math.max(FOLICULOS_MIN, parseInt(e.target.value, 10) || 0)),
                      }))
                    }
                    className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-bold"
                  />
                  <span className="text-gray-600">folículos</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cuerpo lúteo presente</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={celoForm.cuerpo_luteo_presente === true}
                      onChange={() => setCeloForm((f) => ({ ...f, cuerpo_luteo_presente: true }))}
                      className="w-5 h-5"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={celoForm.cuerpo_luteo_presente === false}
                      onChange={() => setCeloForm((f) => ({ ...f, cuerpo_luteo_presente: false }))}
                      className="w-5 h-5"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Método</label>
                <select
                  value={celoForm.metodo}
                  onChange={(e) => setCeloForm((f) => ({ ...f, metodo: e.target.value as 'palpacion' | 'ultrasonido' }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                >
                  <option value="palpacion">Palpación</option>
                  <option value="ultrasonido">Ultrasonido</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-cownect-dark-green text-white py-3 rounded-xl font-bold text-lg disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar celo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCeloForm(false)}
                  className="px-6 py-3 border-2 border-gray-400 rounded-xl font-bold text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Botón: Registrar servicio (IA / Monta natural) */}
        <section className="mb-6">
          <button
            type="button"
            onClick={() => { setShowServicioForm(true); setShowCeloForm(false); setError(null); }}
            className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-lg font-bold shadow-lg transition-all border-2 border-white/20"
          >
            Registrar servicio (IA / Monta natural)
          </button>
        </section>

        {showServicioForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar servicio</h3>
            <form onSubmit={handleRegistrarServicio} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={servicioForm.fecha_evento}
                  onChange={(e) => setServicioForm((f) => ({ ...f, fecha_evento: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de servicio</label>
                <select
                  value={servicioForm.tipo_servicio}
                  onChange={(e) =>
                    setServicioForm((f) => ({ ...f, tipo_servicio: e.target.value as 'INSEMINACION' | 'MONTA_NATURAL' }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                >
                  <option value="INSEMINACION">Inseminación Artificial (IA)</option>
                  <option value="MONTA_NATURAL">Monta natural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {servicioForm.tipo_servicio === 'INSEMINACION' ? 'Código pajilla / ID toro' : 'ID del toro'}
                </label>
                <input
                  type="text"
                  value={servicioForm.toro_id}
                  onChange={(e) => setServicioForm((f) => ({ ...f, toro_id: e.target.value }))}
                  placeholder={servicioForm.tipo_servicio === 'INSEMINACION' ? 'Ej. Pajilla 123' : 'Ej. Toro ID'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              {servicioForm.tipo_servicio === 'INSEMINACION' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pajilla (opcional)</label>
                  <input
                    type="text"
                    value={servicioForm.pajilla_id}
                    onChange={(e) => setServicioForm((f) => ({ ...f, pajilla_id: e.target.value }))}
                    placeholder="Código de pajilla"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Observaciones (opcional)</label>
                <input
                  type="text"
                  value={servicioForm.observaciones}
                  onChange={(e) => setServicioForm((f) => ({ ...f, observaciones: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-700 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar servicio'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowServicioForm(false)}
                  className="px-6 py-3 border-2 border-gray-400 rounded-xl font-bold text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-white/80 text-sm mt-4">
          Diagnóstico de preñez, parto y aborto se registran en el{' '}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/eventos?id=${animalId}`)}
            className="underline font-semibold"
          >
            Historial de eventos
          </button>
          .
        </p>
      </div>
    </div>
  )
}
