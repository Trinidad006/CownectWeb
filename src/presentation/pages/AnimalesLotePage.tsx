'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'

const animalRepository = new FirebaseAnimalRepository()
type LoteRow = {
  numero_identificacion: string
  especie: string
  raza: string
  sexo: 'M' | 'H'
  estado: string
}
type MissingField = 'numero_identificacion' | 'especie' | 'raza' | 'sexo' | 'estado'

function AnimalesLoteContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [errorRowIndex, setErrorRowIndex] = useState<number | null>(null)
  const [errorField, setErrorField] = useState<MissingField | null>(null)
  const [rows, setRows] = useState<LoteRow[]>([
    { numero_identificacion: '', especie: 'Bovino', raza: '', sexo: 'M', estado: '' },
    { numero_identificacion: '', especie: 'Bovino', raza: '', sexo: 'M', estado: '' },
    { numero_identificacion: '', especie: 'Bovino', raza: '', sexo: 'M', estado: '' },
  ])

  useEffect(() => {
    if (user?.id) loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    try {
      setLoading(true)
      const list = await firestoreService.getAnimalesByUser(user!.id)
      setAnimales(list as Animal[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const agregarFilas = (cantidad: number) => {
    const nuevas = Array.from({ length: cantidad }, () => ({
      numero_identificacion: '',
      especie: 'Bovino',
      raza: '',
      sexo: 'M' as 'M' | 'H',
      estado: '',
    }))
    setRows((prev) => [...prev, ...nuevas])
  }

  const actualizarFila = (index: number, patch: Partial<LoteRow>) => {
    if (errorRowIndex === index) {
      setErrorRowIndex(null)
      setErrorField(null)
    }
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const eliminarFila = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const guardarPorLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setError('')
    setOk('')
    setErrorRowIndex(null)
    setErrorField(null)
    const filasValidas = rows
      .map((r) => ({
        numero_identificacion: (r.numero_identificacion || '').trim().toUpperCase(),
        especie: (r.especie || '').trim(),
        raza: (r.raza || '').trim(),
        sexo: r.sexo,
        estado: (r.estado || '').trim(),
      }))
      .filter((r) => r.numero_identificacion || r.especie || r.raza || r.estado)

    if (filasValidas.length === 0) {
      setError('Agrega al menos un animal con sus campos requeridos.')
      return
    }
    const campoLabel: Record<MissingField, string> = {
      numero_identificacion: 'Arete',
      especie: 'Especie',
      raza: 'Raza',
      sexo: 'Sexo',
      estado: 'Estado',
    }

    const firstMissing = filasValidas.findIndex(
      (r) => !r.numero_identificacion || !r.especie || !r.raza || !r.sexo || !r.estado
    )
    if (firstMissing >= 0) {
      const row = filasValidas[firstMissing]
      const field: MissingField =
        !row.numero_identificacion
          ? 'numero_identificacion'
          : !row.especie
            ? 'especie'
            : !row.raza
              ? 'raza'
              : !row.sexo
                ? 'sexo'
                : 'estado'
      setErrorRowIndex(firstMissing)
      setErrorField(field)
      setError(`Animal #${firstMissing + 1}: falta el campo "${campoLabel[field]}".`)
      return
    }

    const duplicateMap = new Map<string, number>()
    for (let i = 0; i < filasValidas.length; i++) {
      const arete = filasValidas[i].numero_identificacion
      if (duplicateMap.has(arete)) {
        const first = duplicateMap.get(arete)!
        setErrorRowIndex(i)
        setErrorField('numero_identificacion')
        setError(`Animal #${i + 1}: arete duplicado con Animal #${first + 1} (${arete}).`)
        return
      }
      duplicateMap.set(arete, i)
    }

    const isInvalidSex = filasValidas.findIndex((r) => r.sexo !== 'M' && r.sexo !== 'H')
    if (isInvalidSex >= 0) {
      setErrorRowIndex(isInvalidSex)
      setErrorField('sexo')
      setError(`Animal #${isInvalidSex + 1}: el campo "Sexo" debe ser M o H.`)
      return
    }
    const unicos = [...new Map(filasValidas.map((r) => [r.numero_identificacion, r])).values()]

    try {
      setGuardando(true)
      let creados = 0
      const chunkSize = 25
      for (let i = 0; i < unicos.length; i += chunkSize) {
        const chunk = unicos.slice(i, i + chunkSize)
        await Promise.all(
          chunk.map((item) =>
            animalRepository.create({
              usuario_id: user.id,
              rancho_id: user.rancho_actual_id || 'default',
              numero_identificacion: item.numero_identificacion,
              especie: item.especie,
              raza: item.raza,
              sexo: item.sexo,
              estado: item.estado,
              activo: true,
              origen: 'comprado',
            } as Animal)
          )
        )
        creados += chunk.length
      }
      setOk(`Migración completada: ${creados} animales registrados.`)
      setRows([{ numero_identificacion: '', especie: 'Bovino', raza: '', sexo: 'M', estado: '' }])
      await loadAnimales()
    } catch (e: any) {
      setError(e?.message || 'No se pudo completar la migración por lote.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando lotes...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard/gestion" inline />
            </div>

            <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-cownect-green/20">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestión por Lotes</h1>
                <p className="text-gray-600 mt-1">Migración masiva de inventario para registrar cientos de cabezas rápido.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                <p className="text-sm text-gray-700">
                  Captura por bloques en cuadros simples. Completa solo lo necesario por animal y agrega más filas con un clic.
                </p>
              </div>

              <form onSubmit={guardarPorLote}>
                <div className="flex flex-wrap gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => agregarFilas(1)}
                    className="px-4 py-2 bg-white border border-cownect-green text-cownect-green rounded-lg font-semibold"
                  >
                    + Agregar 1
                  </button>
                  <button
                    type="button"
                    onClick={() => agregarFilas(10)}
                    className="px-4 py-2 bg-white border border-cownect-green text-cownect-green rounded-lg font-semibold"
                  >
                    + Agregar 10
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRows([{ numero_identificacion: '', especie: 'Bovino', raza: '', sexo: 'M', estado: '' }])
                    }
                    className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg font-semibold"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 bg-gray-50 ${
                        errorRowIndex === idx ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-gray-700">Animal #{idx + 1}</p>
                        <button
                          type="button"
                          onClick={() => eliminarFila(idx)}
                          className="text-xs text-red-600 font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Arete *"
                          value={row.numero_identificacion}
                          onChange={(e) =>
                            actualizarFila(idx, { numero_identificacion: e.target.value.toUpperCase() })
                          }
                          className={`px-3 py-2 border rounded-lg bg-white ${
                            errorRowIndex === idx && errorField === 'numero_identificacion'
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Especie *"
                          value={row.especie}
                          onChange={(e) => actualizarFila(idx, { especie: e.target.value })}
                          className={`px-3 py-2 border rounded-lg bg-white ${
                            errorRowIndex === idx && errorField === 'especie'
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Raza *"
                          value={row.raza}
                          onChange={(e) => actualizarFila(idx, { raza: e.target.value })}
                          className={`px-3 py-2 border rounded-lg bg-white ${
                            errorRowIndex === idx && errorField === 'raza'
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                        <select
                          value={row.sexo}
                          onChange={(e) => actualizarFila(idx, { sexo: e.target.value as 'M' | 'H' })}
                          className={`px-3 py-2 border rounded-lg bg-white ${
                            errorRowIndex === idx && errorField === 'sexo'
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="M">Macho (M)</option>
                          <option value="H">Hembra (H)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Estado *"
                          value={row.estado}
                          onChange={(e) => actualizarFila(idx, { estado: e.target.value })}
                          className={`px-3 py-2 border rounded-lg bg-white md:col-span-2 ${
                            errorRowIndex === idx && errorField === 'estado'
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full py-3 bg-cownect-green text-white font-bold rounded-xl disabled:opacity-60"
                  >
                    {guardando ? 'Migrando...' : 'Registrar lote masivo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/gestion')}
                    className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl"
                  >
                    Volver a inventario
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {ok && (
                <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                  {ok}
                </div>
              )}

              <div className="mt-8 text-sm text-gray-600">
                Total actual en inventario: <span className="font-bold text-gray-900">{animales.length}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AnimalesLotePage() {
  return (
    <ProtectedRoute>
      <AnimalesLoteContent />
    </ProtectedRoute>
  )
}
