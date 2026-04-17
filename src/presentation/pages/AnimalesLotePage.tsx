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

function AnimalesLoteContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) loadAnimales()
  }, [user?.id])

  const loadAnimales = async () => {
    try {
      setLoading(true)
      const list = await firestoreService.getAnimalesByUser(user!.id)
      setAnimales(list as Animal[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando lotes...</div>

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
                <h1 className="text-3xl font-bold text-gray-900">Gestión por Lotes</h1>
                <p className="text-gray-600 mt-1">Organiza y visualiza tus animales agrupados por características</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Por ahora mostramos una vista simplificada, en el futuro aquí se agruparían */}
                <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 text-center shadow-lg hover:border-cownect-green transition-all">
                   <div className="w-20 h-20 bg-cownect-green/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📦</div>
                   <h3 className="text-xl font-black text-gray-900 mb-2">Lote General</h3>
                   <p className="text-gray-500 font-medium mb-6">{animales.length} Animales registrados</p>
                   <button 
                     onClick={() => router.push('/dashboard/gestion')}
                     className="w-full py-3 bg-cownect-green text-white font-black rounded-xl hover:bg-opacity-90 transition-all shadow-md"
                   >
                     Ver Animales
                   </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AnimalesLotePage() {
  return (
    <ProtectedRoute>
      <AnimalesLoteContent />
    </ProtectedRoute>
  )
}
