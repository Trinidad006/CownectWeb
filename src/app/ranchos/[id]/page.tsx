'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/presentation/hooks/useAuth'
import { getDriveImageUrl } from '@/utils/driveImage'
import BackButton from '@/presentation/components/ui/BackButton'

interface PublicProfile {
  id: string
  nombre?: string
  apellido?: string
  rancho?: string
  rancho_pais?: string
  rancho_ciudad?: string
  descripcion_publica?: string
  tipos_ganado?: string[]
  perfil_publico?: boolean
}

interface AnimalEnVenta {
  id: string
  nombre?: string
  numero_identificacion?: string
  especie?: string
  raza?: string
  sexo?: string
  estado?: string
  foto?: string
}

export default function RanchProfilePage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth(false)
  const [perfil, setPerfil] = useState<PublicProfile | null>(null)
  const [animalesEnVenta, setAnimalesEnVenta] = useState<AnimalEnVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setFeedback(null)
        const res = await fetch(`/api/ranchos/${params.id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error((data as any)?.error || 'No se pudo cargar este rancho.')
        }
        if (!mounted) return
        setPerfil((data as any)?.perfil || null)
        setAnimalesEnVenta(Array.isArray((data as any)?.animalesEnVenta) ? (data as any).animalesEnVenta : [])
      } catch (error) {
        console.error('Error cargando perfil del rancho:', error)
        setPerfil(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [params.id])

  const handleSendRequest = async () => {
    if (!user?.id || !perfil?.id || !mensaje.trim()) {
      setFeedback('Debes iniciar sesión y escribir un mensaje.')
      return
    }
    setSending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/buy-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.id,
          toUserId: perfil.id,
          mensajeInicial: mensaje.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo enviar la solicitud')
      }
      setMensaje('')
      setFeedback('Solicitud enviada. Podrás verla en tu bandeja de solicitudes.')
    } catch (error: any) {
      console.error('Error creando buy request:', error)
      setFeedback(error.message || 'Error al enviar la solicitud')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Cargando rancho...</p>
      </div>
    )
  }

  if (perfil === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Este perfil no está disponible.</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-4">
          <BackButton href="/ranchos" inline />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{perfil.rancho || 'Rancho sin nombre'}</h1>
          <p className="text-gray-700">
            <span className="font-semibold">Propietario:</span>{' '}
            {[perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'No especificado'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {perfil.perfil_publico
              ? 'Perfil público activo: se muestran datos adicionales.'
              : 'Perfil privado: se muestra información general y animales en venta.'}
          </p>
        </div>

        {perfil.perfil_publico && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
            {perfil.tipos_ganado && perfil.tipos_ganado.length > 0 && (
              <p className="text-sm text-cownect-green font-semibold mb-2">
                Tipos de ganado: {perfil.tipos_ganado.join(' • ')}
              </p>
            )}
            {perfil.descripcion_publica && (
              <p className="text-sm text-gray-700">{perfil.descripcion_publica}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Animales en venta</h2>
          {animalesEnVenta.length === 0 ? (
            <p className="text-gray-600">Sin animales disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {animalesEnVenta.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    {a.foto ? (
                      <img
                        src={getDriveImageUrl(a.foto)}
                        alt={a.numero_identificacion || a.nombre || 'Animal'}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200" />
                    )}
                    <div>
                      <p className="font-bold text-gray-900">{a.numero_identificacion || 'Sin arete'}</p>
                      <p className="text-sm text-gray-600">{a.nombre || 'Sin nombre'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    {a.especie || 'Especie N/D'} {a.raza ? `• ${a.raza}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.sexo ? `Sexo: ${a.sexo}` : 'Sexo N/D'} {a.estado ? `• Estado: ${a.estado}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-black mb-2">Enviar solicitud de compra</h2>
          <p className="text-sm text-gray-600 mb-3">
            Escribe un mensaje breve sobre qué buscas comprar.
          </p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
            placeholder="Ej: Busco novillas para reproducción."
          />
          {feedback && <p className="text-sm mt-2 text-gray-700">{feedback}</p>}
          <button
            onClick={handleSendRequest}
            disabled={sending}
            className="mt-4 w-full bg-cownect-dark-green text-white py-3 rounded-lg font-bold text-base hover:opacity-90 transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}

