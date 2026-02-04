'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'
import { Vacunacion } from '@/domain/entities/Vacunacion'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'

function VacunacionesContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [vacunaciones, setVacunaciones] = useState<any[]>([])
  const [animales, setAnimales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
  }, [])

  const loadAnimales = async () => {
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('animales')
        .select('*')
        .eq('usuario_id', user.id)

      if (error) throw error
      setAnimales(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadVacunaciones = async () => {
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('vacunaciones')
        .select('*, animales:animal_id(nombre, numero_identificacion)')
        .eq('usuario_id', user.id)
        .order('fecha_aplicacion', { ascending: false })

      if (error) throw error
      setVacunaciones(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('vacunaciones')
        .insert({
          ...formData,
          usuario_id: user.id,
        })

      if (error) throw error

      setShowForm(false)
      setFormData({
        animal_id: '',
        tipo_vacuna: '',
        fecha_aplicacion: '',
        proxima_dosis: '',
        observaciones: '',
      })
      loadVacunaciones()
    } catch (error: any) {
      alert('Error: ' + error.message)
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
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <BackButton href="/dashboard" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <Logo />
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Gestión de Vacunaciones</h2>
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
                    {animales.map((animal) => (
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
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Próxima Dosis</label>
                  <input
                    type="date"
                    value={formData.proxima_dosis}
                    onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  />
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
            {vacunaciones.map((vac) => (
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

