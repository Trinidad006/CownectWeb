'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Check,
  X,
  Leaf,
  Zap,
  ChevronRight,
  CreditCard,
} from 'lucide-react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useAuth } from '../../hooks/useAuth'

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const SUBSCRIPTION_PRICE = Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE) || 9.99

export default function PlansSection() {
  const router = useRouter()
  const { user, checkAuth } = useAuth(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionSaving, setSubscriptionSaving] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)

  const handleChooseFree = () => {
    router.push('/download-app')
  }

  const handleSubscriptionSuccess = async () => {
    setShowSubscriptionModal(false)
    setSubscriptionSaving(false)
    await checkAuth?.()
    router.push('/download-app')
  }

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl overflow-hidden p-2 mb-6">
            <Image
              src="/images/logo_front.jpeg"
              alt="Cownect Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">Elige tu plan</h1>
          <p className="text-xl text-gray-700">
            Selecciona el plan que mejor se adapte a las necesidades de tu explotación ganadera
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Plan Gratuito */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Leaf className="h-6 w-6 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-black">Plan Gratuito</h2>
            </div>
            <p className="text-3xl font-bold text-black mb-2">$0<span className="text-lg font-normal text-gray-500">/mes</span></p>
            <p className="text-gray-600 mb-6">Ideal para comenzar a gestionar tu ganado</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Registro de animales (vacuno)
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Control de vacunaciones
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Registro de pesos
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <X className="h-5 w-5 flex-shrink-0" />
                Marketplace (compra y venta)
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <X className="h-5 w-5 flex-shrink-0" />
                Pago con PayPal integrado
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <X className="h-5 w-5 flex-shrink-0" />
                Publicar animales en venta
              </li>
            </ul>
            <button
              onClick={handleChooseFree}
              className="w-full bg-gray-800 text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border-2 border-gray-800"
            >
              Continuar con plan gratuito
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Plan Premium */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-cownect-green relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cownect-green text-white px-4 py-1 rounded-full text-sm font-bold">
              Recomendado
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-cownect-green/20 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-cownect-green" />
              </div>
              <h2 className="text-2xl font-bold text-black">Plan Premium</h2>
            </div>
            <p className="text-3xl font-bold text-cownect-green mb-2">
              ${SUBSCRIPTION_PRICE}<span className="text-lg font-normal text-gray-500">/mes</span>
            </p>
            <p className="text-gray-600 mb-6">Acceso completo a todas las funcionalidades</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Todo lo del plan gratuito
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <strong>Marketplace:</strong> Compra y vende animales
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Pago seguro con PayPal integrado
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Publica tus animales en venta
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Más almacenamiento para fotos y documentos
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Gestiona compras y ventas desde el panel
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                Soporte prioritario
              </li>
            </ul>
            <button
              onClick={() => {
                if (!user?.id) {
                  router.push('/login')
                  return
                }
                setShowSubscriptionModal(true)
              }}
              className="w-full bg-cownect-green text-white py-4 rounded-xl text-lg font-bold hover:bg-cownect-dark-green transition-all flex items-center justify-center gap-2 border-2 border-cownect-green"
            >
              <CreditCard className="h-5 w-5" />
              Contratar suscripción
            </button>
          </div>
        </div>
      </div>

      {/* Modal de suscripción con PayPal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Contratar Plan Premium</h3>
                <button
                  onClick={() => {
                    setShowSubscriptionModal(false)
                    setSubscriptionError(null)
                  }}
                  className="text-gray-500 hover:text-black text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-black mb-3">¿Por qué suscribirse?</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cownect-green" />
                    <strong>Marketplace:</strong> Compra y vende ganado de forma segura
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-cownect-green" />
                    Pagos seguros con PayPal (tarjeta o cuenta PayPal)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cownect-green" />
                    Protección en tus transacciones
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cownect-green" />
                    Acceso completo a todas las funciones de Cownect
                  </li>
                </ul>
              </div>

              <p className="text-xl font-bold text-cownect-green mb-4">
                ${SUBSCRIPTION_PRICE} USD / mes
              </p>

              {subscriptionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {subscriptionError}
                </div>
              )}

              {paypalClientId ? (
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', locale: 'es_ES' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={async () => {
                      if (!user?.id) {
                        router.push('/login')
                        throw new Error('Debes iniciar sesión para contratar el plan')
                      }
                      const res = await fetch('/api/paypal/create-subscription-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Error al crear orden')
                      return data.orderID
                    }}
                    onApprove={async (data) => {
                      setSubscriptionSaving(true)
                      setSubscriptionError(null)
                      try {
                        const res = await fetch('/api/paypal/capture-subscription-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderID: data.orderID }),
                        })
                        const result = await res.json()
                        if (!res.ok) throw new Error(result.error || 'Error al procesar el pago')
                        handleSubscriptionSuccess()
                      } catch (err) {
                        setSubscriptionError(err instanceof Error ? err.message : 'Error al procesar el pago')
                      } finally {
                        setSubscriptionSaving(false)
                      }
                    }}
                    onError={(err) => {
                      setSubscriptionError(err instanceof Error ? err.message : 'Error con PayPal')
                    }}
                  />
                </PayPalScriptProvider>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                  PayPal no configurado. Añade NEXT_PUBLIC_PAYPAL_CLIENT_ID en .env.local
                </div>
              )}

              {subscriptionSaving && (
                <p className="text-center text-gray-600 mt-4">Procesando pago...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

