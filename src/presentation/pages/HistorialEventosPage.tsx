'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import Sidebar from '../components/layouts/Sidebar'
import { firestoreService } from '@/infrastructure/services/firestoreService'

function HistorialEventosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const animalId = searchParams.get('id')
  const { user } = useAuth(false)
  const [eventos, setEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (animalId) loadHistorial()
  }, [animalId])

  const loadHistorial = async () => {
    try {
      setLoading(true)
      // Por ahora simulamos carga o usamos un método existente
      setEventos([])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando historial...</div>

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <BackButton href="/dashboard/gestion" inline />
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-cownect-green/20">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900">Historial de Eventos</h1>
                <p className="text-gray-600 mt-1">Bitácora completa de movimientos, cambios y sucesos del animal</p>
              </div>

              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-100"></div>
                
                {eventos.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-400 italic">No se han registrado eventos para este animal aún</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative">
                    {/* Aquí irían los items del timeline */}
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

function HistorialEventosPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Cargando...</div>}>
      <HistorialEventosContent />
    </Suspense>
  )
}

export default function HistorialEventosPage() {
  return (
    <ProtectedRoute>
      <HistorialEventosPageWrapper />
    </ProtectedRoute>
  )
}
