'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'

function VacunacionesContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [vacunaciones, setVacunaciones] = useState<any[]>([])
  const [animales, setAnimales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAnimal, setFiltroAnimal] = useState('')
  const [formData, setFormData] = useState({
    animal_id: '',
    tipo_vacuna: '',
    fecha_aplicacion: '',
    proxima_dosis: '',
    observaciones: '',
  })

  useEffect(() => {
    loadAnimales()
    loadVacunaciones()
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

  const loadVacunaciones = async () => {
    if (!user?.id) return
    try {
      const data = await firestoreService.getVacunacionesByUser(user.id)
      setVacunaciones(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    try {
      await firestoreService.addVacunacion({
        ...formData,
        usuario_id: user.id,
      })
      setShowForm(false)
      setFormData({
        animal_id: '',
        tipo_vacuna: '',
        fecha_aplicacion: '',
        proxima_dosis: '',
        observaciones: '',
      })
      loadVacunaciones()
      setSuccessMessage('Vacunación registrada exitosamente')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    }
  }

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Filtrar vacunaciones según búsqueda y filtro
  const vacunacionesFiltradas = useMemo(() => {
    let filtradas = vacunaciones

    // Filtro por animal
    if (filtroAnimal) {
      filtradas = filtradas.filter((vac) => vac.animal_id === filtroAnimal)
    }

    // Búsqueda por texto
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim()
      filtradas = filtradas.filter((vac) => {
        const nombreAnimal = (vac.animales?.nombre || vac.animales?.numero_identificacion || '').toLowerCase()
        const tipoVacuna = (vac.tipo_vacuna || '').toLowerCase()
        const fechaAplicacion = (vac.fecha_aplicacion || '').toLowerCase()
        const proximaDosis = (vac.proxima_dosis || '').toLowerCase()
        const observaciones = (vac.observaciones || '').toLowerCase()

        return (
          nombreAnimal.includes(busquedaLower) ||
          tipoVacuna.includes(busquedaLower) ||
          fechaAplicacion.includes(busquedaLower) ||
          proximaDosis.includes(busquedaLower) ||
          observaciones.includes(busquedaLower)
        )
      })
    }

    return filtradas
  }, [vacunaciones, busqueda, filtroAnimal])

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
        <div className="bg-white rounded-lg shadow-2xl p-8 relative">
          <div className="mb-6">
            <BackButton href="/dashboard" />
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Gestión de Vacunaciones</h2>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Buscador */}
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Buscar Vacunaciones</label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre de animal, tipo de vacuna, fecha u observaciones..."
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
                    Mostrando <strong className="text-black">{vacunacionesFiltradas.length}</strong> de <strong className="text-black">{vacunaciones.length}</strong> vacunaciones
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
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              {showForm ? 'Cancelar' : '+ Registrar Vacunación'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-4">Nueva Vacunación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Animal</label>
                  <select
                    value={formData.animal_id}
                    onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
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
                  <label className="block text-base font-bold text-black mb-2">Tipo de Vacuna</label>
                  <input
                    type="text"
                    value={formData.tipo_vacuna}
                    onChange={(e) => setFormData({ ...formData, tipo_vacuna: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Aplicación</label>
                  <input
                    type="date"
                    value={formData.fecha_aplicacion}
                    onChange={(e) => setFormData({ ...formData, fecha_aplicacion: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-600">No se pueden registrar fechas futuras</p>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Próxima Dosis</label>
                  <input
                    type="date"
                    value={formData.proxima_dosis}
                    onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
                    min={formData.fecha_aplicacion || new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
                  <p className="mt-1 text-sm text-gray-600">Debe ser posterior a la fecha de aplicación</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-base font-bold text-black mb-2">Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    rows={3}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-black text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all"
              >
                Guardar
              </button>
            </form>
          )}

          <div className="space-y-4">
            {vacunacionesFiltradas.map((vac) => (
              <div key={vac.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  {vac.animales?.nombre || vac.animales?.numero_identificacion || 'Animal'}
                </h3>
                <p className="text-gray-700 mb-1"><strong>Tipo:</strong> {vac.tipo_vacuna}</p>
                <p className="text-gray-700 mb-1"><strong>Fecha Aplicación:</strong> {vac.fecha_aplicacion}</p>
                {vac.proxima_dosis && (
                  <p className="text-gray-700 mb-1"><strong>Próxima Dosis:</strong> {vac.proxima_dosis}</p>
                )}
                {vac.observaciones && (
                  <p className="text-gray-700"><strong>Observaciones:</strong> {vac.observaciones}</p>
                )}
              </div>
            ))}
          </div>

          {vacunaciones.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No hay vacunaciones registradas</p>
            </div>
          )}

          {vacunaciones.length > 0 && vacunacionesFiltradas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No se encontraron vacunaciones con los filtros aplicados</p>
            </div>
          )}

          {/* Modales de éxito y error */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                <div className="text-center">
                  <div className="text-green-500 text-5xl mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-black mb-4">Éxito</h3>
                  <p className="text-gray-700 mb-6">{successMessage}</p>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showErrorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                <div className="text-center">
                  <div className="text-red-500 text-5xl mb-4">✗</div>
                  <h3 className="text-2xl font-bold text-black mb-4">Error</h3>
                  <p className="text-gray-700 mb-6">{errorMessage}</p>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VacunacionesPage() {
  return (
    <ProtectedRoute>
      <VacunacionesContent />
    </ProtectedRoute>
  )
}
