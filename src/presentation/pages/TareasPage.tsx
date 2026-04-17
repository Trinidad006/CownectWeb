'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { fetchWithAuth } from '../utils/fetchWithAuth'

interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  asignado_a?: string
  fecha_vencimiento?: string
  completada?: boolean
  fecha_creacion: string
  estado?: string
}

interface Empleado {
  id: string
  nombre: string
  apellido?: string
  cargo?: string
  aliases?: string[]
}

function TareasContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    asignado_a: '',
    fecha_vencimiento: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const findEmpleadoByAsignado = (asignadoId?: string) => {
    if (!asignadoId) return undefined
    return empleados.find(
      (e) => e.id === asignadoId || (Array.isArray(e.aliases) && e.aliases.includes(asignadoId))
    )
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [resEmpleados, resTareas] = await Promise.all([
        fetchWithAuth(`/api/empleados?usuario_id=${user.id}`),
        fetchWithAuth(`/api/tareas?usuario_id=${user.id}`)
      ])
      
      if (resEmpleados.ok) {
        const data = await resEmpleados.json()
        setEmpleados(data as Empleado[])
      }

      if (resTareas.ok) {
        const data = await resTareas.json()
        setTareas(data as Tarea[])
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetchWithAuth('/api/tareas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: user.id,
          rancho_id: user.rancho_actual_id || 'default',
          titulo: formData.titulo,
          descripcion: formData.descripcion || undefined,
          asignado_a: formData.asignado_a || undefined,
          fecha_vencimiento: formData.fecha_vencimiento || undefined
        })
      })

      if (response.ok) {
        setSuccess('Tarea creada exitosamente')
        setFormData({
          titulo: '',
          descripcion: '',
          asignado_a: '',
          fecha_vencimiento: ''
        })
        setShowForm(false)
        loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al crear tarea')
      }
    } catch (err) {
      console.error('Error creando tarea:', err)
      setError('Error al crear tarea')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
          <div className="flex-1 relative z-10">
            <DashboardHeader />
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-white">Cargando tareas...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        {/* Velo oscuro global */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Sidebar */}
        <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
        
        <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
          <DashboardHeader />
          
          <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <BackButton href="/dashboard" inline />
              </div>

              <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-cownect-green/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sistema de Tareas</h1>
                    <p className="text-gray-600 mt-1">Gestión de trabajos y recordatorios para tu equipo</p>
                  </div>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-cownect-green text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg"
                  >
                    {showForm ? 'Cancelar' : 'Nueva Tarea'}
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-fadeIn">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-cownect-green animate-fadeIn">
                    {success}
                  </div>
                )}

                {showForm && (
                  <form onSubmit={handleSubmit} className="mb-8 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-cownect-green/20 animate-scaleIn">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Configurar Nueva Tarea</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Título de la Tarea *
                        </label>
                        <input
                          type="text"
                          name="titulo"
                          value={formData.titulo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cownect-green focus:border-transparent outline-none"
                          placeholder="Ej: Vacunar ganado contra aftosa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Asignar a un Empleado
                        </label>
                        <select
                          name="asignado_a"
                          value={formData.asignado_a}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none bg-white"
                        >
                          <option value="">-- Seleccionar Empleado --</option>
                          {empleados.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nombre} {emp.apellido || ''} {emp.cargo ? `(${emp.cargo})` : ''}
                            </option>
                          ))}
                          {empleados.length === 0 && (
                            <option value="" disabled>No hay empleados registrados</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          name="fecha_vencimiento"
                          value={formData.fecha_vencimiento}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Descripción Detallada
                        </label>
                        <textarea
                          name="descripcion"
                          value={formData.descripcion}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                          placeholder="Instrucciones adicionales..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-cownect-green text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg"
                      >
                        {submitting ? 'Creando...' : 'Confirmar y Enviar Tarea'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                      >
                        Descartar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-cownect-green/10 pb-2">Panel de Labores</h2>

                  {tareas.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 mt-6">
                      {tareas.map(tarea => {
                        const resp = findEmpleadoByAsignado(tarea.asignado_a)
                        return (
                          <div key={tarea.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-l-4 border-l-cownect-green">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{tarea.titulo}</h3>
                                <p className="text-gray-600 text-sm mt-1">{tarea.descripcion || 'Sin descripción'}</p>
                                <div className="flex gap-4 mt-4">
                                  <span className="text-xs font-bold text-cownect-dark-green bg-cownect-green/10 px-3 py-1 rounded-full">
                                    👤 {resp ? `${resp.nombre} ${resp.apellido || ''}` : 'Sin asignar'}
                                  </span>
                                  {tarea.fecha_vencimiento && (
                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                                      📅 {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${tarea.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {tarea.estado || 'PENDIENTE'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-300 mb-4">
                        <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas programadas</h3>
                      <button
                        onClick={() => setShowForm(true)}
                        className="bg-cownect-green text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-opacity-90"
                      >
                        Crear Primera Tarea
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function TareasPage() {
  return <TareasContent />
}
