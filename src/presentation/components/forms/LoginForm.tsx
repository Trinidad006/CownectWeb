'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'
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
    if (searchParams.get('registered') === 'true') {
      setSuccess('Registro exitoso. Por favor inicia sesión.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      console.log('Iniciando sesión con:', formData.email)
      const supabase = getSupabaseClient()
      
      // Verificar que el cliente se creó correctamente
      if (!supabase) {
        throw new Error('No se pudo conectar a Supabase. Verifique la configuración.')
      }

      console.log('Cliente Supabase creado, intentando login...')
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      console.log('Respuesta de login:', { 
        hasUser: !!authData?.user, 
        hasSession: !!authData?.session,
        error: authError 
      })

      if (authError) {
        console.error('Error de autenticación completo:', JSON.stringify(authError, null, 2))
        
        // Mensajes de error más específicos
        let errorMessage = 'Error al iniciar sesión'
        if (authError.message) {
          if (authError.message.includes('Invalid login credentials')) {
            errorMessage = 'Credenciales incorrectas. Verifique su email y contraseña.'
          } else if (authError.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor confirme su email antes de iniciar sesión.'
          } else {
            errorMessage = authError.message
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (!authData?.user) {
        console.error('No se obtuvo usuario en la respuesta')
        setError('Error al iniciar sesión. No se pudo obtener el usuario.')
        setLoading(false)
        return
      }

      if (!authData?.session) {
        console.error('No se obtuvo sesión en la respuesta')
        setError('Error al iniciar sesión. No se pudo crear la sesión.')
        setLoading(false)
        return
      }

      console.log('Login exitoso! Usuario:', authData.user.email)
      console.log('Sesión creada, redirigiendo...')
      
      // Esperar un momento para asegurar que la sesión se guarde
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Redirigir al dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Error en login:', err)
      setError(err.message || 'Error al iniciar sesión. Verifique su conexión a internet.')
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

