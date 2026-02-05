'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'

function PesosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [pesos, setPesos] = useState<any[]>([])
  const [animales, setAnimales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    animal_id: '',
    peso: '',
    fecha_registro: '',
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
      setPesos(data)
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
      await firestoreService.addPeso({
        ...formData,
        peso: parseFloat(formData.peso),
        usuario_id: user.id,
      })
      setShowForm(false)
      setFormData({
        animal_id: '',
        peso: '',
        fecha_registro: '',
        observaciones: '',
      })
      loadPesos()
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
            <h2 className="text-2xl font-bold text-black mb-4">Control de Peso</h2>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-cownect-green text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
            >
              {showForm ? 'Cancelar' : '+ Registrar Peso'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-4">Nuevo Registro de Peso</h3>
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
                  <label className="block text-base font-bold text-black mb-2">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Fecha de Registro</label>
                  <input
                    type="date"
                    value={formData.fecha_registro}
                    onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Observaciones</label>
                  <input
                    type="text"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
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
            {pesos.map((peso) => (
              <div key={peso.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  {peso.animales?.nombre || peso.animales?.numero_identificacion || 'Animal'}
                </h3>
                <p className="text-gray-700 mb-1"><strong>Peso:</strong> {peso.peso} kg</p>
                <p className="text-gray-700 mb-1"><strong>Fecha:</strong> {peso.fecha_registro}</p>
                {peso.observaciones && (
                  <p className="text-gray-700"><strong>Observaciones:</strong> {peso.observaciones}</p>
                )}
              </div>
            ))}
          </div>

          {pesos.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-xl text-gray-700">No hay registros de peso</p>
            </div>
          )}
        </div>
      </div>
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
