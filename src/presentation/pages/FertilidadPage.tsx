'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'

function FertilidadContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    try {
      setLoading(true)
      const list = await firestoreService.getAnimalesByUser(user!.id)
      // Filtrar solo hembras para fertilidad
      const hembras = list.filter(a => a.genero === 'H')
      setAnimales(hembras as Animal[])
    } catch (e) {
      setError('No se pudieron cargar los datos de fertilidad')
    } finally {
      setLoading(false)
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
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Control de Fertilidad</h1>
                <p className="text-gray-600 mt-1">Seguimiento reproductivo de hembras, celos y gestaciones</p>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {animales.map((animal) => (
                  <div key={animal.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">{animal.numero_identificacion}</h3>
                        <p className="text-sm text-gray-500 font-medium">{animal.nombre || 'Sin nombre'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        animal.estado_reproductivo === 'GESTACION' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {animal.estado_reproductivo || 'VACÍA'}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold uppercase text-[10px]">Último Celo</span>
                        <span className="font-medium text-gray-900">{animal.ultimo_celo || 'No registrado'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold uppercase text-[10px]">Días Gestación</span>
                        <span className="font-medium text-gray-900">{animal.dias_gestacion || 0} días</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/dashboard/fertilidad/${animal.id}`)}
                      className="w-full py-3 bg-gray-50 text-cownect-dark-green font-bold rounded-xl hover:bg-cownect-green hover:text-white transition-all border border-gray-100"
                    >
                      Gestionar Reproducción
                    </button>
                  </div>
                ))}
                {animales.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 italic">No se encontraron hembras registradas en el inventario</p>
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

export default function FertilidadPage() {
  return (
    <ProtectedRoute>
      <FertilidadContent />
    </ProtectedRoute>
  )
}
