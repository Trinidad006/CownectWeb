'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'

// Función para formatear fecha en formato humano
function formatFechaHumana(fecha: string): string {
  const fechaObj = new Date(fecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaComparar = new Date(fechaObj)
  fechaComparar.setHours(0, 0, 0, 0)
  
  const diffTime = hoy.getTime() - fechaComparar.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Hoy, ' + fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  } else if (diffDays === 1) {
    return 'Ayer, ' + fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días, ${fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
  } else {
    return fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }
}

// Función para calcular diferencia de peso
function calcularDiferencia(pesoActual: number, pesoAnterior: number | null): { diferencia: number; esAumento: boolean } | null {
  if (pesoAnterior === null) return null
  const diferencia = pesoActual - pesoAnterior
  return {
    diferencia: Math.abs(diferencia),
    esAumento: diferencia > 0
  }
}

function PesosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [pesos, setPesos] = useState<any[]>([])
  const [animales, setAnimales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [animalSeleccionado, setAnimalSeleccionado] = useState<any>(null)
  const [historialPesos, setHistorialPesos] = useState<any[]>([])
  const [filtroAnimal, setFiltroAnimal] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')
  const [formData, setFormData] = useState({
    animal_id: '',
    peso: '',
    fecha_registro: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  useEffect(() => {
    loadAnimales()
    loadPesos()
  }, [user?.id])

  const loadAnimales = async () => {
    if (!user?.id) return
    try {
      const data = await firestoreService.getAnimalesByUser(user.id)
      setAnimales(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadPesos = async () => {
    if (!user?.id) return
    try {
      const data = await firestoreService.getPesosByUser(user.id)
      // Ordenar por fecha descendente (más reciente primero)
      const sorted = data.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_registro).getTime()
        const fechaB = new Date(b.fecha_registro).getTime()
        return fechaB - fechaA
      })
      setPesos(sorted)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar pesos por animal y ordenar por fecha
  const pesosAgrupados = useMemo(() => {
    const agrupados: { [key: string]: any[] } = {}
    
    pesos.forEach((peso) => {
      const animalId = peso.animal_id || 'sin-animal'
      if (!agrupados[animalId]) {
        agrupados[animalId] = []
      }
      agrupados[animalId].push(peso)
    })
    
    // Ordenar cada grupo por fecha descendente
    Object.keys(agrupados).forEach((key) => {
      agrupados[key].sort((a, b) => {
        const fechaA = new Date(a.fecha_registro).getTime()
        const fechaB = new Date(b.fecha_registro).getTime()
        return fechaB - fechaA
      })
    })
    
    return agrupados
  }, [pesos])

  // Filtrar pesos según búsqueda y filtro de animal
  const pesosFiltrados = useMemo(() => {
    let filtrados = pesos

    // Filtro por animal
    if (filtroAnimal) {
      filtrados = filtrados.filter((peso) => peso.animal_id === filtroAnimal)
    }

    // Búsqueda por texto
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim()
      filtrados = filtrados.filter((peso) => {
        const animalNombre = (peso.animales?.nombre || peso.animales?.numero_identificacion || '').toLowerCase()
        const pesoStr = peso.peso?.toString().toLowerCase() || ''
        const fechaStr = formatFechaHumana(peso.fecha_registro).toLowerCase()
        const observaciones = (peso.observaciones || '').toLowerCase()
        
        return (
          animalNombre.includes(busquedaLower) ||
          pesoStr.includes(busquedaLower) ||
          fechaStr.includes(busquedaLower) ||
          observaciones.includes(busquedaLower)
        )
      })
    }

    return filtrados
  }, [pesos, filtroAnimal, busqueda])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    try {
      await firestoreService.addPeso({
        ...formData,
        peso: parseFloat(formData.peso),
        usuario_id: user.id,
      })
      setShowModal(false)
      setFormData({
        animal_id: '',
        peso: '',
        fecha_registro: new Date().toISOString().split('T')[0],
        observaciones: '',
      })
      loadPesos()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleOpenModal = () => {
    setFormData({
      animal_id: '',
      peso: '',
      fecha_registro: new Date().toISOString().split('T')[0],
      observaciones: '',
    })
    setShowModal(true)
  }

  const handleVerDetalle = async (peso: any) => {
    try {
      // Obtener información completa del animal
      const animal = animales.find((a: any) => a.id === peso.animal_id)
      if (animal) {
        setAnimalSeleccionado(animal)
      } else {
        // Si no está en la lista, obtenerlo de Firestore
        const db = getFirebaseDb()
        const { doc, getDoc } = await import('firebase/firestore')
        const animalSnap = await getDoc(doc(db, 'animales', peso.animal_id))
        if (animalSnap.exists()) {
          setAnimalSeleccionado({ id: animalSnap.id, ...animalSnap.data() })
        } else {
          alert('No se encontró información del animal')
          return
        }
      }

      // Obtener historial completo de pesos del animal
      const historial = pesos
        .filter((p: any) => p.animal_id === peso.animal_id)
        .sort((a: any, b: any) => {
          const fechaA = new Date(a.fecha_registro).getTime()
          const fechaB = new Date(b.fecha_registro).getTime()
          return fechaB - fechaA // Más reciente primero
        })
      
      setHistorialPesos(historial)
      setShowDetalleModal(true)
    } catch (error) {
      console.error('Error al cargar detalle:', error)
      alert('Error al cargar la información del animal')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="text-white text-xl relative z-10">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-contentFadeIn">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Control de Peso</h2>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Buscador */}
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Buscar Registros</label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre de animal, peso, fecha u observaciones..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green focus:ring-2 focus:ring-cownect-green focus:ring-opacity-20 transition-all bg-white text-black"
                  />
                </div>
                
                {/* Filtro por animal */}
                <div className="lg:w-72">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Filtrar por Animal</label>
                  <select
                    value={filtroAnimal}
                    onChange={(e) => setFiltroAnimal(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green focus:ring-2 focus:ring-cownect-green focus:ring-opacity-20 transition-all bg-white text-black cursor-pointer"
                  >
                    <option value="">Todos los animales</option>
                    {animales.map((animal: any) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.nombre || animal.numero_identificacion || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Mostrar resultados del filtro */}
              {(filtroAnimal || busqueda) && (
                <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                  <p className="text-base text-gray-600">
                    Mostrando <strong className="text-black">{pesosFiltrados.length}</strong> de <strong className="text-black">{pesos.length}</strong> registros
                  </p>
                  <button
                    onClick={() => {
                      setFiltroAnimal('')
                      setBusqueda('')
                    }}
                    className="text-cownect-green hover:text-cownect-dark-green font-semibold underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
            
            {/* Botón de registro */}
            <div>
              <button
                onClick={handleOpenModal}
                className="bg-cownect-green text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 hover:scale-105 transition-smooth shadow-md hover:shadow-lg"
              >
                Registrar Nuevo Peso
              </button>
            </div>
          </div>

          {/* Modal de Registro */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scaleIn" style={{ position: 'relative', zIndex: 10000 }}>
                <h3 className="text-xl font-bold text-black mb-4">Nuevo Registro de Peso</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Animal</label>
                    <select
                      value={formData.animal_id}
                      onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                      style={{ minHeight: '45px' }}
                      required
                    >
                      <option value="">Seleccione un animal</option>
                      {animales.map((animal: any) => (
                        <option key={animal.id} value={animal.id}>
                          {animal.nombre || animal.numero_identificacion || 'Sin nombre'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      className="w-full px-4 py-3 text-xl border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green font-bold text-center"
                      style={{ minHeight: '50px' }}
                      placeholder="Ej: 350.5"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Fecha de Registro</label>
                    <input
                      type="date"
                      value={formData.fecha_registro}
                      onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                      style={{ minHeight: '45px' }}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-600">No se pueden registrar fechas futuras</p>
                  </div>
                  
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Observaciones (opcional)</label>
                    <input
                      type="text"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-400 rounded-lg focus:outline-none focus:border-cownect-green"
                      style={{ minHeight: '45px' }}
                      placeholder="Ej: Buen estado, sobrepeso, etc."
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-opacity-90 transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Pesos */}
          <div className="space-y-4">
            {pesosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl text-gray-700">
                  {pesos.length === 0 
                    ? 'No hay registros de peso' 
                    : 'No se encontraron registros con los filtros aplicados'}
                </p>
                <p className="text-lg text-gray-500 mt-2">
                  {pesos.length === 0 
                    ? 'Comienza registrando el peso de tus animales' 
                    : 'Intenta cambiar los filtros de búsqueda'}
                </p>
              </div>
            ) : (
              pesosFiltrados.map((peso, index) => {
                // Verificar si es el más reciente de todos los pesos (no solo los filtrados)
                const esMasReciente = pesos.length > 0 && peso.id === pesos[0].id
                const animalNombre = peso.animales?.nombre || peso.animales?.numero_identificacion || 'Animal'
                
                // Buscar el peso anterior del mismo animal
                const pesosDelAnimal = pesosAgrupados[peso.animal_id] || []
                const indiceEnAnimal = pesosDelAnimal.findIndex((p: any) => p.id === peso.id)
                const pesoAnterior = indiceEnAnimal < pesosDelAnimal.length - 1 
                  ? pesosDelAnimal[indiceEnAnimal + 1] 
                  : null
                
                const diferencia = calcularDiferencia(
                  parseFloat(peso.peso),
                  pesoAnterior ? parseFloat(pesoAnterior.peso) : null
                )

                return (
                  <div
                    key={peso.id}
                    onClick={() => handleVerDetalle(peso)}
                    className={`bg-white rounded-lg p-6 border-l-4 transition-smooth hover:shadow-lg hover:scale-[1.01] cursor-pointer animate-fadeInUp ${
                      esMasReciente
                        ? 'border-l-cownect-green border-l-4 border-t border-r border-b border-gray-200 shadow-md'
                        : 'border-l-cownect-green border-l-4 border-t border-r border-b border-gray-200'
                    }`}
                    style={{ 
                      borderLeftWidth: '6px',
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-black">
                            {animalNombre}
                          </h3>
                          {esMasReciente && (
                            <span className="bg-cownect-green text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Más Reciente
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-baseline gap-4 mb-4">
                          <div>
                            <span className="text-base text-gray-600">Peso: </span>
                            <span className="text-2xl font-bold text-cownect-green">
                              {peso.peso} kg
                            </span>
                          </div>
                          
                          {diferencia && (
                            <span className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1 ${
                              diferencia.esAumento 
                                ? 'bg-green-50 text-green-700 border border-green-300' 
                                : 'bg-red-50 text-red-700 border border-red-300'
                            }`}>
                              <span>{diferencia.esAumento ? '↑' : '↓'}</span>
                              <span>{diferencia.esAumento ? '+' : '-'}{diferencia.diferencia.toFixed(1)} kg</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Fecha:</span> {formatFechaHumana(peso.fecha_registro)}
                          </p>
                          
                          {peso.observaciones && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Observaciones:</span> <span className="text-gray-800">{peso.observaciones}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle del Animal */}
      {showDetalleModal && animalSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-black">Información del Animal</h3>
              <button
                onClick={() => setShowDetalleModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Información del Animal */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h4 className="text-xl font-bold text-black mb-4">Datos del Animal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nombre</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.nombre || 'Sin nombre'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Número de Identificación</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.numero_identificacion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Especie</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.especie || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Raza</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.raza || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sexo</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <p className="text-lg font-semibold text-black">{animalSeleccionado.estado || 'N/A'}</p>
                </div>
                {animalSeleccionado.fecha_nacimiento && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Nacimiento</p>
                    <p className="text-lg font-semibold text-black">
                      {new Date(animalSeleccionado.fecha_nacimiento).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Pesos */}
            <div>
              <h4 className="text-xl font-bold text-black mb-4">Historial Completo de Pesos</h4>
              {historialPesos.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No hay registros de peso para este animal</p>
              ) : (
                <div className="space-y-3">
                  {historialPesos.map((pesoHistorial, index) => {
                    const pesoAnterior = index < historialPesos.length - 1 ? historialPesos[index + 1] : null
                    const diferencia = calcularDiferencia(
                      parseFloat(pesoHistorial.peso),
                      pesoAnterior ? parseFloat(pesoAnterior.peso) : null
                    )

                    return (
                      <div
                        key={pesoHistorial.id}
                        className="bg-white rounded-lg p-4 border-l-4 border-l-cownect-green border border-gray-200 hover:shadow-md hover:scale-[1.01] transition-smooth animate-fadeInUp"
                        style={{ 
                          borderLeftWidth: '4px',
                          animationDelay: `${index * 0.03}s`,
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-4 mb-2">
                              <div>
                                <span className="text-sm text-gray-600">Peso: </span>
                                <span className="text-xl font-bold text-cownect-green">
                                  {pesoHistorial.peso} kg
                                </span>
                              </div>
                              
                              {diferencia && (
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                                  diferencia.esAumento 
                                    ? 'bg-green-50 text-green-700 border border-green-300' 
                                    : 'bg-red-50 text-red-700 border border-red-300'
                                }`}>
                                  <span>{diferencia.esAumento ? '↑' : '↓'}</span>
                                  <span>{diferencia.esAumento ? '+' : '-'}{diferencia.diferencia.toFixed(1)} kg</span>
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Fecha:</span> {formatFechaHumana(pesoHistorial.fecha_registro)}
                            </p>
                            
                            {pesoHistorial.observaciones && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Observaciones:</span> <span className="text-gray-800">{pesoHistorial.observaciones}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetalleModal(false)}
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-500 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PesosPage() {
  return (
    <ProtectedRoute>
      <PesosContent />
    </ProtectedRoute>
  )
}
