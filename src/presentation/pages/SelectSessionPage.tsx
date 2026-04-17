'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'

function SelectSessionContent() {
  const router = useRouter()
  const { user, loading } = useAuth(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgHint, setMsgHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isPremium = user?.plan === 'premium' || user?.suscripcion_activa

  useEffect(() => {
    if (loading || !user) return
    if (!isPremium) {
      router.replace('/dashboard')
    }
  }, [loading, user, isPremium, router])

  const irDueño = () => {
    router.push('/dashboard')
  }

  const irTrabajador = async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
    router.push('/worker-login')
  }

  const crearTrabajadorPredeterminado = async () => {
    setMsg(null)
    setMsgHint(null)
    setBusy(true)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u) {
        setMsg('No hay sesión de dueño activa.')
        return
      }
      const token = await u.getIdToken()
      const res = await fetch('/api/trabajadores/setup-default', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(data.error || 'No se pudo crear el trabajador predeterminado.')
        return
      }
      setMsg(
        data.created
          ? 'Listo: usuario «usuario», contraseña «12345». Podrás cambiar credenciales en la siguiente fase del panel.'
          : (data.message as string) || 'Sin cambios.'
      )
    } catch {
      setMsg('Error de red.')
    } finally {
      setBusy(false)
    }
  }

  if (loading || !user || !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Elegir sesión</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Cuenta premium. Accede como dueño del rancho o cierra sesión e inicia como trabajador con las credenciales que definió el dueño.
          </p>
        </div>
        <div className="grid gap-4">
          <button
            type="button"
            onClick={irDueño}
            className="w-full py-4 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition"
          >
            Dueño de rancho
          </button>
          <button
            type="button"
            onClick={irTrabajador}
            className="w-full py-4 px-4 rounded-lg border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-50 transition"
          >
            Trabajador
          </button>
        </div>
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-gray-500 text-center">
            Primera vez con trabajadores: crea el acceso predeterminado (usuario <strong>usuario</strong>, contraseña{' '}
            <strong>12345</strong>) si aún no tienes ninguno.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={crearTrabajadorPredeterminado}
            className="w-full py-2 text-sm text-blue-700 underline disabled:opacity-50"
          >
            {busy ? 'Procesando…' : 'Crear trabajador predeterminado'}
          </button>
          {msg && (
            <div className="text-sm text-center text-gray-700 space-y-2">
              <p>{msg}</p>
              {msgHint && <p className="text-xs text-gray-600 leading-relaxed">{msgHint}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SelectSessionPage() {
  return (
    <ProtectedRoute>
      <SelectSessionContent />
    </ProtectedRoute>
  )
}
