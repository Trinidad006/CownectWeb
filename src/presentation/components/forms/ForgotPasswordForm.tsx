'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'
import Input from '../ui/Input'
import Link from 'next/link'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const authRepository = new FirebaseAuthRepository()

  // Validación de formato de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validación frontend antes de enviar
    const trimmedEmail = email.trim()
    
    if (!trimmedEmail) {
      setError('Por favor ingresa tu correo electrónico.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Por favor ingresa un correo electrónico válido.')
      return
    }

    setLoading(true)

    try {
      const result = await authRepository.sendPasswordResetEmail(trimmedEmail)
      
      if (result.success) {
        setSuccess('Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.')
        setEmail('')
      } else {
        setError(result.error || 'Error al enviar el correo de recuperación.')
      }
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el correo de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <p className="text-gray-700 text-base text-center">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />

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
        {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
      </button>

      <div className="text-center mt-4">
        <Link href="/login" className="text-base text-cownect-green font-bold hover:underline">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </form>
  )
}

