'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardHeader from '../components/layouts/DashboardHeader'
import BackButton from '../components/ui/BackButton'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'

type TrabajadorRow = { id: string; username: string; activo: boolean; created_at: string | null }

function TrabajadoresContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth(false)
  const [lista, setLista] = useState<TrabajadorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [nuevoUsuario, setNuevoUsuario] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [creando, setCreando] = useState(false)

  const isPremium = user?.plan === 'premium' || user?.suscripcion_activa

  const cargar = async () => {
    if (!user?.id || user.es_sesion_trabajador) return
    setError(null)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sesión no válida')
      const res = await fetch('/api/trabajadores', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setLista(data.trabajadores || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
      setLista([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.es_sesion_trabajador) {
      router.replace('/dashboard')
      return
    }
    if (!isPremium) {
      router.replace('/choose-plan')
      return
    }
    cargar()
  }, [user, authLoading, isPremium, router])

  const crearTrabajador = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreando(true)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sesión no válida')
      const res = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: nuevoUsuario.trim(), password: nuevaPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo crear')
      setSuccess(`Trabajador «${data.username}» creado. Comunica las credenciales de forma segura.`)
      setNuevoUsuario('')
      setNuevaPassword('')
      await cargar()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreando(false)
    }
  }

  const toggleActivo = async (row: TrabajadorRow) => {
    setError(null)
    setSuccess(null)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sesión no válida')
      const res = await fetch(`/api/trabajadores/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !row.activo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setSuccess(row.activo ? 'Acceso desactivado.' : 'Acceso reactivado.')
      await cargar()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  const setupDefault = async () => {
    setError(null)
    setSuccess(null)
    try {
      const auth = getFirebaseAuth()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sesión no válida')
      const res = await fetch('/api/trabajadores/setup-default', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setSuccess(data.created ? 'Creado usuario «usuario» con contraseña «12345».' : (data.message as string))
      await cargar()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
      <div className="absolute inset-0 bg-black/50" />
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <div className="bg-white/95 rounded-xl shadow-xl p-8 border border-white/30">
          <div className="flex items-center gap-3 mb-6">
            <BackButton href="/dashboard" inline />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Trabajadores del rancho</h1>
          <p className="text-gray-600 text-sm mb-6">
            Crea usuarios y contraseñas para tu equipo. Ellos entran en «Trabajador» desde la pantalla de sesión o en{' '}
            <span className="font-mono text-xs">/worker-login</span>. No pueden editar datos existentes; solo ver y agregar registros.
          </p>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">{success}</div>}

          <button
            type="button"
            onClick={setupDefault}
            className="mb-8 text-sm text-blue-700 underline"
          >
            Crear acceso predeterminado (usuario / 12345) si aún no tienes trabajadores
          </button>

          <h2 className="text-lg font-bold text-black mb-3">Alta de trabajador</h2>
          <form onSubmit={crearTrabajador} className="space-y-4 mb-10">
            <Input
              label="Usuario (login del trabajador)"
              name="nuevoUsuario"
              type="text"
              value={nuevoUsuario}
              onChange={(e) => setNuevoUsuario(e.target.value)}
              required
            />
            <Input
              label="Contraseña inicial"
              name="nuevaPassword"
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={creando}
              className="w-full bg-black text-white py-3 rounded-lg font-bold disabled:opacity-50"
            >
              {creando ? 'Guardando…' : 'Crear trabajador'}
            </button>
          </form>

          <h2 className="text-lg font-bold text-black mb-3">Listado</h2>
          {lista.length === 0 ? (
            <p className="text-gray-600 text-sm">No hay trabajadores registrados.</p>
          ) : (
            <ul className="space-y-2">
              {lista.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-black">{t.username}</p>
                    <p className="text-xs text-gray-500">
                      {t.activo ? 'Activo' : 'Desactivado'}
                      {t.created_at && ` · Alta ${new Date(t.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActivo(t)}
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      t.activo ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-900'
                    }`}
                  >
                    {t.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrabajadoresPage() {
  return (
    <ProtectedRoute>
      <TrabajadoresContent />
    </ProtectedRoute>
  )
}
