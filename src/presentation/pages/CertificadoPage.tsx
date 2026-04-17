'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import Sidebar from '../components/layouts/Sidebar'

interface CertificadoResult {
  elegible: boolean
  puntuacion: number
  criterios: {
    nombre: string
    cumplido: boolean
    descripcion: string
  }[]
  recomendaciones: string[]
}

interface LoteRow {
  id: string
  nombre: string
  animal_ids?: string[]
  usuario_id?: string
  certificate_id_onchain?: string
  tx_hash?: string | null
  metadata_uri?: string | null
  created_at?: string
}

function CertificadoContent() {
  const { user } = useAuth(false)
  const puedeGestionarLotes = !user?.es_sesion_trabajador

  const [certificado, setCertificado] = useState<CertificadoResult | null>(null)
  const [selectedRanchoId, setSelectedRanchoId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [animales, setAnimales] = useState<Animal[]>([])
  const [lotes, setLotes] = useState<LoteRow[]>([])
  const [loadingAnimales, setLoadingAnimales] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [newLoteNombre, setNewLoteNombre] = useState('')
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<Set<string>>(new Set())
  const [creatingLote, setCreatingLote] = useState(false)
  const [emittingLoteId, setEmittingLoteId] = useState<string | null>(null)
  const [loteMsg, setLoteMsg] = useState('')

  useEffect(() => {
    if (user?.rancho_actual_id) {
      setSelectedRanchoId(user.rancho_actual_id)
    }
  }, [user?.rancho_actual_id])

  const loadAnimales = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoadingAnimales(true)
      const list = await firestoreService.getAnimalesByUser(user.id)
      const activos = (list as Animal[]).filter((a) => a.activo !== false && a.id)
      setAnimales(activos)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAnimales(false)
    }
  }, [user?.id])

  const loadLotes = useCallback(async () => {
    if (!user?.id || !puedeGestionarLotes) return
    try {
      setLoadingLotes(true)
      const res = await fetchWithAuth('/api/lotes-certificado')
      if (res.ok) {
        const data = await res.json()
        setLotes(data.lotes || [])
      } else {
        setLotes([])
      }
    } catch (e) {
      console.error(e)
      setLotes([])
    } finally {
      setLoadingLotes(false)
    }
  }, [user?.id, puedeGestionarLotes])

  useEffect(() => {
    loadAnimales()
    loadLotes()
  }, [loadAnimales, loadLotes])

  const handleVerificar = async () => {
    if (!user?.id || !selectedRanchoId) return

    setVerifying(true)
    setError('')
    setSuccess('')
    setCertificado(null)

    try {
      const response = await fetchWithAuth('/api/certificado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rancho_id: selectedRanchoId,
          usuario_id: user.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCertificado(data.certificado)
        setSuccess('Verificación completada exitosamente')
      } else if (response.status === 403) {
        const errorData = await response.json()
        setError(errorData.error || 'Acceso denegado')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al verificar certificado')
      }
    } catch (err) {
      console.error('Error verificando certificado:', err)
      setError('Error al verificar certificado')
    } finally {
      setVerifying(false)
    }
  }

  const toggleAnimal = (id: string) => {
    setSelectedAnimalIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const crearLote = async () => {
    if (!user?.id || !newLoteNombre.trim() || selectedAnimalIds.size === 0) {
      setLoteMsg('Nombre y al menos un animal son obligatorios.')
      return
    }
    setCreatingLote(true)
    setLoteMsg('')
    try {
      const res = await fetchWithAuth('/api/lotes-certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newLoteNombre.trim(),
          rancho_id: selectedRanchoId || null,
          animal_ids: Array.from(selectedAnimalIds),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLoteMsg(data.error || 'No se pudo crear el lote')
        return
      }
      setNewLoteNombre('')
      setSelectedAnimalIds(new Set())
      setLoteMsg('Lote creado. Cuando todos los animales estén validados por admin, puedes emitir el certificado on-chain al lote.')
      await loadLotes()
    } catch {
      setLoteMsg('Error de red al crear el lote')
    } finally {
      setCreatingLote(false)
    }
  }

  const emitirCertificadoLote = async (loteId: string) => {
    if (!user?.id) return
    setEmittingLoteId(loteId)
    setLoteMsg('')
    try {
      const res = await fetchWithAuth('/api/lote-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          loteId,
          auto: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLoteMsg(data.error || 'No se pudo emitir el certificado')
        return
      }
      setLoteMsg(
        data.qrUrl
          ? `Certificado emitido. Ver transacción: ${data.qrUrl}`
          : 'Certificado registrado correctamente.'
      )
      await loadLotes()
    } catch {
      setLoteMsg('Error de red al emitir certificado')
    } finally {
      setEmittingLoteId(null)
    }
  }

  const loteTieneCertificado = (l: LoteRow) => !!(l.tx_hash || l.certificate_id_onchain)

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar className="hidden md:flex w-64 shrink-0 border-r border-gray-200" />
        <div className="flex-1 min-w-0 flex flex-col">
          <DashboardHeader />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="mb-6">
              <BackButton />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Certificado Cownect</h1>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  El certificado on-chain se emite por <strong>lote</strong>: agrupa animales validados por
                  administración y registra un único certificado en blockchain para todo el lote (ID off-chain{' '}
                  <code className="text-xs bg-gray-100 px-1 rounded">lote:&#123;id&#125;</code>).
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {puedeGestionarLotes && (
                <section className="mb-10 border-b border-gray-200 pb-10">
                  <h2 className="text-xl font-bold text-cownect-dark-green mb-2">Lotes para certificado</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Crea un lote eligiendo animales de tu inventario. Cada animal debe tener validación de admin (
                    <span className="font-medium">revisado_para_venta</span>) antes de poder emitir el certificado al
                    lote.
                  </p>

                  {loteMsg && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                      {loteMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Nuevo lote</h3>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lote</label>
                      <input
                        type="text"
                        value={newLoteNombre}
                        onChange={(e) => setNewLoteNombre(e.target.value)}
                        placeholder="Ej. Lote exportación enero 2026"
                        className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cownect-green"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rancho (opcional)</label>
                      <select
                        value={selectedRanchoId}
                        onChange={(e) => setSelectedRanchoId(e.target.value)}
                        className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cownect-green"
                      >
                        <option value="">Sin rancho específico</option>
                        {user?.rancho_actual_id && (
                          <option value={user.rancho_actual_id}>Rancho actual</option>
                        )}
                      </select>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Animales activos ({loadingAnimales ? '…' : animales.length})
                      </p>
                      <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {animales.map((a) => {
                          const id = a.id as string
                          return (
                            <label
                              key={id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAnimalIds.has(id)}
                                onChange={() => toggleAnimal(id)}
                              />
                              <span className="font-mono text-xs text-gray-500">{a.numero_identificacion || id}</span>
                              <span className="text-gray-800 truncate">{a.nombre || 'Sin nombre'}</span>
                              {a.revisado_para_venta ? (
                                <span className="ml-auto text-[10px] uppercase font-bold text-green-700">OK admin</span>
                              ) : (
                                <span className="ml-auto text-[10px] uppercase font-bold text-amber-700">Pendiente</span>
                              )}
                            </label>
                          )
                        })}
                        {!loadingAnimales && animales.length === 0 && (
                          <p className="p-4 text-sm text-gray-500">No hay animales activos.</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={crearLote}
                        disabled={creatingLote}
                        className="mt-4 w-full bg-cownect-green text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {creatingLote ? 'Guardando…' : 'Crear lote'}
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Mis lotes</h3>
                      {loadingLotes ? (
                        <p className="text-gray-500 text-sm">Cargando lotes…</p>
                      ) : lotes.length === 0 ? (
                        <p className="text-gray-500 text-sm">Aún no tienes lotes. Crea uno a la izquierda.</p>
                      ) : (
                        <ul className="space-y-3">
                          {lotes.map((l) => {
                            const n = l.animal_ids?.length ?? 0
                            const certOk = loteTieneCertificado(l)
                            return (
                              <li
                                key={l.id}
                                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                              >
                                <div>
                                  <p className="font-bold text-gray-900">{l.nombre}</p>
                                  <p className="text-xs text-gray-500">
                                    {n} animal(es) · ID {l.id}
                                  </p>
                                  {certOk && l.tx_hash && (
                                    <a
                                      href={`https://amoy.polygonscan.com/tx/${l.tx_hash}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-cownect-green font-semibold underline mt-1 inline-block"
                                    >
                                      Ver en Polygonscan
                                    </a>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={certOk || n === 0 || emittingLoteId === l.id}
                                  onClick={() => emitirCertificadoLote(l.id)}
                                  className="shrink-0 bg-cownect-dark-green text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {certOk
                                    ? 'Certificado emitido'
                                    : emittingLoteId === l.id
                                      ? 'Emitiendo…'
                                      : 'Emitir certificado on-chain (lote)'}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Elegibilidad del rancho (umbral hembras)</h2>
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar rancho</label>
                      <select
                        value={selectedRanchoId}
                        onChange={(e) => setSelectedRanchoId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cownect-green"
                      >
                        <option value="">Seleccionar rancho…</option>
                        {user?.rancho_actual_id && (
                          <option value={user.rancho_actual_id}>Rancho actual</option>
                        )}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerificar}
                      disabled={verifying || !selectedRanchoId}
                      className="bg-cownect-dark-green text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {verifying ? 'Verificando…' : 'Verificar elegibilidad'}
                    </button>
                  </div>
                </div>

                {certificado && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                          certificado.elegible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {certificado.elegible ? '¡Elegible para certificación Cownect!' : 'No elegible'}
                      </div>
                      <p className="mt-2 text-gray-600">Puntuación: {certificado.puntuacion}/100</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Criterios</h3>
                        <div className="space-y-3">
                          {certificado.criterios.map((criterio, index) => (
                            <div key={index} className="flex items-start">
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                                  criterio.cumplido ? 'bg-green-100' : 'bg-red-100'
                                }`}
                              >
                                {criterio.cumplido ? '✓' : '×'}
                              </div>
                              <div className="ml-3">
                                <p
                                  className={`text-sm font-medium ${
                                    criterio.cumplido ? 'text-green-800' : 'text-red-800'
                                  }`}
                                >
                                  {criterio.nombre}
                                </p>
                                <p className="text-sm text-gray-600">{criterio.descripcion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Recomendaciones</h3>
                        {certificado.recomendaciones.length > 0 ? (
                          <ul className="space-y-2">
                            {certificado.recomendaciones.map((recomendacion, index) => (
                              <li key={index} className="text-sm text-gray-700">
                                {recomendacion}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">Sin recomendaciones pendientes.</p>
                        )}
                      </div>
                    </div>

                    {certificado.elegible && (
                      <div className="text-center text-sm text-gray-600">
                        La emisión on-chain se hace desde <strong>Lotes para certificado</strong> arriba.
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function CertificadoPage() {
  return <CertificadoContent />
}
