'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { formatPrecio } from '@/utils/paisesMonedas'
import { CalcularEstadisticasUseCase } from '@/domain/use-cases/estadisticas/CalcularEstadisticasUseCase'
import EstadisticasPanel from '../components/dashboard/EstadisticasPanel'
import BackButton from '../components/ui/BackButton'
import { EstadisticasCompletas } from '@/domain/entities/Estadisticas'
import { Animal } from '@/domain/entities/Animal'

function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth(false)
  const [comprasEnProceso, setComprasEnProceso] = useState<any[]>([])
  const [ventasEnProceso, setVentasEnProceso] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [compraToComplete, setCompraToComplete] = useState<any>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [compraToCancel, setCompraToCancel] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showCancelVentaModal, setShowCancelVentaModal] = useState(false)
  const [ventaToCancel, setVentaToCancel] = useState<any>(null)
  const [showCompleteVentaModal, setShowCompleteVentaModal] = useState(false)
  const [ventaToComplete, setVentaToComplete] = useState<any>(null)
  const [estadisticas, setEstadisticas] = useState({
    totalAnimales: 0,
    animalesEnVenta: 0,
    totalVacunaciones: 0,
    totalPesos: 0,
  })
  const [estadisticasCompletas, setEstadisticasCompletas] = useState<EstadisticasCompletas | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [animales, vacunaciones, pesos, compras, ventas] = await Promise.all([
        firestoreService.getAnimalesByUser(user.id),
        firestoreService.getVacunacionesByUser(user.id),
        firestoreService.getPesosByUser(user.id),
        firestoreService.getComprasEnProceso(user.id),
        firestoreService.getVentasEnProceso(user.id),
      ])

      setEstadisticas({
        totalAnimales: animales.length,
        animalesEnVenta: animales.filter((a: any) => a.en_venta && a.estado_venta !== 'vendido').length,
        totalVacunaciones: vacunaciones.length,
        totalPesos: pesos.length,
      })

      // Calcular estadísticas avanzadas
      const calcularEstadisticas = new CalcularEstadisticasUseCase()
      const capacidadMaxima = user?.rancho_hectareas ? Math.floor((user.rancho_hectareas || 0) * 0.5) : 100 // Aproximación: 0.5 animales por hectárea
      const estadisticasAvanzadas = calcularEstadisticas.execute(animales as Animal[], vacunaciones, pesos, capacidadMaxima)
      setEstadisticasCompletas(estadisticasAvanzadas)

      // Cargar información de animales para las compras
      const comprasConAnimales = await Promise.all(
        compras.map(async (compra: any) => {
          const animal = await firestoreService.getAnimal(compra.animal_id)
          return { ...compra, animal }
        })
      )
      setComprasEnProceso(comprasConAnimales)

      // Cargar información de animales para las ventas
      const ventasConAnimales = await Promise.all(
        ventas.map(async (venta: any) => {
          const animal = await firestoreService.getAnimal(venta.animal_id)
          const comprador = await firestoreService.getUsuario(venta.comprador_id)
          return { ...venta, animal, comprador }
        })
      )
      setVentasEnProceso(ventasConAnimales)
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
        {/* Accesos Rápidos */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/" inline />
          </div>
          <h2 className="text-2xl font-bold text-black mb-6">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => router.push('/dashboard/animales')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Gestión de Animales</h3>
              <p className="text-gray-700 text-sm">Registre y administre su inventario ganadero</p>
            </button>

            <button 
              onClick={() => router.push('/dashboard/vacunaciones')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Vacunaciones</h3>
              <p className="text-gray-700 text-sm">Controle el historial de vacunaciones</p>
            </button>

            <button 
              onClick={() => router.push('/dashboard/pesos')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Control de Peso</h3>
              <p className="text-gray-700 text-sm">Registre y siga el peso de sus animales</p>
            </button>

            <button 
              onClick={() => router.push('/dashboard/marketplace')}
              className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 hover:border-cownect-green hover:shadow-lg transition-all text-left"
            >
              <h3 className="text-xl font-bold text-black mb-2">Marketplace</h3>
              <p className="text-gray-700 text-sm">Compre y venda ganado</p>
            </button>
          </div>
        </div>

        {/* Panel de Estadísticas Avanzadas */}
        {estadisticasCompletas && (
          <div className="mb-6">
            <EstadisticasPanel estadisticas={estadisticasCompletas} />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-cownect-green">{estadisticas.totalAnimales}</p>
            <p className="text-gray-700 text-sm">Total Animales</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-3xl font-bold text-cownect-green">{estadisticas.animalesEnVenta}</p>
            <p className="text-gray-700 text-sm">En Venta</p>
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

        {/* Compras en Proceso */}
        {comprasEnProceso.length > 0 && (
          <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4">Compras en Proceso</h3>
            <div className="space-y-4">
              {comprasEnProceso.map((compra: any) => (
                <div key={compra.id} className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-black mb-1">
                        {compra.animal?.nombre || compra.animal?.numero_identificacion || 'Animal'}
                      </p>
                      <p className="text-gray-700 text-sm mb-1">
                        <strong>Precio:</strong> {formatPrecio(compra.precio, user?.rancho_pais)}
                      </p>
                      <p className="text-gray-700 text-sm">
                        <strong>Fecha:</strong> {new Date(compra.fecha_compra).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCompraToComplete(compra)
                          setShowConfirmModal(true)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => {
                          setCompraToCancel(compra)
                          setShowCancelModal(true)
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas en Proceso */}
        {ventasEnProceso.length > 0 && (
          <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4">Ventas en Proceso</h3>
            <div className="space-y-4">
              {ventasEnProceso.map((venta: any) => (
                <div key={venta.id} className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-black mb-1">
                        {venta.animal?.nombre || venta.animal?.numero_identificacion || 'Animal'}
                      </p>
                      <p className="text-gray-700 text-sm mb-1">
                        <strong>Comprador:</strong> {venta.comprador?.nombre && venta.comprador?.apellido 
                          ? `${venta.comprador.nombre} ${venta.comprador.apellido}` 
                          : venta.comprador?.email || 'N/A'}
                      </p>
                      <p className="text-gray-700 text-sm mb-1">
                        <strong>Precio:</strong> {formatPrecio(venta.precio, user?.rancho_pais)}
                      </p>
                      <p className="text-gray-700 text-sm">
                        <strong>Fecha:</strong> {new Date(venta.fecha_compra).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVentaToComplete(venta)
                          setShowCompleteVentaModal(true)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => {
                          setVentaToCancel(venta)
                          setShowCancelVentaModal(true)
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Compra */}
      {showConfirmModal && compraToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scaleIn relative">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowConfirmModal(false); setCompraToComplete(null) }} inline />
              <h3 className="text-2xl font-bold text-black">Confirmar Compra</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Animal:</strong> {compraToComplete.animal?.nombre || compraToComplete.animal?.numero_identificacion || 'Animal'}
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Precio:</strong> {formatPrecio(compraToComplete.precio, user?.rancho_pais)}
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Fecha:</strong> {new Date(compraToComplete.fecha_compra).toLocaleDateString('es-ES')}
              </p>
              <p className="text-gray-800 font-semibold">
                ¿Confirmar que la compra ha sido completada?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await firestoreService.completarCompra(compraToComplete.id)
                    setShowConfirmModal(false)
                    setCompraToComplete(null)
                    loadData()
                    setSuccessMessage('Compra completada exitosamente')
                    setShowSuccessModal(true)
                  } catch (error: any) {
                    setErrorMessage('Error: ' + error.message)
                    setShowErrorModal(true)
                  }
                }}
                className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setCompraToComplete(null)
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {showCancelModal && compraToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-scaleIn relative">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowCancelModal(false); setCompraToCancel(null) }} inline />
              <h3 className="text-2xl font-bold text-black">Cancelar Compra</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Animal:</strong> {compraToCancel.animal?.nombre || compraToCancel.animal?.numero_identificacion || 'Animal'}
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Precio:</strong> {formatPrecio(compraToCancel.precio, user?.rancho_pais)}
              </p>
              <p className="text-gray-800 font-semibold">
                ¿Está seguro de cancelar esta compra?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await firestoreService.cancelarCompra(compraToCancel.id)
                    setShowCancelModal(false)
                    setCompraToCancel(null)
                    loadData()
                    setSuccessMessage('Compra cancelada')
                    setShowSuccessModal(true)
                  } catch (error: any) {
                    setErrorMessage('Error: ' + error.message)
                    setShowErrorModal(true)
                  }
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-all"
              >
                Confirmar Cancelación
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCompraToCancel(null)
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Venta Completada */}
      {showCompleteVentaModal && ventaToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowCompleteVentaModal(false); setVentaToComplete(null) }} inline />
              <h3 className="text-xl font-bold text-black">Completar Venta</h3>
            </div>
            <p className="text-gray-700 mb-2"><strong>Animal:</strong> {ventaToComplete.animal?.nombre || 'N/A'}</p>
            <p className="text-gray-700 mb-4"><strong>Precio:</strong> {formatPrecio(ventaToComplete.precio, user?.rancho_pais)}</p>
            <p className="text-gray-700 mb-6">¿Confirmar venta completada?</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await firestoreService.completarCompra(ventaToComplete.id)
                    setShowCompleteVentaModal(false)
                    setVentaToComplete(null)
                    loadData()
                    setSuccessMessage('Venta completada exitosamente')
                    setShowSuccessModal(true)
                  } catch (error: any) {
                    setErrorMessage('Error: ' + error.message)
                    setShowErrorModal(true)
                  }
                }}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-green-700 transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowCompleteVentaModal(false)
                  setVentaToComplete(null)
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar Venta */}
      {showCancelVentaModal && ventaToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => { setShowCancelVentaModal(false); setVentaToCancel(null) }} inline />
              <h3 className="text-xl font-bold text-black">Cancelar Venta</h3>
            </div>
            <p className="text-gray-700 mb-2"><strong>Animal:</strong> {ventaToCancel.animal?.nombre || 'N/A'}</p>
            <p className="text-gray-700 mb-4"><strong>Precio:</strong> {formatPrecio(ventaToCancel.precio, user?.rancho_pais)}</p>
            <p className="text-gray-700 mb-6">¿Está seguro de cancelar esta venta?</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await firestoreService.cancelarCompra(ventaToCancel.id)
                    setShowCancelVentaModal(false)
                    setVentaToCancel(null)
                    loadData()
                    setSuccessMessage('Venta cancelada')
                    setShowSuccessModal(true)
                  } catch (error: any) {
                    setErrorMessage('Error: ' + error.message)
                    setShowErrorModal(true)
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-red-700 transition-all"
              >
                Confirmar Cancelación
              </button>
              <button
                onClick={() => {
                  setShowCancelVentaModal(false)
                  setVentaToCancel(null)
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

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

