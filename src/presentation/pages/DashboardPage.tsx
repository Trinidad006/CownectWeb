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
import { CreditCard, MapPin, Milk, CheckSquare, Award, Users, Beef, Activity, ClipboardList } from 'lucide-react'
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
    totalLeche: 0,
    totalCarne: 0
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
      const [animales, vacunaciones, pesos, produccion] = await Promise.all([
        firestoreService.getAnimalesByUser(user.id).catch(err => { console.error('Error animales:', err); return [] }),
        firestoreService.getVacunacionesByUser(user.id).catch(err => { console.error('Error vacunas:', err); return [] }),
        firestoreService.getPesosByUser(user.id).catch(err => { console.error('Error pesos:', err); return [] }),
        firestoreService.getProduccionByUser(user.id).catch(err => { console.error('Error produccion:', err); return [] })
      ])

      setAnimalesInventario(animales as Animal[])

      let lecheAcumulada = 0
      let carneAcumulada = 0
      if (produccion && Array.isArray(produccion)) {
        produccion.forEach((p: any) => {
          const valor = parseFloat(p.cantidad) || 0
          if (p.tipo === 'leche') lecheAcumulada += valor
          else if (p.tipo === 'carne') carneAcumulada += valor
        })
      }

      setEstadisticasPrincipales({
        totalAnimales: animales.length,
        totalVacunaciones: vacunaciones.length,
        totalPesos: pesos.length,
        totalLeche: Number(lecheAcumulada.toFixed(2)),
        totalCarne: Number(carneAcumulada.toFixed(2))
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
            <div className="bg-white rounded-[40px] shadow-2xl p-10 border-2 border-cownect-green/20 relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-cownect-green w-8 h-8" />
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-[6px]">Resumen del Establecimiento</h2>
                </div>
                <BackButton href="/" inline />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 group hover:border-cownect-green transition-all shadow-sm">
                  <p className="text-4xl font-black text-cownect-green tracking-tighter">{estadisticasPrincipales.totalAnimales}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Animales Activos</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 group hover:border-blue-500 transition-all shadow-sm">
                  <p className="text-4xl font-black text-blue-600 tracking-tighter">{estadisticasPrincipales.totalVacunaciones}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Vacunaciones</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 group hover:border-purple-500 transition-all shadow-sm">
                  <p className="text-4xl font-black text-purple-600 tracking-tighter">{estadisticasPrincipales.totalPesos}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Registros Peso</p>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 group hover:border-blue-400 transition-all shadow-sm">
                  <p className="text-4xl font-black text-blue-800 tracking-tighter">{estadisticasPrincipales.totalLeche}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Leche (LTS)</p>
                </div>
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 group hover:border-orange-400 transition-all shadow-sm">
                  <p className="text-4xl font-black text-orange-800 tracking-tighter">{estadisticasPrincipales.totalCarne}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Carne (KG)</p>
                </div>
              </div>
            </div>

            {/* Modulos de Trabajo */}
            <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                <ClipboardList className="text-gray-300 w-6 h-6" />
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[6px]">Modulos de Trabajo</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <button onClick={() => router.push('/dashboard/ranchos')} className="p-6 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-cownect-green hover:bg-white transition-all text-center group shadow-md">
                  <MapPin className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-black text-gray-900 text-xs uppercase tracking-tighter">Ranchos</p>
                </button>
                <button onClick={() => router.push('/dashboard/produccion')} className="p-6 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-cownect-green hover:bg-white transition-all text-center group shadow-md">
                  <Milk className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-black text-gray-900 text-xs uppercase tracking-tighter">Produccion</p>
                </button>
                <button onClick={() => router.push('/dashboard/empleados')} className="p-6 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-cownect-green hover:bg-white transition-all text-center group shadow-md">
                  <Users className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-black text-gray-900 text-xs uppercase tracking-tighter">Empleados</p>
                </button>
                <button onClick={() => router.push('/dashboard/tareas')} className="p-6 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-cownect-green hover:bg-white transition-all text-center group shadow-md">
                  <CheckSquare className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-black text-gray-900 text-xs uppercase tracking-tighter">Tareas</p>
                </button>
                <button onClick={() => router.push('/dashboard/certificado')} className="p-6 bg-gray-50 rounded-[32px] border-2 border-transparent hover:border-cownect-green hover:bg-white transition-all text-center group shadow-md">
                  <Award className="w-8 h-8 mx-auto mb-4 text-gray-400 group-hover:text-cownect-green transition-colors" />
                  <p className="font-black text-gray-900 text-xs uppercase tracking-tighter">Certificado</p>
                </button>
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
