'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/infrastructure/config/firebase'
import Input from '../ui/Input'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const registered = searchParams.get('registered')
    const reset = searchParams.get('reset')
    
    if (registered === 'verify') {
      setSuccess('Cuenta creada. Revisa tu correo y haz clic en el enlace de verificación para activar tu cuenta. Luego inicia sesión.')
    } else if (registered === 'true') {
      setSuccess('Registro exitoso. Por favor inicia sesión.')
    } else if (reset === 'success') {
      setSuccess('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const auth = getFirebaseAuth()
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      )

      if (!firebaseUser.emailVerified) {
        await signOut(auth)
        setError('Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y la carpeta de spam.')
        return
      }

      const db = getFirebaseDb()
      const profileSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      const profile = profileSnap.data()
      const isPremium = profile?.plan === 'premium' || profile?.suscripcion_activa

      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.href = isPremium ? '/dashboard' : '/choose-plan'
    } catch (err: any) {
      let errorMessage = 'Error al iniciar sesión. Verifique su conexión.'
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        errorMessage = 'Credenciales incorrectas. Verifique su email y contraseña.'
      } else if (err?.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2 w-5 h-5" />
          <span className="text-base font-semibold text-black">Recordarme</span>
        </label>
        <Link href="/forgot-password" className="text-base text-cownect-green font-bold hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-base font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg text-base font-semibold">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}
