'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import Sidebar from '../components/layouts/Sidebar'
import { FirebaseTareaRepository } from '@/infrastructure/repositories/FirebaseTareaRepository'
import { Tarea } from '@/domain/entities/Tarea'
import { User } from '@/domain/entities/User'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { UserRound, ClipboardList, CalendarDays, X, CircleCheck } from 'lucide-react'

const tareaRepository = new FirebaseTareaRepository()

async function mensajeErrorApi(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const data = JSON.parse(text) as { error?: string }
    if (data?.error && typeof data.error === 'string') return data.error
  } catch {
    /* respuesta no JSON */
  }
  if (response.status === 401) {
    return 'Sesión caducada o no autenticado. Vuelve a iniciar sesión e intenta de nuevo.'
  }
  if (response.status === 503) {
    return text.length > 0 && text.length < 400
      ? text
      : 'El servidor no tiene Firebase Admin configurado. Revisa .env.local y la cuenta de servicio.'
  }
  if (response.status === 403) {
    return 'No tienes permiso para esta acción.'
  }
  if (response.status >= 500) {
    return 'Error en el servidor. Comprueba Firebase Admin y la consola del terminal.'
  }
  return `No se pudo completar la acción. Código: ${response.status}.`
}

function EmpleadosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [loading, setLoading] = useState(true)
  const [empleados, setEmpleados] = useState<User[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState<User | null>(null)
  
  const [newEmpleado, setNewEmpleado] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    password: '',
  })

  const [newTask, setNewTask] = useState({
    titulo: '',
    descripcion: '',
    fecha_vencimiento: new Date().toISOString().split('T')[0]
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const esDueno = user.rol === 'PROPIETARIO' || !user.rol
      if (esDueno && user.plan !== 'premium' && !user.suscripcion_activa) {
        router.push('/dashboard')
        return
      }
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      if (user.rol === 'PROPIETARIO') {
        const [resEmpleados, taskList] = await Promise.all([
          fetchWithAuth(`/api/empleados?usuario_id=${user.id}`),
          tareaRepository.getAllByUser(user.id)
        ])

        const empList = resEmpleados.ok ? await resEmpleados.json() : []
        setEmpleados(empList as User[])
        setTareas(taskList)
      } else {
        const myTasks = await tareaRepository.getByAsignado(user.id)
        setTareas(myTasks)
      }
    } catch (error) {
      console.error('Error cargando empleados/tareas:', error)
    } finally {
      setLoading(false)
    }
  }

  const findEmpleadoByAsignado = (asignadoId?: string) => {
    if (!asignadoId) return undefined
    return empleados.find((e: any) => {
      const aliases = Array.isArray(e.aliases) ? e.aliases : []
      return e.id === asignadoId || aliases.includes(asignadoId)
    })
  }

  const handleAddEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const username = newEmpleado.usuario.trim()
    if (!username) {
      setErrorMessage('El usuario del trabajador es obligatorio.')
      return
    }
    if (!newEmpleado.password || newEmpleado.password.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres.')
      return
    }
    setGuardandoEmpleado(true)
    try {
      const response = await fetchWithAuth('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newEmpleado.nombre.trim(),
          apellido: newEmpleado.apellido.trim(),
          username,
          password: newEmpleado.password,
        }),
      })

      if (!response.ok) {
        const msg = await mensajeErrorApi(response)
        throw new Error(msg)
      }

      const data = await response.json()
      setErrorMessage('')
      setShowAddModal(false)
      const nombreCreado = [String(data.nombre || newEmpleado.nombre || ''), String(data.apellido || newEmpleado.apellido || '')]
        .join(' ')
        .trim()
      setSuccessMessage(
        nombreCreado
          ? `Trabajador "${nombreCreado}" creado correctamente.`
          : `Trabajador "${data.username || username}" creado correctamente.`
      )
      setNewEmpleado({ nombre: '', apellido: '', usuario: '', password: '' })
      loadData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar empleado'
      setErrorMessage(msg)
    } finally {
      setGuardandoEmpleado(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmpleado?.id || !user?.id) return
    try {
      await fetchWithAuth('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          rancho_id: user.rancho_actual_id || 'default',
          asignado_a: selectedEmpleado.id,
          ...newTask
        })
      })
      setSuccessMessage('Tarea asignada correctamente')
      setShowTaskModal(false)
      setNewTask({ titulo: '', descripcion: '', fecha_vencimiento: new Date().toISOString().split('T')[0] })
      loadData()
    } catch (error: any) {
      setErrorMessage(error.message)
    }
  }

  const handleToggleTaskStatus = async (tarea: Tarea) => {
    try {
      const nuevoEstado = tarea.estado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA'
      await tareaRepository.update(tarea.id!, { estado: nuevoEstado })
      loadData()
    } catch (error: any) {
      setErrorMessage('No se pudo actualizar el estado de la tarea')
    }
  }

  if (loading) return <div className="p-8 text-center text-white font-semibold">Cargando...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black/70"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xl">
              <div className="text-gray-900">
                <h1 className="text-3xl font-bold">Equipo y Colaboradores</h1>
                <p className="text-gray-700 font-medium">Gestiona tu personal y asigna labores directas</p>
              </div>
              {user?.rol === 'PROPIETARIO' && (
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMessage('')
                    setShowAddModal(true)
                  }}
                  className="bg-cownect-green text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md"
                >
                  + Nuevo Empleado
                </button>
              )}
            </div>

            {user?.rol === 'PROPIETARIO' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lista de Empleados */}
                <div className="lg:col-span-4 space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-cownect-green rounded-lg flex items-center justify-center shadow-lg">
                      <UserRound className="w-4 h-4 text-white" />
                    </span>
                    Mis Empleados
                  </h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {empleados.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center shadow-lg">
                        <p className="text-gray-700 font-semibold">No hay empleados registrados</p>
                      </div>
                    ) : (
                      empleados.map((emp) => (
                        <div key={emp.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 hover:border-cownect-green transition-all group">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-900 text-lg leading-tight">{emp.nombre} {emp.apellido}</p>
                              <p className="text-sm text-gray-700 font-medium mt-1">{(emp as any).username ? `Usuario: ${(emp as any).username}` : 'Trabajador del equipo'}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">ID: {emp.id}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => { setSelectedEmpleado(emp); setShowTaskModal(true) }}
                              className="text-xs bg-cownect-green/10 text-cownect-green px-3 py-2 rounded-lg font-semibold hover:bg-cownect-green hover:text-white transition-all uppercase"
                            >
                              Asignar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Panel de Tareas */}
                <div className="lg:col-span-8 space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </span>
                    Labores en curso
                  </h2>
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xl">
                    {tareas.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-gray-700 italic font-semibold">No hay tareas programadas actualmente</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tareas.map((t) => {
                          const responsable = findEmpleadoByAsignado(t.asignado_a)
                          return (
                            <div key={t.id} className={`bg-white p-5 rounded-2xl shadow-lg border-l-8 ${t.estado === 'COMPLETADA' ? 'border-l-green-500' : 'border-l-amber-500'} border border-gray-200`}>
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{t.titulo}</h3>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${t.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {t.estado}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm font-medium line-clamp-2 mb-4">{t.descripcion}</p>
                              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-700">
                                    {responsable?.nombre?.[0] || '?'}
                                  </div>
                                  <span className="text-xs text-gray-700 font-medium">{responsable ? `${responsable.nombre}` : 'Sin asignar'}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium inline-flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {t.fecha_vencimiento}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* VISTA EMPLEADO */
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Mis Tareas Pendientes</h2>
                {tareas.length === 0 ? (
                  <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-xl font-semibold">Todo listo. No tienes pendientes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tareas.map((t) => (
                      <div key={t.id} className="bg-white p-8 rounded-3xl shadow-md border border-gray-200 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="font-bold text-2xl text-gray-900 leading-tight">{t.titulo}</h3>
                          <input 
                            type="checkbox" 
                            checked={t.estado === 'COMPLETADA'}
                            onChange={() => handleToggleTaskStatus(t)}
                            className="w-8 h-8 rounded-xl border-2 border-gray-200 text-cownect-green focus:ring-cownect-green cursor-pointer"
                          />
                        </div>
                        <p className="text-gray-600 text-base font-medium mb-8 leading-relaxed">{t.descripcion}</p>
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl inline-block">
                          <span className="text-xs font-semibold uppercase tracking-wider">Límite: {t.fecha_vencimiento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modales */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full animate-scaleIn">
            <h3 className="text-3xl font-black text-gray-900 mb-2">Registrar Personal</h3>
            <p className="text-gray-500 font-medium mb-4">
              Crea el acceso del trabajador con usuario y contraseña.
            </p>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-8 leading-relaxed">
              <strong>Importante:</strong> comparte estas credenciales de forma segura. El trabajador inicia sesión en <strong>/worker-login</strong> con correo del dueño, usuario y contraseña.
            </p>
            {errorMessage && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleAddEmpleado} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nombre (opcional)" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.nombre} onChange={e => setNewEmpleado({...newEmpleado, nombre: e.target.value})} />
                <input placeholder="Apellido (opcional)" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.apellido} onChange={e => setNewEmpleado({...newEmpleado, apellido: e.target.value})} />
              </div>
              <input placeholder="Usuario" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.usuario} onChange={e => setNewEmpleado({...newEmpleado, usuario: e.target.value})} required />
              <input type="password" autoComplete="new-password" placeholder="Contraseña inicial" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.password} onChange={e => setNewEmpleado({...newEmpleado, password: e.target.value})} required />
              <div className="flex flex-col gap-3 pt-6">
                <button
                  type="submit"
                  disabled={guardandoEmpleado}
                  className="w-full bg-cownect-green text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {guardandoEmpleado ? 'Creando…' : 'Guardar Empleado'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setErrorMessage('')
                  }}
                  className="w-full bg-white border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Tarea */}
      {showTaskModal && selectedEmpleado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full animate-scaleIn">
            <h3 className="text-3xl font-black text-gray-900 mb-1">Nueva Labor</h3>
            <p className="text-cownect-green font-black mb-8 uppercase tracking-widest text-xs">Asignando a: {selectedEmpleado.nombre}</p>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <input placeholder="Título de la labor" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={newTask.titulo} onChange={e => setNewTask({...newTask, titulo: e.target.value})} required />
              <textarea placeholder="Descripción detallada..." className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" rows={3} value={newTask.descripcion} onChange={e => setNewTask({...newTask, descripcion: e.target.value})} required />
              <input type="date" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={newTask.fecha_vencimiento} onChange={e => setNewTask({...newTask, fecha_vencimiento: e.target.value})} required />
              <div className="flex flex-col gap-3 pt-6">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all">Confirmar Asignación</button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="w-full bg-white border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alertas Éxito/Error */}
      {errorMessage && (
        <div className="fixed bottom-8 left-4 right-4 md:left-auto md:right-8 md:max-w-lg bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[10001] flex items-start gap-3 border-2 border-white/20 animate-slideIn">
          <span className="font-bold text-sm leading-snug flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="shrink-0 p-1 hover:bg-white/20 rounded-full transition-all"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-cownect-green text-white px-8 py-5 rounded-2xl shadow-2xl z-[10000] flex items-center gap-4 animate-slideIn border-2 border-white/20">
          <span className="font-black text-lg inline-flex items-center gap-2">
            <CircleCheck className="w-5 h-5" />
            {successMessage}
          </span>
          <button type="button" onClick={() => setSuccessMessage('')} className="p-1 hover:bg-white/20 rounded-full transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function EmpleadosPage() {
  return (
    <ProtectedRoute>
      <EmpleadosContent />
    </ProtectedRoute>
  )
}
