'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/infrastructure/config/supabaseClient'
import { User } from '@/domain/entities/User'

export function useAuth(redirectToLogin = true) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = getSupabaseClient()
      
      // Verificar sesión activa y válida - usar getUser() que verifica el token en el servidor
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        // No hay usuario autenticado - limpiar cualquier sesión residual
        await supabase.auth.signOut()
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        if (redirectToLogin) {
          router.replace('/login')
        }
        return
      }

      // Verificar sesión también para obtener expires_at
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session || !session.access_token) {
        await supabase.auth.signOut()
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        if (redirectToLogin) {
          router.replace('/login')
        }
        return
      }

      // Verificar que el token no haya expirado
      const expiresAt = session.expires_at
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        // Sesión expirada
        await supabase.auth.signOut()
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        if (redirectToLogin) {
          router.replace('/login')
        }
        return
      }

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()

      const userData: User = {
        id: authUser.id,
        email: authUser.email || '',
        nombre: profile?.nombre,
        apellido: profile?.apellido,
        telefono: profile?.telefono,
      }

      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
      setUser(null)
      if (redirectToLogin) {
        router.replace('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, isAuthenticated, checkAuth }
}

