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
import { CreditCard, MapPin, CheckSquare, Award, Activity, ClipboardList, Users } from 'lucide-react'
import Sidebar from '../components/layouts/Sidebar'

function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [loading, setLoading] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [estadisticasPrincipales, setEstadisticasPrincipales] = useState({
    totalAnimales: 0,
    totalVacunaciones: 0,
    totalPesos: 0,
  })
  const [estadisticasCompletas, setEstadisticasCompletas] = useState<EstadisticasCompletas | null>(null)
  const [animalesInventario, setAnimalesInventario] = useState<Animal[]>([])

  useEffect(() => {
    if (user?.id) loadDashboardData()
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      
      // Intentamos cargar todo, pero capturamos errores individuales para no romper el dashboard
      const [animales, vacunaciones, pesos] = await Promise.all([
        firestoreService.getAnimalesByUser(user.id).catch(err => { console.error('Error animales:', err); return [] }),
        firestoreService.getVacunacionesByUser(user.id).catch(err => { console.error('Error vacunas:', err); return [] }),
        firestoreService.getPesosByUser(user.id).catch(err => { console.error('Error pesos:', err); return [] }),
      ])

      setAnimalesInventario(animales as Animal[])

      setEstadisticasPrincipales({
        totalAnimales: animales.length,
        totalVacunaciones: vacunaciones.length,
        totalPesos: pesos.length,
      })

      const calcularEstadisticas = new CalcularEstadisticasUseCase()
      const isPremium = user?.plan === 'premium' || user?.suscripcion_activa
      const capacidadMaxima = isPremium ? null : (user?.rancho_hectareas ? Math.floor((user.rancho_hectareas || 0) * 0.5) : 100)
      
      const resEstadisticas = calcularEstadisticas.execute(
        animales as Animal[], 
        vacunaciones, 
        pesos, 
        capacidadMaxima
      )
      
      setEstadisticasCompletas(resEstadisticas)
    } catch (error) {
      console.error('Error critico en dashboard:', error)
      setErrorMessage('Hubo un problema al procesar los indicadores del rancho.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <DashboardHeader />
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cownect-green mb-4"></div>
          <p className="text-white font-black uppercase tracking-[5px] text-sm">Cargando Datos...</p>
        </div>
      </div>
    )
  }

  const isPremium = user?.plan === 'premium' || user?.suscripcion_activa

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <Sidebar className="hidden md:flex w-64 shrink-0 relative z-20" />
      
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden text-gray-900">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {(!user?.plan || user?.plan !== 'premium') && !user?.suscripcion_activa && (
              <div className="bg-gradient-to-r from-cownect-green to-cownect-dark-green rounded-3xl shadow-2xl p-8 relative overflow-hidden text-white border-2 border-white/20">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Potencia tu Rancho</h2>
                    <p className="opacity-80 font-medium text-lg">Activa las funciones avanzadas para un control total del hato.</p>
                  </div>
                  <Link href="/choose-plan" className="bg-white text-cownect-dark-green px-10 py-5 rounded-2xl font-black hover:bg-gray-100 transition-all flex items-center gap-3 shadow-2xl uppercase tracking-widest text-sm">
                    <CreditCard className="h-5 w-5" /> Ver Planes
                  </Link>
                </div>
              </div>
            )}

            {/* Fila de Indicadores Principales */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[36px] shadow-2xl p-8 md:p-10 border border-cownect-green/15 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <Activity className="text-cownect-green w-7 h-7" />
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Resumen del Establecimiento</h2>
                </div>
                <BackButton href="/" inline />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                <div className="bg-gradient-to-br from-gray-50 to-white p-5 md:p-6 rounded-3xl border border-gray-100 hover:border-cownect-green/40 transition-all shadow-sm hover:shadow-md">
                  <p className="text-4xl font-bold text-cownect-green tracking-tight">{estadisticasPrincipales.totalAnimales}</p>
                  <p className="text-sm font-medium text-gray-500 mt-2">Animales activos</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-5 md:p-6 rounded-3xl border border-gray-100 hover:border-blue-400/50 transition-all shadow-sm hover:shadow-md">
                  <p className="text-4xl font-bold text-blue-600 tracking-tight">{estadisticasPrincipales.totalVacunaciones}</p>
                  <p className="text-sm font-medium text-gray-500 mt-2">Vacunaciones</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-5 md:p-6 rounded-3xl border border-gray-100 hover:border-purple-400/50 transition-all shadow-sm hover:shadow-md">
                  <p className="text-4xl font-bold text-purple-600 tracking-tight">{estadisticasPrincipales.totalPesos}</p>
                  <p className="text-sm font-medium text-gray-500 mt-2">Registros de peso</p>
                </div>
              </div>
            </div>

            {/* Módulos de Trabajo */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[36px] shadow-2xl p-8 md:p-10 border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-7 border-b border-gray-100 pb-4">
                <ClipboardList className="text-gray-400 w-5 h-5" />
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Modulos de Trabajo</h2>
              </div>
              <div className={`grid gap-4 md:gap-5 grid-cols-2 ${isPremium && !user?.es_sesion_trabajador ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-4'}`}>
                <button onClick={() => router.push('/dashboard/ranchos')} className="p-5 md:p-6 bg-gradient-to-b from-gray-50 to-white rounded-[28px] border border-gray-200 hover:border-cownect-green/40 hover:-translate-y-0.5 transition-all text-center group shadow-sm hover:shadow-md">
                  <MapPin className="w-7 h-7 mx-auto mb-3 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-medium text-sm text-gray-900">Ranchos</p>
                </button>
                <button onClick={() => router.push('/dashboard/tareas')} className="p-5 md:p-6 bg-gradient-to-b from-gray-50 to-white rounded-[28px] border border-gray-200 hover:border-cownect-green/40 hover:-translate-y-0.5 transition-all text-center group shadow-sm hover:shadow-md">
                  <CheckSquare className="w-7 h-7 mx-auto mb-3 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-medium text-sm text-gray-900">Tareas</p>
                </button>
                <button onClick={() => router.push('/dashboard/certificado')} className="p-5 md:p-6 bg-gradient-to-b from-gray-50 to-white rounded-[28px] border border-gray-200 hover:border-cownect-green/40 hover:-translate-y-0.5 transition-all text-center group shadow-sm hover:shadow-md">
                  <Award className="w-7 h-7 mx-auto mb-3 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-medium text-sm text-gray-900">Certificado</p>
                </button>
                {isPremium && !user?.es_sesion_trabajador && (
                  <button type="button" onClick={() => router.push('/dashboard/empleados')} className="p-5 md:p-6 bg-gradient-to-b from-gray-50 to-white rounded-[28px] border border-gray-200 hover:border-cownect-green/40 hover:-translate-y-0.5 transition-all text-center group shadow-sm hover:shadow-md">
                    <Users className="w-7 h-7 mx-auto mb-3 text-gray-400 group-hover:text-cownect-green transition-colors" />
                    <p className="font-medium text-sm text-gray-900">Empleados</p>
                  </button>
                )}
              </div>
            </div>

            {/* PANEL DETALLADO - Sanidad, Reproduccion, etc. */}
            {estadisticasCompletas && (
              <div className="animate-contentFadeIn">
                <EstadisticasPanel 
                  estadisticas={estadisticasCompletas} 
                  animales={animalesInventario} 
                />
              </div>
            )}

            {/* Perfil del Propietario */}
            <div className="bg-white rounded-[40px] shadow-2xl p-12 border border-gray-100 text-gray-900">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[6px] mb-10">Informacion de Cuenta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="border-l-4 border-cownect-green pl-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Titular</p>
                    <p className="font-black text-2xl uppercase tracking-tighter">{user?.nombre && user?.apellido ? `${user.nombre} ${user.apellido}` : user?.nombre || 'N/A'}</p>
                  </div>
                  <div className="border-l-4 border-gray-200 pl-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correo Registrado</p>
                    <p className="font-bold text-gray-600 text-lg">{user?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-8">
                  {user?.rancho && (
                    <>
                      <div className="border-l-4 border-blue-500 pl-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rancho Principal</p>
                        <p className="font-black text-2xl uppercase tracking-tighter">{user.rancho}</p>
                      </div>
                      <div className="border-l-4 border-gray-200 pl-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ubicacion Regional</p>
                        <p className="font-black text-cownect-green uppercase text-sm tracking-widest">
                          {user.rancho_ciudad || 'N/A'}, {user.rancho_pais || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-md w-full text-center border-b-8 border-cownect-green">
            <h3 className="text-3xl font-black mb-6 uppercase">Confirmacion</h3>
            <p className="text-gray-600 mb-10 font-bold text-lg leading-relaxed uppercase">{successMessage}</p>
            <button
              onClick={() => { setShowSuccessModal(false); setSuccessMessage('') }}
              className="w-full bg-cownect-green text-white py-6 rounded-3xl font-black transition-all text-lg"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-md w-full text-center border-t-8 border-red-600">
            <h3 className="text-3xl font-black text-red-600 mb-6 uppercase">Aviso Crítico</h3>
            <p className="text-gray-700 mb-10 font-bold text-lg leading-relaxed uppercase">{errorMessage}</p>
            <button
              onClick={() => { setShowErrorModal(false); setErrorMessage('') }}
              className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black transition-all text-lg"
            >
              CERRAR
            </button>
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
