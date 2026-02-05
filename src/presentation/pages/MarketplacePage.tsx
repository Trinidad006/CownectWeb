'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { firestoreService } from '@/infrastructure/services/firestoreService'
import { Animal } from '@/domain/entities/Animal'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import BackButton from '../components/ui/BackButton'
import Logo from '../components/ui/Logo'
import StarRating from '../components/ui/StarRating'
import { PAISES_MONEDAS, formatPrecio, getMonedaByPais } from '@/utils/paisesMonedas'
import Select from '../components/ui/Select'

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
      const notForSale = (data as any[]).filter((a: any) => !a.en_venta)
      setMyAnimales(notForSale)
    } catch (error) {
      console.error('Error:', error)
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
      setVendedoresComprados((prev) => new Set([...prev, animalToBuy.usuario_id]))
      setShowPurchaseModal(false)
      setAnimalToBuy(null)
      loadAnimalesForSale()
      loadMisVentas()
      alert('¡Compra simulada exitosa! Ya puedes calificar al vendedor.')
    } catch (error: any) {
      alert('Error: ' + error.message)
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
      alert('Selecciona un motivo para el reporte')
      return
    }
    setReportSaving(true)
    try {
      await firestoreService.addReporte(user.id, userToReport.id, reportMotivo, reportDetalles || undefined, userToReport.animalId)
      setShowReportModal(false)
      setUserToReport(null)
      setReportMotivo('')
      setReportDetalles('')
      alert('Reporte enviado correctamente. Gracias por ayudar a mantener la comunidad.')
    } catch (error: any) {
      alert('Error al enviar el reporte: ' + error.message)
    } finally {
      setReportSaving(false)
    }
  }

  const handleCalificar = (animal: any) => {
    if (!user?.id || animal.usuario_id === user.id) return
    setSelectedVendedor({ id: animal.usuario_id, nombre: animal.usuario?.nombre, apellido: animal.usuario?.apellido, rancho: animal.usuario?.rancho })
    setRatingStars(0)
    setShowRatingModal(true)
  }

  const handleGuardarCalificacion = async () => {
    if (!selectedVendedor?.id || !user?.id || ratingStars < 1 || ratingStars > 5) {
      alert('Selecciona entre 1 y 5 estrellas')
      return
    }
    setRatingSaving(true)
    try {
      await firestoreService.addCalificacion(selectedVendedor.id, user.id, ratingStars)
      setShowRatingModal(false)
      setSelectedVendedor(null)
      loadAnimalesForSale()
    } catch (error: any) {
      alert('Error al calificar: ' + error.message)
    } finally {
      setRatingSaving(false)
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
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <div className="flex flex-col items-center mb-6">
            <Logo />
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
                  <button
                    onClick={() => {
                      setSelectedAnimal(animal)
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
                    <span className="text-amber-600">👁 {animal.vistas ?? 0}</span> {animal.vistas === 1 ? 'persona lo ha visto' : 'personas lo han visto'}
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
          {animales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animales.map((animal: any) => (
                <div key={animal.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold text-black mb-2">{animal.nombre || 'Sin nombre'}</h4>
                  <p className="text-gray-700 mb-1"><strong>Especie:</strong> {animal.especie || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Raza:</strong> {animal.raza || 'N/A'}</p>
                  <p className="text-gray-700 mb-1"><strong>Sexo:</strong> {animal.sexo === 'M' ? 'Macho' : 'Hembra'}</p>
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
                            onClick={() => handleComprar(animal)}
                            className="w-full bg-amber-600 text-white py-2 rounded-lg font-bold hover:bg-amber-700 transition-all"
                          >
                            Compra
                          </button>
                          {vendedoresComprados.has(animal.usuario_id) && (
                            <button
                              onClick={() => handleCalificar(animal)}
                              className="text-sm text-cownect-green font-bold hover:underline"
                            >
                              Calificar vendedor
                            </button>
                          )}
                          <button
                            onClick={() => handleReportar(animal)}
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
          ) : (
            <p className="text-gray-700 text-lg">No hay animales en venta en este momento</p>
          )}
        </div>

        {showPurchaseModal && animalToBuy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-black mb-2">Compra</h3>
              <p className="text-gray-700 mb-4">
                ¿Confirmar compra simulada de <strong>{animalToBuy.nombre}</strong> por {formatPrecio(animalToBuy.precio_venta ?? 0, animalToBuy.usuario?.rancho_pais)}?
              </p>
              <p className="text-sm text-gray-600 mb-4">Esta es una compra de prueba. No se realizan transacciones reales. Podrás calificar al vendedor después.</p>
              <div className="flex gap-4">
                <button
                  onClick={confirmarCompra}
                  disabled={purchaseSaving}
                  className="flex-1 bg-cownect-green text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {purchaseSaving ? 'Procesando...' : 'Confirmar compra'}
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
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-black mb-4">Poner en Venta</h3>
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
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-black mb-2">Reportar usuario</h3>
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
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-black mb-2">Calificar vendedor</h3>
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
