'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { CalcularEstadisticasUseCase } from '@/domain/use-cases/estadisticas/CalcularEstadisticasUseCase'
import EstadisticasPanel from '../components/dashboard/EstadisticasPanel'
import BackButton from '../components/ui/BackButton'
import { EstadisticasCompletas } from '@/domain/entities/Estadisticas'
import { Animal } from '@/domain/entities/Animal'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'

function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [estadisticas, setEstadisticas] = useState({
    totalAnimales: 0,
    totalVacunaciones: 0,
    totalPesos: 0,
  })
  const [estadisticasCompletas, setEstadisticasCompletas] = useState<EstadisticasCompletas | null>(null)
  const [animalesInventario, setAnimalesInventario] = useState<Animal[]>([])

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [animales, vacunaciones, pesos] = await Promise.all([
        firestoreService.getAnimalesByUser(user.id),
        firestoreService.getVacunacionesByUser(user.id),
        firestoreService.getPesosByUser(user.id),
      ])

      setAnimalesInventario(animales as Animal[])

      setEstadisticas({
        totalAnimales: animales.length,
        totalVacunaciones: vacunaciones.length,
        totalPesos: pesos.length,
      })

      const calcularEstadisticas = new CalcularEstadisticasUseCase()
      // Premium: capacidad ilimitada (no se pasa límite)
      const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
      const capacidadMaxima = isPremium ? null : (user?.rancho_hectareas ? Math.floor((user.rancho_hectareas || 0) * 0.5) : 100)
      const estadisticasAvanzadas = calcularEstadisticas.execute(animales as Animal[], vacunaciones, pesos, capacidadMaxima ?? undefined)
      setEstadisticasCompletas(estadisticasAvanzadas)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-contentFadeIn">
        {/* Banner Premium - Solo si no es premium */}
        {(!user?.plan || user?.plan !== 'premium') && !user?.suscripcion_activa && (
          <div className="bg-gradient-to-r from-cownect-green to-cownect-dark-green rounded-lg shadow-2xl p-6 mb-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Contrata Nuestra App Premium</h2>
                <p className="text-white text-lg opacity-90">
                  Más almacenamiento y funcionalidades avanzadas para tu gestión ganadera
                </p>
              </div>
              <Link
                href="/choose-plan"
                className="bg-white text-cownect-dark-green px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap"
              >
                <CreditCard className="h-5 w-5" />
                Ver Planes
              </Link>
            </div>
          </div>
        )}

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/" inline />
          </div>
          <h2 className="text-2xl font-bold text-black mb-6">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => router.push('/dashboard/gestion')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Gestión</h3>
              <p className="text-gray-700 text-sm">Animales, vacunaciones, control de peso y registros</p>
            </button>
            <button 
              onClick={() => router.push('/ranchos')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Ganaderos</h3>
              <p className="text-gray-700 text-sm">Ver perfiles públicos de ranchos y enviar buy requests</p>
            </button>
            <button 
              onClick={() => router.push('/buy-requests')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Solicitudes de compra</h3>
              <p className="text-gray-700 text-sm">Revisa las solicitudes recibidas y conversaciones</p>
            </button>
          </div>
        </div>

        {/* Panel de Estadísticas Avanzadas */}
        {estadisticasCompletas && (
          <div className="mb-6">
            <EstadisticasPanel estadisticas={estadisticasCompletas} animales={animalesInventario} />
          </div>
        )}

        {/* Perfil del Usuario */}
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6 w-full border-2 border-cownect-dark-green">
          <h2 className="text-2xl font-bold text-black mb-6 pb-4 border-b-2 border-cownect-dark-green">Mi Perfil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="pb-3 border-b border-cownect-dark-green">
                <p className="text-gray-700"><strong>Nombre:</strong> {user?.nombre && user?.apellido ? `${user.nombre} ${user.apellido}` : user?.nombre || 'N/A'}</p>
              </div>
              <div className="pb-3 border-b border-cownect-dark-green">
                <p className="text-gray-700"><strong>Email:</strong> {user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-700"><strong>Teléfono:</strong> {user?.telefono || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {user?.rancho && (
                <>
                  <div className="pb-3 border-b border-cownect-dark-green">
                    <p className="text-gray-700"><strong>Rancho:</strong> {user.rancho}</p>
                  </div>
                  {user.rancho_ciudad && user.rancho_pais && (
                    <div className="pb-3 border-b border-cownect-dark-green">
                      <p className="text-gray-700"><strong>Ubicación:</strong> {user.rancho_ciudad}, {user.rancho_pais}</p>
                    </div>
                  )}
                  {user.rancho_hectareas && (
                    <div>
                      <p className="text-gray-700"><strong>Hectáreas:</strong> {user.rancho_hectareas}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-cownect-green">{estadisticas.totalAnimales}</p>
            <p className="text-gray-700 text-sm">Total Animales</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{estadisticas.totalVacunaciones}</p>
            <p className="text-gray-700 text-sm">Vacunaciones</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{estadisticas.totalPesos}</p>
            <p className="text-gray-700 text-sm">Registros de Peso</p>
          </div>
        </div>

      </div>

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }} inline />
              <h3 className="text-xl font-bold text-cownect-green">Éxito</h3>
            </div>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setSuccessMessage('')
                }}
                className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-opacity-90 transition-all"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowErrorModal(false); setErrorMessage('') }} inline />
              <h3 className="text-xl font-bold text-red-600">Error</h3>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorModal(false)
                  setErrorMessage('')
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

