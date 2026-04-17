'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/infrastructure/config/firebase'
import Input from '../ui/Input'
import Link from 'next/link'

const INSTRUCCIONES_VERIFICACION = (
  <>
    <strong>Instrucciones:</strong>
    <ul className="list-disc list-inside mt-2 text-left space-y-1 text-sm">
      <li>Revisa tu <strong>bandeja de entrada</strong> del correo con el que te registraste.</li>
      <li>Revisa también la carpeta de <strong>Correo no deseado / Spam</strong>; el correo suele llegar ahí.</li>
      <li>Haz clic en el <strong>enlace del correo</strong> para activar tu cuenta.</li>
      <li>Si no llega en unos minutos, usa el botón «Reenviar correo de verificación» (usa el mismo email y contraseña).</li>
    </ul>
  </>
)

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [showUnverifiedBlock, setShowUnverifiedBlock] = useState(false)

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

  const handleResendVerification = async () => {
    if (!formData.email.trim() || !formData.password) {
      setError('Escribe tu correo y contraseña para reenviar el correo de verificación.')
      return
    }
    setError(null)
    setSuccess(null)
    setResendLoading(true)
    try {
      const auth = getFirebaseAuth()
      const { user } = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      )
      if (user.emailVerified) {
        setSuccess('Tu correo ya está verificado. Puedes iniciar sesión.')
        setShowUnverifiedBlock(false)
        await signOut(auth)
        setResendLoading(false)
        return
      }
      await sendEmailVerification(user, {
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/login?registered=verify`,
        handleCodeInApp: false,
      })
      await signOut(auth)
      setSuccess('Se ha reenviado el correo de verificación. Revisa tu bandeja de entrada y la carpeta de spam.')
      setShowUnverifiedBlock(false)
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos 5 minutos antes de intentar reenviar el correo de verificación.')
      } else {
        setError(err?.message || 'No se pudo reenviar el correo. Comprueba tu email y contraseña.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setShowUnverifiedBlock(false)
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
        setShowUnverifiedBlock(true)
        setError('Debes verificar tu correo electrónico antes de iniciar sesión.')
        return
      }

      const db = getFirebaseDb()
      const profileSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      const profile = profileSnap.data()
      const isPremium = profile?.plan === 'premium' || profile?.suscripcion_activa

      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.href = isPremium ? '/select-session' : '/choose-plan'
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

  const trimmedEmail = formData.email.trim()
  const isEmailInvalid = trimmedEmail.length > 0 && !trimmedEmail.includes('@')

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
          {showUnverifiedBlock && (
            <div className="mt-4 pt-4 border-t border-red-300 text-gray-800 font-normal">
              {INSTRUCCIONES_VERIFICACION}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-4 w-full bg-cownect-green text-white py-3 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50"
              >
                {resendLoading ? 'Enviando...' : 'Reenviar correo de verificación'}
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-2 border-green-400 text-green-800 px-4 py-3 rounded-lg text-base font-semibold">
          <p>{success}</p>
          {searchParams.get('registered') === 'verify' && (
            <div className="mt-4 pt-4 border-t border-green-300 text-green-800 font-normal text-sm">
              {INSTRUCCIONES_VERIFICACION}
              <p className="mt-2">¿No te llegó el correo? Escribe tu email y contraseña arriba y usa el botón de abajo.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-3 w-full bg-cownect-green text-white py-3 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50"
              >
                {resendLoading ? 'Enviando...' : 'Reenviar correo de verificación'}
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || isEmailInvalid}
        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Iniciando sesión...' : 'Ingresar'}
      </button>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-400">o</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <Link
        href="/worker-login"
        className="block w-full bg-white text-cownect-green border-2 border-cownect-green py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-all duration-200 text-center"
      >
        Ingresar como trabajador
      </Link>
    </form>
  )
}
