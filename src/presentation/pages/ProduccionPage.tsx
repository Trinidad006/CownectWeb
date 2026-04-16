'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'

interface Produccion {
  id: string
  tipo: 'leche' | 'carne'
  cantidad: number
  fecha: string
  animal_id?: string
  notas?: string
}

function ProduccionContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [producciones, setProducciones] = useState<Produccion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'leche' as 'leche' | 'carne',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const response = await fetch(`/api/produccion?usuario_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProducciones(data)
      }
    } catch (err) {
      console.error('Error cargando produccion:', err)
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
      const response = await fetch('/api/produccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          rancho_id: user.rancho_actual_id || 'default',
          ...formData,
          cantidad: parseFloat(formData.cantidad)
        })
      })

      if (response.ok) {
        setSuccess('Registro de producción guardado')
        setFormData({
          tipo: 'leche',
          cantidad: '',
          fecha: new Date().toISOString().split('T')[0],
          notas: ''
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
                  <h1 className="text-3xl font-bold text-gray-900">Producción</h1>
                  <p className="text-gray-600 mt-1">Registra la producción de leche y carne de tu rancho</p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-cownect-green text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
                >
                  {showForm ? 'Cancelar' : '+ Nuevo Registro'}
                </button>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">{error}</div>}
              {success && <div className="mb-6 p-4 bg-green-50 text-cownect-green rounded-xl border border-green-200">{success}</div>}

              {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-cownect-green/20 animate-scaleIn">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Tipo</label>
                      <select 
                        value={formData.tipo}
                        onChange={e => setFormData({...formData, tipo: e.target.value as any})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none bg-white"
                      >
                        <option value="leche">Leche (Litros)</option>
                        <option value="carne">Carne (Kg)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Cantidad</label>
                      <input 
                        type="number" step="0.01"
                        value={formData.cantidad}
                        onChange={e => setFormData({...formData, cantidad: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Fecha</label>
                      <input 
                        type="date"
                        value={formData.fecha}
                        onChange={e => setFormData({...formData, fecha: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Notas</label>
                    <textarea 
                      value={formData.notas}
                      onChange={e => setFormData({...formData, notas: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-cownect-green outline-none"
                      rows={2}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button type="submit" disabled={submitting} className="flex-1 bg-cownect-green text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-opacity-90 disabled:opacity-50">
                      {submitting ? 'Guardando...' : 'Guardar Registro'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-bold">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="py-4 px-4 font-bold text-gray-400 uppercase text-xs">Fecha</th>
                      <th className="py-4 px-4 font-bold text-gray-400 uppercase text-xs">Tipo</th>
                      <th className="py-4 px-4 font-bold text-gray-400 uppercase text-xs">Cantidad</th>
                      <th className="py-4 px-4 font-bold text-gray-400 uppercase text-xs">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producciones.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all">
                        <td className="py-4 px-4 text-gray-900 font-medium">{new Date(p.fecha).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${p.tipo === 'leche' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-gray-900">{p.cantidad} {p.tipo === 'leche' ? 'L' : 'Kg'}</td>
                        <td className="py-4 px-4 text-gray-500 text-sm italic">{p.notas || '-'}</td>
                      </tr>
                    ))}
                    {producciones.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400 italic">No hay registros de producción</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ProduccionPage() {
  return (
    <ProtectedRoute>
      <ProduccionContent />
    </ProtectedRoute>
  )
}
