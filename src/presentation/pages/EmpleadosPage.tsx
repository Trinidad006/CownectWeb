'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { FirebaseTareaRepository } from '@/infrastructure/repositories/FirebaseTareaRepository'
import { Tarea } from '@/domain/entities/Tarea'
import { User } from '@/domain/entities/User'
import { fetchWithAuth } from '../utils/fetchWithAuth'

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
    email: '',
    telefono: '',
  })
  const [pinRecienGenerado, setPinRecienGenerado] = useState<string | null>(null)

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
        const [empList, taskList] = await Promise.all([
          firestoreService.getEmpleadosByJefe(user.id),
          tareaRepository.getAllByUser(user.id)
        ])
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

  const handleAddEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const emailNorm = newEmpleado.email.trim().toLowerCase()
    const duenoEmail = user?.email?.trim().toLowerCase()
    if (emailNorm && duenoEmail && emailNorm === duenoEmail) {
      setErrorMessage('El correo del empleado no puede ser el mismo que el del dueño.')
      return
    }
    const soloDigitos = (s: string) => s.replace(/\D/g, '')
    const tEmp = soloDigitos(newEmpleado.telefono)
    const tDueno = soloDigitos(user?.telefono || '')
    if (tEmp.length > 0 && tDueno.length > 0 && tEmp === tDueno) {
      setErrorMessage('El teléfono no puede ser el mismo que el del dueño; déjalo vacío o usa el del trabajador.')
      return
    }
    setGuardandoEmpleado(true)
    try {
      const response = await fetchWithAuth('/api/auth/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newEmpleado.nombre,
          apellido: newEmpleado.apellido,
          email: newEmpleado.email,
          telefono: newEmpleado.telefono,
        }),
      })

      if (!response.ok) {
        const msg = await mensajeErrorApi(response)
        throw new Error(msg)
      }

      const data = await response.json()
      setErrorMessage('')
      setShowAddModal(false)
      setNewEmpleado({ nombre: '', apellido: '', email: '', telefono: '' })
      setPinRecienGenerado(data.pin_kiosko || null)
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

  if (loading) return <div className="p-8 text-center text-white">Cargando...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
              <div className="flex items-center gap-4 text-white">
                <BackButton href="/dashboard" inline />
                <div>
                  <h1 className="text-3xl font-black">Equipo y Colaboradores</h1>
                  <p className="text-white/70 font-medium">Gestiona tu personal y asigna labores directas</p>
                </div>
              </div>
              {user?.rol === 'PROPIETARIO' && (
                <button 
                  type="button"
                  onClick={() => {
                    setErrorMessage('')
                    setShowAddModal(true)
                  }}
                  className="bg-cownect-green text-white px-8 py-3 rounded-xl font-black hover:bg-opacity-90 transition-all shadow-lg border-2 border-white/10"
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
                    <span className="w-8 h-8 bg-cownect-green rounded-lg flex items-center justify-center text-sm">👤</span>
                    Mis Empleados
                  </h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {empleados.length === 0 ? (
                      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border-2 border-dashed border-white/20 text-center">
                        <p className="text-white/50">No hay empleados registrados</p>
                      </div>
                    ) : (
                      empleados.map((emp) => (
                        <div key={emp.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:border-cownect-green transition-all group">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-gray-900 text-lg leading-tight">{emp.nombre} {emp.apellido}</p>
                              <p className="text-sm text-gray-500 font-medium mt-1">{emp.email}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">PIN: {emp.pin_kiosko}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => { setSelectedEmpleado(emp); setShowTaskModal(true) }}
                              className="text-xs bg-cownect-green/10 text-cownect-green px-3 py-2 rounded-lg font-black hover:bg-cownect-green hover:text-white transition-all uppercase"
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
                    <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm">📋</span>
                    Labores en curso
                  </h2>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                    {tareas.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-white/40 italic">No hay tareas programadas actualmente</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tareas.map((t) => {
                          const responsable = empleados.find(e => e.id === t.asignado_a)
                          return (
                            <div key={t.id} className={`bg-white p-5 rounded-2xl shadow-xl border-l-8 ${t.estado === 'COMPLETADA' ? 'border-l-green-500' : 'border-l-amber-500'} border border-gray-50`}>
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-black text-gray-900 text-lg leading-tight">{t.titulo}</h3>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${t.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {t.estado}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm font-medium line-clamp-2 mb-4">{t.descripcion}</p>
                              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                    {responsable?.nombre?.[0] || '?'}
                                  </div>
                                  <span className="text-xs text-gray-500 font-bold">{responsable ? `${responsable.nombre}` : 'Sin asignar'}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold">📅 {t.fecha_vencimiento}</span>
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
                <h2 className="text-2xl font-black text-white mb-6">Mis Tareas Pendientes</h2>
                {tareas.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md p-20 rounded-3xl text-center border-2 border-dashed border-white/20">
                    <p className="text-white/50 text-xl font-bold">¡Todo listo! No tienes pendientes.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tareas.map((t) => (
                      <div key={t.id} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-50 hover:shadow-cownect-green/20 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="font-black text-2xl text-gray-900 leading-tight">{t.titulo}</h3>
                          <input 
                            type="checkbox" 
                            checked={t.estado === 'COMPLETADA'}
                            onChange={() => handleToggleTaskStatus(t)}
                            className="w-8 h-8 rounded-xl border-2 border-gray-200 text-cownect-green focus:ring-cownect-green cursor-pointer"
                          />
                        </div>
                        <p className="text-gray-600 text-lg font-medium mb-8 leading-relaxed">{t.descripcion}</p>
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl inline-block">
                          <span className="text-xs font-black uppercase tracking-widest">Límite: {t.fecha_vencimiento}</span>
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
              Se generará un PIN único de 4 dígitos para que el empleado entre con «Entrar como empleado».
            </p>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-8 leading-relaxed">
              <strong>Correo y teléfono del trabajador:</strong> el correo debe ser <strong>diferente al tuyo</strong>; en Firebase cada cuenta necesita un correo único. Si pones teléfono, que no sea el mismo que el del dueño; si no tienes otro número, déjalo vacío.
            </p>
            {errorMessage && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleAddEmpleado} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nombre" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.nombre} onChange={e => setNewEmpleado({...newEmpleado, nombre: e.target.value})} required />
                <input placeholder="Apellido" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.apellido} onChange={e => setNewEmpleado({...newEmpleado, apellido: e.target.value})} required />
              </div>
              <input type="email" autoComplete="off" placeholder="Correo del empleado" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.email} onChange={e => setNewEmpleado({...newEmpleado, email: e.target.value})} required />
              <input type="tel" autoComplete="off" placeholder="Teléfono del empleado — opcional" className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-cownect-green outline-none font-bold" value={newEmpleado.telefono} onChange={e => setNewEmpleado({...newEmpleado, telefono: e.target.value})} />
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

      {pinRecienGenerado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-4 border-cownect-green">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">PIN de acceso</p>
            <p className="text-5xl font-black tracking-[0.3em] text-cownect-dark-green mb-6">{pinRecienGenerado}</p>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Compártelo solo con este empleado. En la app puede iniciar sesión con «Entrar como empleado» y este PIN. No volverá a mostrarse aquí de forma destacada; el PIN sigue visible en la lista del equipo.
            </p>
            <button
              type="button"
              onClick={() => setPinRecienGenerado(null)}
              className="w-full bg-cownect-green text-white py-4 rounded-2xl font-black text-lg"
            >
              Entendido
            </button>
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
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="fixed bottom-8 right-8 bg-cownect-green text-white px-8 py-5 rounded-2xl shadow-2xl z-[10000] flex items-center gap-4 animate-slideIn border-2 border-white/20">
          <span className="font-black text-lg">✓ {successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="p-1 hover:bg-white/20 rounded-full transition-all">✕</button>
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
