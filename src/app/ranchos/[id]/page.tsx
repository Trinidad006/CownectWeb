'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/presentation/hooks/useAuth'
import { firestoreService } from '@/infrastructure/services/firestoreService'

interface PublicProfile {
  id: string
  nombre?: string
  apellido?: string
  rancho?: string
  rancho_pais?: string
  rancho_ciudad?: string
  descripcion_publica?: string
  tipos_ganado?: string[]
}

export default function RanchProfilePage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth(false)
  const [perfil, setPerfil] = useState<PublicProfile | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const db = (await import('firebase/firestore')).getFirestore()
        const { doc, getDoc } = await import('firebase/firestore')
        const ref = doc(db, 'usuarios', params.id)
        const snap = await getDoc(ref)
        if (!mounted) return
        if (!snap.exists()) {
          setPerfil(null)
          return
        }
        const data = snap.data() as any
        if (!data.perfil_publico) {
          setPerfil(null)
          return
        }
        setPerfil({
          id: params.id,
          nombre: data.nombre,
          apellido: data.apellido,
          rancho: data.rancho,
          rancho_pais: data.rancho_pais,
          rancho_ciudad: data.rancho_ciudad,
          descripcion_publica: data.descripcion_publica,
          tipos_ganado: data.tipos_ganado || [],
        })
      } catch (error) {
        console.error('Error cargando perfil público:', error)
        setPerfil(null)
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

  if (perfil === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Este perfil no está disponible o no es público.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-black mb-2">
          {perfil.rancho || 'Rancho sin nombre'}
        </h1>
        <p className="text-gray-700 mb-1">
          Propietario: {[perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'No especificado'}
        </p>
        {(perfil.rancho_ciudad || perfil.rancho_pais) && (
          <p className="text-sm text-gray-600 mb-3">
            {perfil.rancho_ciudad && `${perfil.rancho_ciudad}, `}{perfil.rancho_pais}
          </p>
        )}
        {perfil.tipos_ganado && perfil.tipos_ganado.length > 0 && (
          <p className="text-sm text-cownect-green font-semibold mb-4">
            Tipos de ganado: {perfil.tipos_ganado.join(' • ')}
          </p>
        )}
        {perfil.descripcion_publica && (
          <p className="text-base text-gray-800 mb-6">
            {perfil.descripcion_publica}
          </p>
        )}

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <h2 className="text-xl font-bold text-black mb-2">Enviar solicitud de compra</h2>
          <p className="text-sm text-gray-600 mb-3">
            Describe qué tipo de animales o lotes te interesan, cantidades aproximadas y cualquier condición importante.
          </p>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-cownect-green"
            placeholder="Ej: Estoy interesado en 10 novillos de 350‑400 kg para engorda..."
          />
          {feedback && (
            <p className="text-sm mt-2 text-gray-700">{feedback}</p>
          )}
          <button
            onClick={handleSendRequest}
            disabled={sending}
            className="mt-4 w-full bg-black text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  )
}

