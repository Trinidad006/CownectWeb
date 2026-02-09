'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import StarRating from '../components/ui/StarRating'
import { PAISES_MONEDAS, formatPrecio, getMonedaByPais } from '@/utils/paisesMonedas'
import { getDriveImageUrl } from '@/utils/driveImage'
import { AnimalValidator } from '@/domain/validators/AnimalValidator'
import Select from '../components/ui/Select'
import BackButton from '../components/ui/BackButton'

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

function MarketplaceContent() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const [animales, setAnimales] = useState<any[]>([])
  const [myAnimales, setMyAnimales] = useState<Animal[]>([])
  const [misVentas, setMisVentas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMarkForSale, setShowMarkForSale] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [price, setPrice] = useState('')
  const [ranchoData, setRanchoData] = useState({
    rancho: '',
    rancho_hectareas: '',
    rancho_pais: '',
    rancho_ciudad: '',
    rancho_direccion: '',
    rancho_descripcion: '',
  })
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedVendedor, setSelectedVendedor] = useState<any>(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingSaving, setRatingSaving] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [animalToBuy, setAnimalToBuy] = useState<any>(null)
  const [purchaseSaving, setPurchaseSaving] = useState(false)
  const [vendedoresComprados, setVendedoresComprados] = useState<Set<string>>(new Set())
  const [showReportModal, setShowReportModal] = useState(false)
  const [userToReport, setUserToReport] = useState<any>(null)
  const [reportMotivo, setReportMotivo] = useState('')
  const [reportDetalles, setReportDetalles] = useState('')
  const [reportSaving, setReportSaving] = useState(false)
  const [showAnimalDetailModal, setShowAnimalDetailModal] = useState(false)
  const [selectedAnimalDetail, setSelectedAnimalDetail] = useState<any>(null)
  const [animalPesos, setAnimalPesos] = useState<any[]>([])
  const [animalVacunaciones, setAnimalVacunaciones] = useState<any[]>([])
  const [loadingAnimalDetail, setLoadingAnimalDetail] = useState(false)
  const [comprasCompletadas, setComprasCompletadas] = useState<any[]>([])
  const [calificacionesRealizadas, setCalificacionesRealizadas] = useState<Map<string, boolean>>(new Map())
  const [busquedaAnimales, setBusquedaAnimales] = useState('')
  const [showCompraExitosoModal, setShowCompraExitosoModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const REPORTE_MOTIVOS = [
    { value: 'fraude', label: 'Fraude o estafa' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'informacion_falsa', label: 'Información falsa' },
    { value: 'mal_servicio', label: 'Mal servicio o incumplimiento' },
    { value: 'otro', label: 'Otro' },
  ]

  useEffect(() => {
    fetch('/api/seed-demo', { method: 'GET' }).then(() => {
      loadAnimalesForSale()
      loadMyAnimales()
      loadMisVentas()
    })
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadVendedoresComprados()
      loadMisVentas()
      loadMyAnimales()
      loadComprasCompletadas()
    }
  }, [user?.id])

  const loadVendedoresComprados = async () => {
    if (!user?.id) return
    try {
      const set = await firestoreService.getVendedoresComprados(user.id)
      setVendedoresComprados(set)
    } catch (e) {
      console.error(e)
    }
  }

  const loadAnimalesForSale = async () => {
    try {
      const animalesData = await firestoreService.getAnimalesEnVenta()
      const conUsuariosYCalif = await Promise.all(
        animalesData.map(async (animal: any) => {
          const usuario = await firestoreService.getUsuario(animal.usuario_id)
          const calif = usuario ? await firestoreService.getCalificacionPromedio(animal.usuario_id) : { promedio: 0, total: 0 }
          return { ...animal, usuario: usuario || null, calificacion: calif }
        })
      )
      setAnimales(conUsuariosYCalif)
      conUsuariosYCalif.forEach((a: any) => {
        if (a.id && typeof window !== 'undefined') {
          const key = `vista_${a.id}`
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1')
            firestoreService.incrementarVista(a.id).catch(() => {})
          }
        }
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMyAnimales = async () => {
    if (!user?.id) return
    try {
      const data = await firestoreService.getAnimalesByUser(user.id)
      // Filtrar animales que no estén en venta y que no estén vendidos
      const notForSale = (data as any[]).filter((a: any) => !a.en_venta && a.estado_venta !== 'vendido')
      setMyAnimales(notForSale)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadComprasCompletadas = async () => {
    if (!user?.id) return
    try {
      const compras = await firestoreService.getComprasCompletadas(user.id)
      console.log('Compras completadas cargadas:', compras)
      setComprasCompletadas(compras)
      
      // Verificar qué vendedores ya fueron calificados
      const calificacionesMap = new Map<string, boolean>()
      await Promise.all(
        compras.map(async (compra: any) => {
          if (compra.vendedor?.id) {
            const yaCalificado = await firestoreService.getMiCalificacion(compra.vendedor.id, user.id)
            calificacionesMap.set(compra.vendedor.id, yaCalificado !== null)
          }
        })
      )
      setCalificacionesRealizadas(calificacionesMap)
    } catch (error) {
      console.error('Error cargando compras completadas:', error)
    }
  }

  const loadMisVentas = async () => {
    if (!user?.id) return
    try {
      const data = await firestoreService.getMisVentas(user.id)
      setMisVentas(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    if (showMarkForSale && user) {
      setRanchoData({
        rancho: user.rancho || '',
        rancho_hectareas: user.rancho_hectareas?.toString() || '',
        rancho_pais: user.rancho_pais || '',
        rancho_ciudad: user.rancho_ciudad || '',
        rancho_direccion: user.rancho_direccion || '',
        rancho_descripcion: user.rancho_descripcion || '',
      })
    } else if (!showMarkForSale) {
      setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '', rancho_descripcion: '' })
    }
  }, [showMarkForSale, user])

  // Usar el validador del dominio
  const verificarDocumentosCompletos = (animal: Animal): boolean => {
    return AnimalValidator.validarDocumentosCompletos(animal)
  }

  const handleMarkForSale = async () => {
    if (!selectedAnimal?.id || !price || !user?.id) {
      alert('Por favor ingrese un precio')
      return
    }
    if (!ranchoData.rancho.trim()) {
      alert('Por favor ingrese el nombre del rancho de origen')
      return
    }
    try {
      const { updateDoc, doc } = await import('firebase/firestore')
      const { getFirebaseDb } = await import('@/infrastructure/config/firebase')
      const db = getFirebaseDb()
      await updateDoc(doc(db, 'animales', selectedAnimal.id as string), {
        en_venta: true,
        precio_venta: parseFloat(price),
        vistas: 0,
        updated_at: new Date().toISOString(),
      })
      const info = ranchoData.rancho_pais ? getMonedaByPais(ranchoData.rancho_pais) : null
      await firestoreService.updateUsuario(user.id, {
        rancho: ranchoData.rancho.trim(),
        rancho_hectareas: ranchoData.rancho_hectareas ? parseFloat(ranchoData.rancho_hectareas) : undefined,
        rancho_pais: ranchoData.rancho_pais || undefined,
        rancho_ciudad: ranchoData.rancho_ciudad || undefined,
        rancho_direccion: ranchoData.rancho_direccion || undefined,
        rancho_descripcion: ranchoData.rancho_descripcion || undefined,
        moneda: info?.moneda,
      })
      await checkAuth()
      setShowMarkForSale(false)
      setSelectedAnimal(null)
      setPrice('')
      setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '', rancho_descripcion: '' })
      loadAnimalesForSale()
      loadMyAnimales()
      loadMisVentas()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleComprar = (animal: any) => {
    setAnimalToBuy(animal)
    setShowPurchaseModal(true)
  }

  const confirmarCompra = async () => {
    if (!animalToBuy?.id || !user?.id) return
    setPurchaseSaving(true)
    try {
      await firestoreService.comprarAnimal(animalToBuy.id, user.id)
      setShowPurchaseModal(false)
      setAnimalToBuy(null)
      loadAnimalesForSale()
      loadMisVentas()
      setShowCompraExitosoModal(true)
    } catch (error: any) {
      setErrorMessage('Error: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setPurchaseSaving(false)
    }
  }

  const handleReportar = (animal: any) => {
    if (!animal.usuario || animal.usuario_id === user?.id) return
    setUserToReport({ id: animal.usuario_id, nombre: animal.usuario.nombre, apellido: animal.usuario.apellido, animalId: animal.id })
    setReportMotivo('')
    setReportDetalles('')
    setShowReportModal(true)
  }

  const confirmarReporte = async () => {
    if (!userToReport?.id || !user?.id || !reportMotivo.trim()) {
      setErrorMessage('Selecciona un motivo para el reporte')
      setShowErrorModal(true)
      return
    }
    setReportSaving(true)
    try {
      await firestoreService.addReporte(user.id, userToReport.id, reportMotivo, reportDetalles || undefined, userToReport.animalId)
      setShowReportModal(false)
      setUserToReport(null)
      setReportMotivo('')
      setReportDetalles('')
      setSuccessMessage('Reporte enviado correctamente. Gracias por ayudar a mantener la comunidad.')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error al enviar el reporte: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setReportSaving(false)
    }
  }

  const handleCalificar = (animalOrCompra: any) => {
    if (!user?.id) return
    const vendedorId = animalOrCompra.usuario_id || animalOrCompra.vendedor?.id
    if (vendedorId === user.id) return
    
    const vendedor = animalOrCompra.usuario || animalOrCompra.vendedor
    setSelectedVendedor({ id: vendedorId, nombre: vendedor?.nombre, apellido: vendedor?.apellido, rancho: vendedor?.rancho })
    setRatingStars(0)
    setShowRatingModal(true)
  }

  const handleGuardarCalificacion = async () => {
    if (!selectedVendedor?.id || !user?.id || ratingStars < 1 || ratingStars > 5) {
      setErrorMessage('Selecciona entre 1 y 5 estrellas')
      setShowErrorModal(true)
      return
    }
    setRatingSaving(true)
    try {
      await firestoreService.addCalificacion(selectedVendedor.id, user.id, ratingStars)
      setShowRatingModal(false)
      setSelectedVendedor(null)
      loadAnimalesForSale()
      loadComprasCompletadas()
      loadVendedoresComprados()
      setSuccessMessage('Calificación guardada exitosamente')
      setShowSuccessModal(true)
    } catch (error: any) {
      setErrorMessage('Error al calificar: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setRatingSaving(false)
    }
  }

  const handleVerDetalleAnimal = async (animal: any) => {
    setSelectedAnimalDetail(animal)
    setShowAnimalDetailModal(true)
    setLoadingAnimalDetail(true)
    setAnimalPesos([])
    setAnimalVacunaciones([])
    
    try {
      // Cargar historial de pesos y vacunaciones del animal
      const [pesos, vacunaciones] = await Promise.all([
        firestoreService.getPesosByAnimal(animal.id).catch(() => []),
        firestoreService.getVacunacionesByAnimal(animal.id).catch(() => []),
      ])
      
      setAnimalPesos(Array.isArray(pesos) ? pesos : [])
      setAnimalVacunaciones(Array.isArray(vacunaciones) ? vacunaciones : [])
    } catch (error) {
      console.error('Error cargando detalles:', error)
      setAnimalPesos([])
      setAnimalVacunaciones([])
    } finally {
      setLoadingAnimalDetail(false)
    }
  }

  // Filtrar animales según búsqueda con useMemo para optimizar
  const animalesFiltrados = useMemo(() => {
    if (!busquedaAnimales.trim()) {
      return animales
    }
    
    const busquedaLower = busquedaAnimales.toLowerCase().trim()
    return animales.filter((animal: any) => {
      const nombre = (animal.nombre || '').toLowerCase()
      const especie = (animal.especie || '').toLowerCase()
      const raza = (animal.raza || '').toLowerCase()
      const numeroId = (animal.numero_identificacion || '').toLowerCase()
      const rancho = (animal.usuario?.rancho || '').toLowerCase()
      const ciudad = (animal.usuario?.rancho_ciudad || '').toLowerCase()
      const pais = (PAISES_MONEDAS.find(p => p.codigo === animal.usuario?.rancho_pais)?.nombre || '').toLowerCase()
      const vendedor = `${animal.usuario?.nombre || ''} ${animal.usuario?.apellido || ''}`.toLowerCase()
      const precio = (animal.precio_venta?.toString() || '').toLowerCase()
      
      return (
        nombre.includes(busquedaLower) ||
        especie.includes(busquedaLower) ||
        raza.includes(busquedaLower) ||
        numeroId.includes(busquedaLower) ||
        rancho.includes(busquedaLower) ||
        ciudad.includes(busquedaLower) ||
        pais.includes(busquedaLower) ||
        vendedor.includes(busquedaLower) ||
        precio.includes(busquedaLower)
      )
    })
  }, [animales, busquedaAnimales])

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="text-white text-xl relative z-10">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative animate-pageEnter" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-contentFadeIn">
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/dashboard" inline />
          </div>
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mt-4 mb-2">Cownect</h1>
            <h2 className="text-2xl font-bold text-black mb-4">Marketplace Ganadero</h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-black mb-4">Mis Animales Disponibles para Venta</h3>
          {myAnimales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAnimales.map((animal: any) => (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  
                  {/* Indicador de documentos */}
                  {verificarDocumentosCompletos(animal) ? (
                    <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                      <p className="text-green-700 font-semibold text-sm">
                        Documentos Listos
                      </p>
                    </div>
                  ) : (
                    <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                      <p className="text-green-700 font-semibold text-sm">
                        Documentación en Proceso
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedAnimal(animal)
                      setRanchoData({
                        rancho: user?.rancho || '',
                        rancho_hectareas: user?.rancho_hectareas?.toString() || '',
                        rancho_pais: user?.rancho_pais || '',
                        rancho_ciudad: user?.rancho_ciudad || '',
                        rancho_direccion: user?.rancho_direccion || '',
                        rancho_descripcion: user?.rancho_descripcion || '',
                      })
                      setShowMarkForSale(true)
                    }}
                    className="w-full mt-4 bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                  >
                    Poner en Venta
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-lg">No tienes animales disponibles para vender</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-black mb-4">Historial de Compras</h3>
          <p className="text-gray-600 mb-4">Animales que has comprado y puedes calificar al vendedor</p>
          {comprasCompletadas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comprasCompletadas.map((compra: any) => (
                <div key={compra.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  {compra.animal && (
                    <>
                      <h4 className="text-xl font-bold text-black mb-2">{compra.animal.nombre || 'Sin nombre'}</h4>
                      <p className="text-gray-700 mb-1"><strong>Especie:</strong> {compra.animal.especie || 'N/A'}</p>
                      <p className="text-gray-700 mb-1"><strong>Raza:</strong> {compra.animal.raza || 'N/A'}</p>
                      <p className="text-2xl font-bold text-cownect-green mb-2">
                        {formatPrecio(compra.precio ?? 0, compra.vendedor?.rancho_pais)}
                      </p>
                      {compra.vendedor && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <p className="text-gray-700 mb-1"><strong>Vendedor:</strong> {compra.vendedor.nombre} {compra.vendedor.apellido}</p>
                          <div className="mb-2">
                            <StarRating promedio={compra.vendedor.calificacion?.promedio ?? 0} total={compra.vendedor.calificacion?.total ?? 0} />
                          </div>
                          {!calificacionesRealizadas.get(compra.vendedor.id) && (
                            <button
                              onClick={() => handleCalificar({ usuario_id: compra.vendedor.id, usuario: compra.vendedor })}
                              className="w-full mt-2 bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                            >
                              Calificar Vendedor
                            </button>
                          )}
                          {calificacionesRealizadas.get(compra.vendedor.id) && (
                            <p className="text-sm text-gray-600 mt-2 text-center">Ya calificaste a este vendedor</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-lg">No has completado ninguna compra aún</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <h3 className="text-2xl font-bold text-black mb-4">Mis ventas en curso</h3>
          <p className="text-gray-600 mb-4">Lo que tienes publicado en venta y cuántas personas lo han visto</p>
          {misVentas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {misVentas.map((animal: any) => (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  <p className="text-2xl font-bold text-cownect-green mb-2">{formatPrecio(animal.precio_venta ?? 0, user?.rancho_pais)}</p>
                  <p className="text-gray-700 font-semibold">
                    <span className="text-cownect-green">👁 {animal.vistas ?? 0}</span> {animal.vistas === 1 ? 'persona lo ha visto' : 'personas lo han visto'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-lg">No tienes animales en venta publicados</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-black mb-4">Animales en Venta</h3>
          
          {/* Buscador */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nombre, especie, raza, ubicación, vendedor..."
              value={busquedaAnimales}
              onChange={(e) => setBusquedaAnimales(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green transition-all"
            />
          </div>
          
          {animalesFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animalesFiltrados.map((animal: any) => (
                <div 
                  key={animal.id} 
                  className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleVerDetalleAnimal(animal)}
                >
                  {animal.foto && (
                    <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={getDriveImageUrl(animal.foto) || animal.foto}
                        alt={animal.nombre || 'Animal'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                  
                  {/* Etiqueta de Estado/Etapa Productiva (excluyendo Vaca Seca, Vaca Ordeña, Muerto y Robado) */}
                  {animal.estado && 
                   animal.estado !== 'Vaca Seca' && 
                   animal.estado !== 'Vaca Ordeña' && 
                   animal.estado !== 'Muerto' && 
                   animal.estado !== 'Robado' && (
                    <div className="mb-2">
                      <div className={`inline-block rounded-lg px-3 py-1.5 border-2 ${
                        animal.estado === 'Cría' || animal.estado === 'Becerro' || animal.estado === 'Becerra'
                          ? 'bg-blue-50 border-blue-400'
                          : animal.estado === 'Destetado' || animal.estado === 'Novillo'
                          ? 'bg-purple-50 border-purple-400'
                          : animal.estado === 'Toro de Engorda' || animal.estado === 'Toro Reproductor'
                          ? 'bg-orange-50 border-orange-400'
                          : animal.estado === 'Activo'
                          ? 'bg-gray-50 border-gray-400'
                          : animal.estado === 'Muerto'
                          ? 'bg-red-50 border-red-400'
                          : animal.estado === 'Robado'
                          ? 'bg-red-100 border-red-500'
                          : 'bg-gray-50 border-gray-400'
                      }`}>
                        <p className={`font-bold text-sm ${
                          animal.estado === 'Cría' || animal.estado === 'Becerro' || animal.estado === 'Becerra'
                            ? 'text-blue-700'
                            : animal.estado === 'Destetado' || animal.estado === 'Novillo'
                            ? 'text-purple-700'
                            : animal.estado === 'Toro de Engorda' || animal.estado === 'Toro Reproductor'
                            ? 'text-orange-700'
                            : animal.estado === 'Activo'
                            ? 'text-gray-700'
                            : animal.estado === 'Muerto'
                            ? 'text-red-700'
                            : animal.estado === 'Robado'
                            ? 'text-red-800'
                            : 'text-gray-700'
                        }`}>
                          {animal.estado}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicador de documentos */}
                  {verificarDocumentosCompletos(animal) ? (
                    <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                      <p className="text-green-700 font-semibold text-sm">
                        Documentos Listos
                      </p>
                    </div>
                  ) : (
                    <div className="mb-2 bg-green-50 border border-green-400 rounded-lg px-3 py-2">
                      <p className="text-green-700 font-semibold text-sm">
                        Documentación en Proceso
                      </p>
                    </div>
                  )}
                  
                  <p className="text-2xl font-bold text-cownect-green mb-2">
                    {formatPrecio(animal.precio_venta ?? 0, animal.usuario?.rancho_pais)}
                  </p>
                  {animal.usuario && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-gray-700 mb-1"><strong>Rancho:</strong> {animal.usuario.rancho || 'No especificado'}</p>
                      {(animal.usuario.rancho_ciudad || animal.usuario.rancho_pais) && (
                        <p className="text-gray-700 mb-1"><strong>Ubicación:</strong> {[animal.usuario.rancho_ciudad, PAISES_MONEDAS.find(p => p.codigo === animal.usuario.rancho_pais)?.nombre].filter(Boolean).join(', ') || 'N/A'}</p>
                      )}
                      {animal.usuario.rancho_hectareas && (
                        <p className="text-gray-700 mb-1"><strong>Hectáreas:</strong> {animal.usuario.rancho_hectareas}</p>
                      )}
                      <div className="mb-2">
                        <StarRating promedio={animal.calificacion?.promedio ?? 0} total={animal.calificacion?.total ?? 0} />
                      </div>
                      <p className="text-gray-700 mb-1"><strong>Vendedor:</strong> {animal.usuario.nombre} {animal.usuario.apellido}</p>
                      <p className="text-gray-700 mb-1"><strong>Teléfono:</strong> {animal.usuario.telefono || 'N/A'}</p>
                      <p className="text-gray-700 mb-2"><strong>Email:</strong> {animal.usuario.email || 'N/A'}</p>
                      {user?.id && animal.usuario_id !== user.id && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleComprar(animal)
                            }}
                            className="w-full bg-cownect-green text-white py-2 rounded-lg font-bold hover:bg-cownect-dark-green transition-all"
                          >
                            Compra
                          </button>
                          {vendedoresComprados.has(animal.usuario_id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCalificar(animal)
                              }}
                              className="text-sm text-cownect-green font-bold hover:underline"
                            >
                              Calificar vendedor
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReportar(animal)
                            }}
                            className="text-sm text-red-600 font-bold hover:underline text-left"
                          >
                            Reportar usuario
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : busquedaAnimales.trim() ? (
            <p className="text-gray-700 text-lg text-center py-8">
              No se encontraron animales que coincidan con "{busquedaAnimales}"
            </p>
          ) : (
            <p className="text-gray-700 text-lg text-center py-8">No hay animales en venta disponibles</p>
          )}
        </div>

        {showPurchaseModal && animalToBuy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
              <div className="flex items-center gap-3 mb-4">
                <BackButton onClick={() => { setShowPurchaseModal(false); setAnimalToBuy(null) }} inline />
                <h3 className="text-2xl font-bold text-black">Compra con PayPal</h3>
              </div>
              <p className="text-gray-700 mb-2">
                <strong>{animalToBuy.nombre}</strong>
              </p>
              <p className="text-lg font-bold text-cownect-green mb-4">
                {formatPrecio(animalToBuy.precio_venta ?? 0, animalToBuy.usuario?.rancho_pais)}
              </p>
              {paypalClientId ? (
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: getMonedaByPais(animalToBuy.usuario?.rancho_pais)?.moneda || 'USD' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={async () => {
                      const currency = getMonedaByPais(animalToBuy.usuario?.rancho_pais)?.moneda || 'USD'
                      const amount = Number(animalToBuy.precio_venta) || 0
                      const res = await fetch('/api/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount,
                          currency,
                          animalId: animalToBuy.id,
                          compradorId: user?.id,
                        }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Error al crear orden')
                      return data.orderID
                    }}
                    onApprove={async (data) => {
                      setPurchaseSaving(true)
                      try {
                        const res = await fetch('/api/paypal/capture-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderID: data.orderID }),
                        })
                        const result = await res.json()
                        if (!res.ok) throw new Error(result.error || 'Error al procesar el pago')
                        setShowPurchaseModal(false)
                        setAnimalToBuy(null)
                        loadAnimalesForSale()
                        loadMisVentas()
                        setShowCompraExitosoModal(true)
                      } catch (err: any) {
                        setErrorMessage(err?.message || 'Error al procesar el pago')
                        setShowErrorModal(true)
                      } finally {
                        setPurchaseSaving(false)
                      }
                    }}
                    onError={(err) => {
                      setErrorMessage(err?.message || 'Error con PayPal')
                      setShowErrorModal(true)
                    }}
                  />
                </PayPalScriptProvider>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded mb-4">
                  PayPal no configurado. Añade NEXT_PUBLIC_PAYPAL_CLIENT_ID en .env.local para pagar con PayPal.
                </p>
              )}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={confirmarCompra}
                  disabled={purchaseSaving}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all disabled:opacity-50 text-sm"
                >
                  {purchaseSaving ? 'Procesando...' : 'Continuar sin PayPal (prueba)'}
                </button>
                <button
                  onClick={() => { setShowPurchaseModal(false); setAnimalToBuy(null) }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showMarkForSale && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
              <div className="flex items-center gap-3 mb-4">
                <BackButton
                  onClick={() => {
                    setShowMarkForSale(false)
                    setSelectedAnimal(null)
                    setPrice('')
                    setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '', rancho_descripcion: '' })
                  }}
                  inline
                />
                <h3 className="text-2xl font-bold text-black">Poner en Venta</h3>
              </div>
              <p className="text-gray-700 mb-4"><strong>Animal:</strong> {selectedAnimal.nombre || 'Sin nombre'}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Nombre del Rancho *</label>
                  <input
                    type="text"
                    value={ranchoData.rancho}
                    onChange={(e) => setRanchoData({ ...ranchoData, rancho: e.target.value })}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    placeholder="Ej: Rancho La Esperanza"
                    required
                  />
                </div>
                <Select
                  label="País"
                  name="rancho_pais"
                  value={ranchoData.rancho_pais}
                  onChange={(e) => setRanchoData({ ...ranchoData, rancho_pais: e.target.value })}
                  options={PAISES_MONEDAS.map((p) => ({ value: p.codigo, label: `${p.nombre} (${p.moneda})` }))}
                  placeholder="Seleccione país"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Ciudad/Región</label>
                    <input
                      type="text"
                      value={ranchoData.rancho_ciudad}
                      onChange={(e) => setRanchoData({ ...ranchoData, rancho_ciudad: e.target.value })}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      placeholder="Ej: Villavicencio"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-black mb-2">Hectáreas</label>
                    <input
                      type="number"
                      value={ranchoData.rancho_hectareas}
                      onChange={(e) => setRanchoData({ ...ranchoData, rancho_hectareas: e.target.value })}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                      placeholder="Ej: 150"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Precio</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    placeholder="Ej: 1000000"
                  />
                  <p className="text-sm text-gray-600 mt-1">Moneda según país seleccionado</p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleMarkForSale}
                  className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowMarkForSale(false)
                    setSelectedAnimal(null)
                    setPrice('')
                    setRanchoData({ rancho: '', rancho_hectareas: '', rancho_pais: '', rancho_ciudad: '', rancho_direccion: '', rancho_descripcion: '' })
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showReportModal && userToReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
              <div className="flex items-center gap-3 mb-4">
                <BackButton onClick={() => { setShowReportModal(false); setUserToReport(null); setReportMotivo(''); setReportDetalles('') }} inline />
                <h3 className="text-2xl font-bold text-black">Reportar usuario</h3>
              </div>
              <p className="text-gray-700 mb-4">Reportando a: <strong>{userToReport.nombre} {userToReport.apellido}</strong></p>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-base font-bold text-black mb-2">Motivo del reporte *</label>
                  <select
                    value={reportMotivo}
                    onChange={(e) => setReportMotivo(e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                  >
                    <option value="">Selecciona un motivo</option>
                    {REPORTE_MOTIVOS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">Detalles (opcional)</label>
                  <textarea
                    value={reportDetalles}
                    onChange={(e) => setReportDetalles(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
                    placeholder="Describe el motivo del reporte..."
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={confirmarReporte}
                  disabled={!reportMotivo.trim() || reportSaving}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {reportSaving ? 'Enviando...' : 'Enviar reporte'}
                </button>
                <button
                  onClick={() => { setShowReportModal(false); setUserToReport(null); setReportMotivo(''); setReportDetalles('') }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showRatingModal && selectedVendedor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
              <div className="flex items-center gap-3 mb-4">
                <BackButton onClick={() => { setShowRatingModal(false); setSelectedVendedor(null) }} inline />
                <h3 className="text-2xl font-bold text-black">Calificar vendedor</h3>
              </div>
              <p className="text-gray-700 mb-1">{selectedVendedor.nombre} {selectedVendedor.apellido}</p>
              {selectedVendedor.rancho && <p className="text-gray-600 mb-4 text-sm">Rancho: {selectedVendedor.rancho}</p>}
              <div className="mb-4">
                <label className="block text-base font-bold text-black mb-2">Selecciona de 1 a 5 estrellas</label>
                <StarRating editable value={ratingStars} onChange={setRatingStars} promedio={0} />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleGuardarCalificacion}
                  disabled={ratingStars < 1 || ratingSaving}
                  className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {ratingSaving ? 'Guardando...' : 'Guardar calificación'}
                </button>
                <button
                  onClick={() => { setShowRatingModal(false); setSelectedVendedor(null) }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalle del Animal */}
        {showAnimalDetailModal && selectedAnimalDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn relative">
              <div className="flex items-center gap-3 mb-6">
                <BackButton
                  onClick={() => {
                    setShowAnimalDetailModal(false)
                    setSelectedAnimalDetail(null)
                    setAnimalPesos([])
                    setAnimalVacunaciones([])
                  }}
                  inline
                />
                <h3 className="text-2xl font-bold text-black">Información del Animal</h3>
              </div>

              {loadingAnimalDetail ? (
                <p className="text-center text-gray-600">Cargando información...</p>
              ) : (
                <>
                  {/* Datos del Animal */}
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-black mb-4">Datos del Animal</h4>
                    {selectedAnimalDetail.foto && (
                      <div className="mb-4 flex justify-center">
                        <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={getDriveImageUrl(selectedAnimalDetail.foto) || selectedAnimalDetail.foto}
                            alt={selectedAnimalDetail.nombre || 'Animal'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-700 mb-1"><strong>Nombre:</strong> {selectedAnimalDetail.nombre || 'N/A'}</p>
                        <p className="text-gray-700 mb-1"><strong>Número de Identificación:</strong> {selectedAnimalDetail.numero_identificacion || 'N/A'}</p>
                        <p className="text-gray-700 mb-1"><strong>Especie:</strong> {selectedAnimalDetail.especie || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-700 mb-1"><strong>Raza:</strong> {selectedAnimalDetail.raza || 'N/A'}</p>
                        <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {selectedAnimalDetail.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
                        
                        {/* Etiqueta de Estado/Etapa Productiva (excluyendo Vaca Seca, Vaca Ordeña, Muerto y Robado) */}
                        {selectedAnimalDetail.estado && 
                         selectedAnimalDetail.estado !== 'Vaca Seca' && 
                         selectedAnimalDetail.estado !== 'Vaca Ordeña' && 
                         selectedAnimalDetail.estado !== 'Muerto' && 
                         selectedAnimalDetail.estado !== 'Robado' && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-1">Estado / Etapa Productiva</p>
                            <div className={`inline-block rounded-lg px-3 py-1.5 border-2 ${
                              selectedAnimalDetail.estado === 'Cría' || selectedAnimalDetail.estado === 'Becerro' || selectedAnimalDetail.estado === 'Becerra'
                                ? 'bg-blue-50 border-blue-400'
                                : selectedAnimalDetail.estado === 'Destetado' || selectedAnimalDetail.estado === 'Novillo'
                                ? 'bg-purple-50 border-purple-400'
                                : selectedAnimalDetail.estado === 'Toro de Engorda' || selectedAnimalDetail.estado === 'Toro Reproductor'
                                ? 'bg-orange-50 border-orange-400'
                                : selectedAnimalDetail.estado === 'Activo'
                                ? 'bg-gray-50 border-gray-400'
                                : selectedAnimalDetail.estado === 'Muerto'
                                ? 'bg-red-50 border-red-400'
                                : selectedAnimalDetail.estado === 'Robado'
                                ? 'bg-red-100 border-red-500'
                                : 'bg-gray-50 border-gray-400'
                            }`}>
                              <p className={`font-bold text-sm ${
                                selectedAnimalDetail.estado === 'Cría' || selectedAnimalDetail.estado === 'Becerro' || selectedAnimalDetail.estado === 'Becerra'
                                  ? 'text-blue-700'
                                  : selectedAnimalDetail.estado === 'Destetado' || selectedAnimalDetail.estado === 'Novillo'
                                  ? 'text-purple-700'
                                  : selectedAnimalDetail.estado === 'Toro de Engorda' || selectedAnimalDetail.estado === 'Toro Reproductor'
                                  ? 'text-orange-700'
                                  : selectedAnimalDetail.estado === 'Activo'
                                  ? 'text-gray-700'
                                  : selectedAnimalDetail.estado === 'Muerto'
                                  ? 'text-red-700'
                                  : selectedAnimalDetail.estado === 'Robado'
                                  ? 'text-red-800'
                                  : 'text-gray-700'
                              }`}>
                                {selectedAnimalDetail.estado}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedAnimalDetail.fecha_nacimiento && (
                          <p className="text-gray-700 mb-1"><strong>Fecha de Nacimiento:</strong> {new Date(selectedAnimalDetail.fecha_nacimiento).toLocaleDateString('es-ES')}</p>
                        )}
                      </div>
                    </div>
                    {selectedAnimalDetail.en_venta && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-400 rounded-lg">
                        <p className="text-lg font-bold text-green-700">
                          Precio: {formatPrecio(selectedAnimalDetail.precio_venta ?? 0, selectedAnimalDetail.usuario?.rancho_pais)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Historial de Pesos */}
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-black mb-4">Historial de Pesos</h4>
                    {animalPesos && animalPesos.length > 0 ? (
                      <div className="space-y-3">
                        {animalPesos.map((peso: any, index: number) => {
                          if (!peso || !peso.peso || !peso.fecha_registro) return null
                          
                          const pesoAnterior = index < animalPesos.length - 1 ? animalPesos[index + 1] : null
                          const diferencia = pesoAnterior && pesoAnterior.peso
                            ? parseFloat(peso.peso) - parseFloat(pesoAnterior.peso)
                            : null
                          
                          return (
                            <div
                              key={peso.id || index}
                              className="bg-white rounded-lg p-4 border-l-4 border-l-cownect-green border border-gray-200"
                              style={{ borderLeftWidth: '4px' }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-lg font-bold text-black mb-1">
                                    {parseFloat(peso.peso || 0).toLocaleString('es-ES')} kg
                                  </p>
                                  <p className="text-gray-600 text-sm mb-1">
                                    {new Date(peso.fecha_registro).toLocaleDateString('es-ES', { 
                                      day: 'numeric', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                  {peso.observaciones && (
                                    <p className="text-gray-700 text-sm"><strong>Observaciones:</strong> {peso.observaciones}</p>
                                  )}
                                </div>
                                {diferencia !== null && diferencia !== 0 && (
                                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    diferencia > 0 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {diferencia > 0 ? '+' : ''}{diferencia.toFixed(1)} kg
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        Sin historial disponible
                      </p>
                    )}
                  </div>

                  {/* Historial de Vacunaciones */}
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-black mb-4">Historial de Vacunaciones</h4>
                    {animalVacunaciones && animalVacunaciones.length > 0 ? (
                      <div className="space-y-3">
                        {animalVacunaciones.map((vac: any) => {
                          if (!vac || !vac.tipo_vacuna || !vac.fecha_aplicacion) return null
                          
                          return (
                            <div
                              key={vac.id}
                              className="bg-white rounded-lg p-4 border-l-4 border-l-blue-500 border border-gray-200"
                              style={{ borderLeftWidth: '4px' }}
                            >
                              <p className="text-lg font-bold text-black mb-1">{vac.tipo_vacuna}</p>
                              <p className="text-gray-600 text-sm mb-1">
                                <strong>Fecha de Aplicación:</strong> {new Date(vac.fecha_aplicacion).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                              {vac.proxima_dosis && (
                                <p className="text-gray-600 text-sm mb-1">
                                  <strong>Próxima Dosis:</strong> {new Date(vac.proxima_dosis).toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              )}
                              {vac.observaciones && (
                                <p className="text-gray-700 text-sm"><strong>Observaciones:</strong> {vac.observaciones}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        Sin historial disponible
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowAnimalDetailModal(false)
                      setSelectedAnimalDetail(null)
                      setAnimalPesos([])
                      setAnimalVacunaciones([])
                    }}
                    className="w-full bg-cownect-green text-white py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal de Compra Exitosa */}
        {showCompraExitosoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', zIndex: 9999 }}>
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-scaleIn relative" style={{ zIndex: 10000 }}>
              <div className="flex items-center gap-3 mb-4">
                <BackButton onClick={() => { setShowCompraExitosoModal(false); router.push('/marketplace') }} inline />
                <h3 className="text-xl font-bold text-black">Compra Iniciada</h3>
              </div>
              <p className="text-gray-700 mb-6">¡Compra iniciada! Revisa tu dashboard para completar la transacción.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCompraExitosoModal(false)
                    router.push('/dashboard')
                  }}
                  className="flex-1 bg-cownect-green text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-opacity-90 transition-all"
                >
                  Ir al Dashboard
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
                  onClick={() => { setShowErrorModal(false); setErrorMessage('') }}
                  className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-lg font-bold text-base hover:bg-gray-500 transition-all"
                >
                  Cerrar
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
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <MarketplaceContent />
    </ProtectedRoute>
  )
}
