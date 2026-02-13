'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { getDriveImageUrl } from '@/utils/driveImage'
import { AnimalValidator } from '@/domain/validators/AnimalValidator'
import BackButton from '../components/ui/BackButton'

const animalRepository = new FirebaseAnimalRepository()

function AnimalesInactivosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAnimal, setFiltroAnimal] = useState('')
  const [showReactivarModal, setShowReactivarModal] = useState(false)
  const [animalToReactivar, setAnimalToReactivar] = useState<Animal | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const data = await animalRepository.getAll(user.id)
      // Filtrar solo animales inactivos (activo === false)
      const animalesInactivos = data.filter(animal => animal.activo === false)
      setAnimales(animalesInactivos)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar animales según búsqueda y filtro
  const animalesFiltrados = useMemo(() => {
    let filtrados = animales

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase()
      filtrados = filtrados.filter((animal) => {
        const nombre = (animal.nombre || '').toLowerCase()
        const numeroId = (animal.numero_identificacion || '').toLowerCase()
        const especie = (animal.especie || '').toLowerCase()
        const raza = (animal.raza || '').toLowerCase()
        const estado = (animal.estado || '').toLowerCase()
        const sexo = animal.sexo === 'M' ? 'macho' : 'hembra'
        
        return (
          nombre.includes(busquedaLower) ||
          numeroId.includes(busquedaLower) ||
          especie.includes(busquedaLower) ||
          raza.includes(busquedaLower) ||
          estado.includes(busquedaLower) ||
          sexo.includes(busquedaLower)
        )
      })
    }

    if (filtroAnimal) {
      filtrados = filtrados.filter((animal) => animal.id === filtroAnimal)
    }

    return filtrados
  }, [animales, busqueda, filtroAnimal])

  const handleReactivar = (animal: Animal) => {
    setAnimalToReactivar(animal)
    setShowReactivarModal(true)
  }

  const confirmarReactivar = async () => {
    if (!animalToReactivar?.id || !user?.id) return
    try {
      await animalRepository.update(animalToReactivar.id, {
        activo: true,
        razon_inactivo: undefined,
        fecha_inactivo: undefined,
        updated_at: new Date().toISOString(),
      })
      setShowReactivarModal(false)
      setAnimalToReactivar(null)
      loadAnimales()
      setSuccessMessage('Animal reactivado exitosamente')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const getEstadoInactivo = (animal: Animal): string => {
    if (animal.estado === 'Muerto') return 'Muerto'
    if (animal.estado === 'Robado') return 'Robado'
    return 'Eliminado'
  }

  const getColorEstado = (estado: string): string => {
    if (estado === 'Muerto') return 'bg-gray-600'
    if (estado === 'Robado') return 'bg-red-600'
    return 'bg-orange-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
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
        <div className="bg-white rounded-lg shadow-2xl p-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/dashboard/animales" inline />
          </div>
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Animales Inactivos</h2>
            <p className="text-gray-600 text-center max-w-2xl">
              Aquí se muestran los animales que han sido marcados como inactivos (muertos, robados o eliminados). 
              Puede reactivarlos para que vuelvan a aparecer en la lista principal.
            </p>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Buscador */}
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Buscar Animales</label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, ID, especie, raza, estado o sexo..."
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
                    {animales.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.nombre || animal.numero_identificacion || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de animales inactivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {animalesFiltrados.map((animal) => {
              const estadoInactivo = getEstadoInactivo(animal)
              return (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300 opacity-90">
                  {animal.foto ? (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-400">
                      <img 
                        src={getDriveImageUrl(animal.foto)} 
                        alt={animal.nombre || 'Animal'} 
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-400 bg-gray-200 h-40 flex items-center justify-center">
                      <p className="text-gray-500">Sin foto</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-black mb-1">
                      {animal.nombre || 'Sin nombre'}
                    </h3>
                    {animal.numero_identificacion && (
                      <p className="text-gray-600 text-sm">ID: {animal.numero_identificacion}</p>
                    )}
                  </div>

                  <div className="mb-3 space-y-1">
                    {animal.especie && (
                      <p className="text-gray-700"><strong>Especie:</strong> {animal.especie}</p>
                    )}
                    {animal.raza && (
                      <p className="text-gray-700"><strong>Raza:</strong> {animal.raza}</p>
                    )}
                    {animal.sexo && (
                      <p className="text-gray-700"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                    )}
                    {animal.estado && (
                      <p className="text-gray-700"><strong>Estado:</strong> {animal.estado}</p>
                    )}
                  </div>

                  {/* Estado inactivo */}
                  <div className={`mb-3 rounded-lg px-3 py-2 ${getColorEstado(estadoInactivo)} text-white`}>
                    <p className="font-semibold text-sm">
                      {estadoInactivo}
                    </p>
                  </div>

                  {/* Razón de inactivación */}
                  {animal.razon_inactivo && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2">
                      <p className="text-yellow-800 text-sm">
                        <strong>Razón:</strong> {animal.razon_inactivo}
                      </p>
                    </div>
                  )}

                  {/* Fecha de inactivación */}
                  {animal.fecha_inactivo && (
                    <div className="mb-3 text-gray-600 text-xs">
                      <p>Inactivado: {new Date(animal.fecha_inactivo).toLocaleDateString('es-ES')}</p>
                    </div>
                  )}

                  {/* Botón para reactivar */}
                  <button
                    onClick={() => handleReactivar(animal)}
                    className="w-full bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-cownect-dark-green transition-all"
                  >
                    Reactivar Animal
                  </button>
                </div>
              )
            })}
          </div>

          {animales.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No hay animales inactivos</p>
            </div>
          )}

          {animales.length > 0 && animalesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No se encontraron animales inactivos con los filtros aplicados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Reactivación */}
      {showReactivarModal && animalToReactivar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scaleIn relative">
            <div className="flex items-center gap-3 mb-4">
              <BackButton
                onClick={() => { 
                  setShowReactivarModal(false)
                  setAnimalToReactivar(null)
                }}
                inline
              />
              <h3 className="text-2xl font-bold text-black">Reactivar Animal</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Animal:</strong> {animalToReactivar.nombre || animalToReactivar.numero_identificacion || 'Animal'}
              </p>
              <p className="text-gray-800 font-semibold">
                ¿Está seguro de reactivar este animal? Volverá a aparecer en la lista principal de animales.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmarReactivar}
                className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-cownect-dark-green transition-all"
              >
                Reactivar
              </button>
              <button
                onClick={() => {
                  setShowReactivarModal(false)
                  setAnimalToReactivar(null)
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }} inline />
              <h3 className="text-xl font-bold text-cownect-green">Éxito</h3>
            </div>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }}
                className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-cownect-dark-green transition-all"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowErrorModal(false); setErrorMessage('') }} inline />
              <h3 className="text-xl font-bold text-red-600">Error</h3>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowErrorModal(false); setErrorMessage('') }}
                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
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

export default function AnimalesInactivosPage() {
  return (
    <ProtectedRoute>
      <AnimalesInactivosContent />
    </ProtectedRoute>
  )
}

