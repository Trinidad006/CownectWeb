'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'
import Input from '../ui/Input'

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      // Usar directamente Supabase en el cliente
      const supabase = getSupabaseClient()

      // Registrar usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message || 'Error al registrar')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Error al crear el usuario')
        setLoading(false)
        return
      }

      // Crear perfil en la tabla usuarios si existe
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: formData.email,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
        })

      if (profileError) {
        console.error('Error al crear perfil:', profileError)
        // Continuamos aunque haya error en el perfil, el usuario ya está creado en auth
      }

      // Redirigir al login
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario')
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
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          name="nombre"
          type="text"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <Input
          label="Apellido"
          name="apellido"
          type="text"
          value={formData.apellido}
          onChange={handleChange}
          required
        />
      </div>

      <Input
        label="Correo Electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        label="Teléfono"
        name="telefono"
        type="tel"
        value={formData.telefono}
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

      <Input
        label="Confirmar Contraseña"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-base font-semibold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  )
}

