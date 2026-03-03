'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/infrastructure/config/firebase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const auth = getFirebaseAuth()
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user || !user.emailVerified) {
              if (user && !user.emailVerified) {
                await signOut(auth)
              }
              setIsAuthenticated(false)
              router.replace('/login')
            } else {
              setIsAuthenticated(true)
            }
          } catch (err) {
            console.error('Error en ProtectedRoute:', err)
            setError('Error al verificar autenticación')
            setIsAuthenticated(false)
            router.replace('/login')
          } finally {
            setLoading(false)
          }
        },
        (err) => {
          console.error('Error en onAuthStateChanged:', err)
          setError('Error al conectar con Firebase')
          setLoading(false)
          setIsAuthenticated(false)
        }
      )
      return () => unsubscribe()
    } catch (err) {
      console.error('Error al inicializar Firebase:', err)
      setError('Error al inicializar autenticación')
      setLoading(false)
      setIsAuthenticated(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <div className="text-gray-700 text-xl">Verificando autenticación...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md text-center">
          <div className="text-red-600 text-xl font-bold mb-2">Error</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => router.push('/login')}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all"
          >
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700 text-xl mb-4">Redirigiendo al login...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
