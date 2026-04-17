'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithCustomToken } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'
import AuthLayout from '../components/layouts/AuthLayout'
import Input from '../components/ui/Input'
import Link from 'next/link'

function WorkerLoginForm() {
  const router = useRouter()
  const [form, setForm] = useState({ ownerEmail: '', username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorHint(null)
    setLoading(true)
    try {
      const res = await fetch('/api/trabajadores/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: form.ownerEmail.trim(),
          username: form.username.trim(),
          password: form.password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.customToken) {
        setError(data.error || 'No se pudo iniciar sesión.')
        setErrorHint(typeof data.hint === 'string' ? data.hint : null)
        return
      }
      const auth = getFirebaseAuth()
      await signInWithCustomToken(auth, data.customToken)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Correo del dueño del rancho"
        name="ownerEmail"
        type="email"
        value={form.ownerEmail}
        onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
        required
      />
      <Input
        label="Usuario de trabajador"
        name="username"
        type="text"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      {error && (
        <div className="text-sm space-y-2">
          <p className="text-red-600">{error}</p>
          {errorHint && <p className="text-xs text-gray-700 leading-relaxed">{errorHint}</p>}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Entrando…' : 'Entrar como trabajador'}
      </button>
      <p className="text-xs text-gray-600 text-center">
        ¿Eres el dueño?{' '}
        <Link href="/login" className="underline font-medium">
          Inicia sesión con tu correo
        </Link>
      </p>
    </form>
  )
}

export default function WorkerLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
      <AuthLayout
        title="Trabajador"
        subtitle="Credenciales asignadas por el dueño del rancho (plan premium)"
        footerText="¿Dueño del rancho?"
        footerLinkText="Inicio de sesión dueño"
        footerLinkHref="/login"
      >
        <WorkerLoginForm />
      </AuthLayout>
    </Suspense>
  )
}
