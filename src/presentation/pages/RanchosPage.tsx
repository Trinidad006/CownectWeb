'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { fetchWithAuth } from '../utils/fetchWithAuth'
import { Home, MapPin } from 'lucide-react'

interface Rancho {
  id: string
  nombre: string
  ciudad?: string
  pais?: string
  direccion?: string
  hectareas?: number
  descripcion?: string
  tipos_ganado?: string[]
}

function RanchosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [ranchos, setRanchos] = useState<Rancho[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    hectareas: '',
    descripcion: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    setError('')
    setErrorHint(null)
    try {
      const response = await fetchWithAuth(`/api/rancho?usuario_id=${user.id}`)
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        const list = Array.isArray(data.ranchos) ? data.ranchos : []
        setRanchos(list)
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Error al cargar ranchos')
        setErrorHint(typeof data.hint === 'string' ? data.hint : null)
        setRanchos([])
      }
    } catch (err) {
      console.error('Error cargando ranchos:', err)
      setError('Error al cargar ranchos')
      setRanchos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSubmitting(true)
    setError('')
    setErrorHint(null)
    setSuccess('')

    try {
      const hectareasNum = parseFloat(formData.hectareas)
      const response = await fetchWithAuth('/api/rancho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          nombre: formData.nombre.trim(),
          ciudad: formData.ubicacion.trim() || undefined,
          descripcion: formData.descripcion.trim() || undefined,
          hectareas: Number.isFinite(hectareasNum) ? hectareasNum : undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setSuccess('Rancho registrado exitosamente')
        setFormData({ nombre: '', ubicacion: '', hectareas: '', descripcion: '' })
        setShowForm(false)
        loadData()
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Error al guardar rancho')
        setErrorHint(typeof data.hint === 'string' ? data.hint : null)
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
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
            <div className="mb-6">
              <BackButton href="/dashboard" inline />
            </div>

            <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-cownect-green/20">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Mis Ranchos</h1>
                  <p className="text-gray-600 mt-1">Gestiona múltiples propiedades desde una sola cuenta</p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-cownect-green text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                  {showForm ? 'Cancelar' : '+ Nuevo Rancho'}
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 space-y-2">
                  <p>{error}</p>
                  {errorHint && <p className="text-xs text-gray-700 leading-relaxed">{errorHint}</p>}
                </div>
              )}
              {success && <div className="mb-6 p-4 bg-green-50 text-cownect-green rounded-xl border border-green-200">{success}</div>}

              {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-cownect-green/20 animate-scaleIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Nombre del Rancho *</label>
                      <input 
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Ej: Rancho La Esperanza"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Ubicación</label>
                      <input 
                        type="text"
                        value={formData.ubicacion}
                        onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Ciudad, Estado, País"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Hectáreas</label>
                      <input 
                        type="number"
                        value={formData.hectareas}
                        onChange={e => setFormData({...formData, hectareas: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Descripción</label>
                      <input 
                        type="text"
                        value={formData.descripcion}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Breve descripción del rancho"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button type="submit" disabled={submitting} className="flex-1 bg-cownect-green text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-opacity-90 disabled:opacity-50">
                      {submitting ? 'Registrando...' : 'Registrar Rancho'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ranchos.map(rancho => (
                  <div key={rancho.id} className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-lg hover:border-cownect-green transition-all group">
                    <div className="w-12 h-12 bg-cownect-green/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-cownect-green transition-all">
                      <Home className="w-6 h-6 text-cownect-green group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">{rancho.nombre}</h3>
                    <p className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {[rancho.ciudad, rancho.pais].filter(Boolean).join(', ') ||
                        rancho.direccion ||
                        'Ubicación no especificada'}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <span className="text-xs font-bold text-gray-400 uppercase">Superficie</span>
                      <span className="text-sm font-black text-gray-900">{rancho.hectareas || 0} Hectáreas</span>
                    </div>
                  </div>
                ))}
                {ranchos.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">No tienes ranchos adicionales registrados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function RanchosPage() {
  return (
    <ProtectedRoute>
      <RanchosContent />
    </ProtectedRoute>
  )
}
