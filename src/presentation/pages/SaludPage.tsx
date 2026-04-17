'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { RegistroClinico } from '@/domain/entities/RegistroClinico'

function SaludContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [historial, setHistorial] = useState<RegistroClinico[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    animal_id: '',
    enfermedad: '',
    diagnostico: '',
    tratamiento: '',
    veterinario: '',
    fecha_registro: new Date().toISOString().split('T')[0],
    estado: 'ACTIVO' as 'ACTIVO' | 'RESUELTO' | 'CRONICO'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const response = await fetch(`/api/salud?usuario_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
      }
    } catch (err) {
      console.error('Error cargando salud:', err)
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
      const response = await fetch('/api/salud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          rancho_id: user.rancho_actual_id || 'default',
          ...formData
        })
      })

      if (response.ok) {
        setSuccess('Registro clínico guardado exitosamente')
        setFormData({
          animal_id: '',
          enfermedad: '',
          diagnostico: '',
          tratamiento: '',
          veterinario: '',
          fecha_registro: new Date().toISOString().split('T')[0],
          estado: 'ACTIVO'
        })
        setShowForm(false)
        loadData()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar')
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
                  <h1 className="text-3xl font-bold text-gray-900">Salud e Historial Clínico</h1>
                  <p className="text-gray-600 mt-1">Control sanitario y seguimiento de enfermedades</p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-cownect-green text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                  {showForm ? 'Cancelar' : '+ Nuevo Diagnóstico'}
                </button>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">{error}</div>}
              {success && <div className="mb-6 p-4 bg-green-50 text-cownect-green rounded-xl border border-green-200">{success}</div>}

              {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-cownect-green/20 animate-scaleIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Arete / ID Animal *</label>
                      <input 
                        type="text"
                        value={formData.animal_id}
                        onChange={e => setFormData({...formData, animal_id: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Ej: ABC-123"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Enfermedad *</label>
                      <input 
                        type="text"
                        value={formData.enfermedad}
                        onChange={e => setFormData({...formData, enfermedad: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Nombre de la enfermedad"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Estado</label>
                      <select 
                        value={formData.estado}
                        onChange={e => setFormData({...formData, estado: e.target.value as any})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none bg-white"
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="RESUELTO">Resuelto</option>
                        <option value="CRONICO">Crónico</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Tratamiento</label>
                      <input 
                        type="text"
                        value={formData.tratamiento}
                        onChange={e => setFormData({...formData, tratamiento: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Medicamentos, dosis, frecuencia..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Veterinario</label>
                      <input 
                        type="text"
                        value={formData.veterinario}
                        onChange={e => setFormData({...formData, veterinario: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="Nombre del médico"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button type="submit" disabled={submitting} className="flex-1 bg-cownect-green text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-opacity-90 disabled:opacity-50">
                      {submitting ? 'Guardando...' : 'Registrar Diagnóstico'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {historial.map(h => (
                  <div key={h.id} className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-l-red-500 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Animal: {h.animal_id}</span>
                        <h3 className="text-xl font-black text-gray-900 mt-1">{h.enfermedad}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        h.estado === 'ACTIVO' ? 'bg-red-100 text-red-600' : h.estado === 'RESUELTO' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {h.estado}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tratamiento</p>
                        <p className="text-sm text-gray-700 font-medium">{h.tratamiento || 'No especificado'}</p>
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                        <span className="text-xs text-gray-500 font-bold">👨‍⚕️ {h.veterinario || 'Sin asignar'}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(h.fecha_registro).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {historial.length === 0 && (
                  <div className="md:col-span-2 py-12 text-center text-gray-400 italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    No hay historial clínico registrado
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

export default function SaludPage() {
  return (
    <ProtectedRoute>
      <SaludContent />
    </ProtectedRoute>
  )
}
