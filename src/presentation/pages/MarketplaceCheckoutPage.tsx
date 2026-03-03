'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import { Check, CheckCircle2, CreditCard, Star, Wallet } from 'lucide-react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import type { CartItem } from '@/domain/entities/MarketplaceCart'
import { firestoreService } from '@/infrastructure/services/firestoreService'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

type StoredCart = {
  items?: CartItem[]
  total?: number
}

type MetodoPago = 'paypal' | 'debito'

function CheckoutContent() {
  const router = useRouter()
  const { user } = useAuth(false)

  const [total, setTotal] = useState(0)
  const [metodo, setMetodo] = useState<MetodoPago>('paypal')
  const [pagoExitoso, setPagoExitoso] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [orderId, setOrderId] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [vendorPostalCode, setVendorPostalCode] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [enviandoReview, setEnviandoReview] = useState(false)
  const [reviewGuardada, setReviewGuardada] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [postalCode, setPostalCode] = useState('')
  const [freightEstimate, setFreightEstimate] = useState<number | null>(null)
  const [freightDistanceKm, setFreightDistanceKm] = useState<number | null>(null)
  const [freightError, setFreightError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('cownect_marketplace_cart')
      if (!raw) return
      const parsed: StoredCart = JSON.parse(raw)
      setTotal(parsed.total ?? 0)
      if (Array.isArray(parsed.items)) {
        setItems(parsed.items as CartItem[])
        const firstWithVendor = (parsed.items as CartItem[]).find(
          (i) => i.lote?.vendedorId || i.lote?.vendedorNombre
        )
        if (firstWithVendor?.lote?.vendedorId) {
          setVendorId(firstWithVendor.lote.vendedorId)
        }
        if (firstWithVendor?.lote?.vendedorNombre) {
          setVendorName(firstWithVendor.lote.vendedorNombre)
        }
        if (firstWithVendor?.lote?.vendorPostalCode) {
          setVendorPostalCode(firstWithVendor.lote.vendorPostalCode)
        }
      }
    } catch {
      setTotal(0)
    }
  }, [])

  if (!user) return null

  const registrarCompra = async (metodoPago: MetodoPago): Promise<string | undefined> => {
    if (!user?.id || total <= 0 || items.length === 0) return undefined
    try {
      const compraId = await firestoreService.registrarCompraMarketplace({
        compradorId: user.id,
        metodo: metodoPago,
        totalUsd: total,
        items: items.map((item) => ({
          tipo: item.tipo,
          loteId: item.lote?.id,
          ganadoId: item.ganado?.id,
          precioUsd: item.precioUsd,
          cantidad: item.cantidad,
          vendedorId: item.lote?.vendedorId,
          vendedorNombre: item.lote?.vendedorNombre,
        })),
      })
      return compraId
    } catch (error) {
      // No bloqueamos el flujo si falla el registro; solo lo registramos en consola
      console.error('Error registrando compra de marketplace:', error)
      return undefined
    }
  }

  const handlePagoTarjetaDemo = async (event: React.FormEvent) => {
    event.preventDefault()
    const compraId = await registrarCompra('debito')
    if (compraId) setOrderId(compraId)
    setPagoExitoso(true)
  }

  const calcularFlete = () => {
    setFreightError(null)
    setFreightEstimate(null)
    setFreightDistanceKm(null)

    if (!postalCode.trim()) {
      setFreightError('Ingresa tu código postal para estimar el flete.')
      return
    }

    const cpDestino = postalCode.trim()
    const cpOrigen = vendorPostalCode?.trim()

    if (!/^[0-9]{5}$/.test(cpDestino)) {
      setFreightError('El código postal debe tener exactamente 5 dígitos numéricos.')
      return
    }
    if (!cpOrigen || !/^[0-9]{5}$/.test(cpOrigen)) {
      setFreightError('No se pudo determinar un código postal válido para el rancho vendedor.')
      return
    }

    const numDestino = Number(cpDestino)
    const numOrigen = Number(cpOrigen)
    if (numDestino < 1000 || numDestino > 99999) {
      setFreightError('El código postal no parece pertenecer a un rango válido en México.')
      return
    }

    const prefixDestino = cpDestino.slice(0, 2)
    const prefixOrigen = cpOrigen.slice(0, 2)

    const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
      '97': { lat: 20.97, lng: -89.62 }, // Mérida y alrededores
      '24': { lat: 18.61, lng: -90.75 }, // Campeche / Escárcega aprox
      '06': { lat: 19.43, lng: -99.13 }, // CDMX centro aproximado
      '37': { lat: 20.67, lng: -103.35 }, // Guadalajara
      '64': { lat: 25.68, lng: -100.31 }, // Monterrey
    }

    const origenCoords = REGION_COORDS[prefixOrigen]
    const destinoCoords = REGION_COORDS[prefixDestino]

    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371
      const toRad = (deg: number) => (deg * Math.PI) / 180
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    let distanceKm: number
    if (origenCoords && destinoCoords) {
      distanceKm = haversineKm(origenCoords.lat, origenCoords.lng, destinoCoords.lat, destinoCoords.lng)
    } else {
      const diff = Math.abs(numDestino - numOrigen)
      distanceKm = diff / 10
    }

    distanceKm = Math.min(1800, Math.max(15, distanceKm || 0))
    const estimate = Math.round(2200 + distanceKm * 10)

    setFreightDistanceKm(distanceKm)
    setFreightEstimate(estimate)
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <BackButton href="/dashboard/marketplace" inline />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Finalizar compra
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <p className="text-sm text-gray-500 mb-1">Total de tu carrito</p>
          <p className="text-4xl font-extrabold text-black mb-6">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Elige tu método de pago</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setMetodo('debito')}
              className={`group flex items-center gap-3 p-4 rounded-full border-2 text-left transition-all ${
                metodo === 'debito'
                  ? 'border-cownect-green bg-cownect-green/5 shadow-sm'
                  : 'border-gray-200 hover:border-cownect-green/60 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-cownect-green text-white flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Tarjeta de débito</p>
                <p className="text-xs text-gray-600">Pago con tarjeta física o digital (demo).</p>
              </div>
              {metodo === 'debito' && <Check className="h-4 w-4 text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={() => setMetodo('paypal')}
              className={`group flex items-center gap-3 p-4 rounded-full border-2 text-left transition-all ${
                metodo === 'paypal'
                  ? 'border-cownect-green bg-cownect-green/5 shadow-sm'
                  : 'border-gray-200 hover:border-cownect-green/60 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#ffc439] text-black flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">PayPal</p>
                <p className="text-xs text-gray-600">Pago seguro con tu cuenta PayPal.</p>
              </div>
              {metodo === 'paypal' && <Check className="h-4 w-4 text-emerald-600" />}
            </button>
          </div>

          {/* Calculadora de flete */}
          <div className="mt-2 mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-800 mb-1">Calcula tu flete estimado</p>
            <p className="text-[11px] text-gray-600 mb-2">
              Ingresa tu código postal para estimar el costo aproximado de traslado desde el rancho del vendedor.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-1">
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Código postal de destino"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cownect-green/60"
              />
              <button
                type="button"
                onClick={calcularFlete}
                className="px-3 py-2 rounded-xl bg-white border border-cownect-green text-cownect-green text-xs font-semibold hover:bg-cownect-green/5"
              >
                Calcular flete
              </button>
            </div>
            {freightError && (
              <p className="text-[11px] text-red-600 mt-1">{freightError}</p>
            )}
            {freightEstimate != null && (
              <p className="text-[11px] text-gray-700 mt-1">
                Estimado de traslado:{' '}
                <span className="font-semibold">
                  ${freightEstimate.toLocaleString('es-MX')} MXN
                </span>
                {freightDistanceKm != null && (
                  <> · distancia aproximada {Math.round(freightDistanceKm)} km</>
                )}
                . Este cálculo es solo una referencia, el costo real puede variar según la empresa de transporte.
              </p>
            )}
          </div>

          {metodo === 'debito' && (
            <form onSubmit={handlePagoTarjetaDemo} className="space-y-4 mt-2">
              <p className="text-xs text-gray-600">
                Este es un formulario de demostración para ilustrar el flujo de pago con tarjeta.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre en la tarjeta</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cownect-green/60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de tarjeta</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cownect-green/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vencimiento</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cownect-green/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cownect-green/60"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 bg-cownect-green text-white py-3 rounded-xl font-bold hover:bg-cownect-dark-green transition-colors text-sm"
              >
                <CreditCard className="h-5 w-5" />
                Pagar con tarjeta (demo)
              </button>
            </form>
          )}

          {metodo === 'paypal' && (
            <div className="mt-2">
              {PAYPAL_CLIENT_ID ? (
                <PayPalScriptProvider
                  options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', locale: 'es_ES' }}
                >
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    disabled={total <= 0}
                    createOrder={async () => {
                      const res = await fetch('/api/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount: total,
                          currency: 'USD',
                          animalId: 'marketplace',
                          compradorId: user.id,
                        }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Error al crear orden')
                      return data.orderID
                    }}
                    onApprove={async (data) => {
                      const res = await fetch('/api/paypal/capture-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderID: data.orderID }),
                      })
                      const result = await res.json()
                      if (!res.ok) throw new Error(result.error || 'Error al capturar')
                      const compraId = await registrarCompra('paypal')
                      if (compraId) setOrderId(compraId)
                      setPagoExitoso(true)
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', err)
                    }}
                  />
                </PayPalScriptProvider>
              ) : (
                <p className="text-amber-700 bg-amber-50 px-4 py-3 rounded-lg text-xs">
                  Configura <span className="font-mono">NEXT_PUBLIC_PAYPAL_CLIENT_ID</span> en{' '}
                  <span className="font-mono">.env.local</span> para habilitar pagos con PayPal.
                </p>
              )}
            </div>
          )}

          <p className="mt-6 text-[11px] text-gray-500">
            Cownect Marketplace es una herramienta para conectar ganaderos. Asegúrate de revisar siempre la
            documentación sanitaria y acuerdos de compraventa con el vendedor. Cownect no participa como intermediario
            financiero ni se hace responsable por fraudes, estafas, incumplimientos de pago o disputas entre compradores
            y vendedores.
          </p>
        </div>

        {pagoExitoso && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Pago registrado correctamente. Gracias por usar Cownect Marketplace.
              </p>
            </div>

            {vendorId && orderId && !reviewGuardada && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Califica tu experiencia con {vendorName ?? 'el vendedor'}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Tu opinión ayuda a otros ganaderos a comprar con más confianza.
                </p>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const filled = (hoverRating ?? rating) >= value
                    return (
                      <button
                        key={value}
                        type="button"
                        className="p-1"
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(value)}
                        aria-label={`${value} estrellas`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe un comentario sobre el ganado, la atención o la entrega..."
                  className="w-full min-h-[80px] text-sm px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cownect-green/60 mb-3"
                />

                {reviewError && (
                  <p className="text-xs text-red-600 mb-2">
                    {reviewError}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setReviewError(null)
                      if (!rating) {
                        setReviewError('Selecciona una calificación de 1 a 5 estrellas.')
                        return
                      }
                      if (!user?.id || !vendorId || !orderId) return
                      try {
                        setEnviandoReview(true)
                        await firestoreService.crearResenaVendedor({
                          buyerId: user.id,
                          vendorId,
                          orderId,
                          rating,
                          comment: comment.trim(),
                        })
                        setReviewGuardada(true)
                      } catch (err: any) {
                        setReviewError(
                          err?.message || 'No se pudo guardar tu reseña. Inténtalo de nuevo más tarde.'
                        )
                      } finally {
                        setEnviandoReview(false)
                      }
                    }}
                    disabled={enviandoReview}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-cownect-green text-white hover:bg-cownect-dark-green disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enviandoReview ? 'Enviando...' : 'Enviar reseña'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Omitir y volver al panel
                  </button>
                </div>
              </div>
            )}

            {reviewGuardada && (
              <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="text-sm text-emerald-800">
                  <p className="font-semibold mb-1">Gracias por tu reseña.</p>
                  <p>Tu calificación ayudará a otros ganaderos a confiar más en vendedores responsables.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="mt-3 inline-flex items-center text-xs text-emerald-800 hover:text-emerald-900 underline"
                  >
                    Volver al panel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketplaceCheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  )
}

