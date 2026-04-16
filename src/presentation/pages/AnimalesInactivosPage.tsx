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
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'

function AnimalesInactivosContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) loadInactivos()
  }, [user?.id])

  const loadInactivos = async () => {
    try {
      setLoading(true)
      const db = getFirebaseDb()
      // Usamos la colección 'animales' que es la estándar del proyecto
      const q = query(
        collection(db, 'animales'),
        where('usuario_id', '==', user!.id)
      )
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      
      // Filtramos manualmente por activo === false para asegurar que vemos los inactivos
      const inactivos = list.filter(a => a.activo === false)
      setAnimales(inactivos as Animal[])
    } catch (e) {
      console.error('Error cargando inactivos:', e)
    } finally {
      setLoading(false)
    }
  }

  const reactivarAnimal = async (id: string) => {
    try {
      await firestoreService.updateAnimal(id, { 
        activo: true, 
        razon_inactivo: null,
        estado: 'activo' 
      })
      loadInactivos()
    } catch (e) {
      alert('Error al reactivar el animal')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      <div className="flex-1 relative z-10">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-white text-xl">Cargando animales inactivos...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard/gestion" inline />
            </div>

            <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-cownect-green/20">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Archivo de Animales Inactivos</h1>
                <p className="text-gray-600 mt-1">Historial de animales vendidos, muertos o retirados del inventario activo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {animales.map((animal) => (
                  <div key={animal.id} className="bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">{animal.numero_identificacion}</h3>
                        <p className="text-sm text-gray-500 font-medium">{animal.nombre || 'Sin nombre'}</p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${
                        animal.estado === 'muerto' ? 'bg-red-100 text-red-600' : 
                        animal.estado === 'robado' ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {animal.estado || 'INACTIVO'}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl mb-6 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Motivo / Fecha</p>
                      <p className="text-sm text-gray-700 italic">
                        {animal.razon_inactivo || animal.razon_estado || 'No especificada'}
                      </p>
                      {animal.fecha_inactivo && (
                        <p className="text-[10px] text-gray-400 mt-2">
                          Fecha: {new Date(animal.fecha_inactivo).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={() => reactivarAnimal(animal.id)}
                      className="w-full py-3 bg-white border-2 border-cownect-green text-cownect-green font-black rounded-xl hover:bg-cownect-green hover:text-white transition-all uppercase text-xs shadow-sm"
                    >
                      Reactivar Animal
                    </button>
                  </div>
                ))}
                {animales.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic text-lg">No hay animales en el archivo histórico</p>
                    <p className="text-gray-400 text-sm mt-2">Los animales que marques como inactivos, muertos o vendidos aparecerán aquí.</p>
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

export default function AnimalesInactivosPage() {
  return (
    <ProtectedRoute>
      <AnimalesInactivosContent />
    </ProtectedRoute>
  )
}
