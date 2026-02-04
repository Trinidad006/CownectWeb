'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyAuth()
  }, [])

  const verifyAuth = async () => {
    try {
      console.log('Verificando autenticación...')
      const supabase = getSupabaseClient()
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Sesión obtenida:', { session: !!session, error: sessionError })
      
      if (sessionError || !session || !session.access_token) {
        console.log('No hay sesión válida, redirigiendo a login')
        setIsAuthenticated(false)
        setLoading(false)
        router.replace('/login')
        return
      }

      // Verificar que el usuario existe
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.log('No hay usuario válido, redirigiendo a login')
        setIsAuthenticated(false)
        setLoading(false)
        router.replace('/login')
        return
      }

      console.log('Autenticación exitosa')
      setIsAuthenticated(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Auth error:', error)
      setIsAuthenticated(false)
      setLoading(false)
      router.replace('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative flex items-center justify-center" style={{ backgroundImage: 'url(/images/fondo_verde.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="text-white text-xl relative z-10">Verificando autenticación...</div>
      </div>
    )
  }

  // NO renderizar nada si no está autenticado
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

