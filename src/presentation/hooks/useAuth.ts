'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/infrastructure/config/firebase'
import { User } from '@/domain/entities/User'

const USUARIOS_COLLECTION = 'usuarios'

export function useAuth(redirectToLogin = true) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        if (redirectToLogin) {
          router.replace('/login')
        }
        return
      }

      if (!firebaseUser.emailVerified) {
        await signOut(auth)
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        if (redirectToLogin) {
          router.replace('/login')
        }
        return
      }

      try {
        const db = getFirebaseDb()
        const profileSnap = await getDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid))
        const profile = profileSnap.data()

        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          nombre: profile?.nombre,
          apellido: profile?.apellido,
          telefono: profile?.telefono,
          rancho: profile?.rancho,
          rancho_hectareas: profile?.rancho_hectareas,
          rancho_pais: profile?.rancho_pais,
          rancho_ciudad: profile?.rancho_ciudad,
          rancho_direccion: profile?.rancho_direccion,
          rancho_descripcion: profile?.rancho_descripcion,
          moneda: profile?.moneda,
          plan: profile?.plan || 'gratuito',
          suscripcion_activa: profile?.suscripcion_activa || false,
        }

        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error loading profile:', error)
        setIsAuthenticated(false)
        setUser(null)
        if (redirectToLogin) {
          router.replace('/login')
        }
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [redirectToLogin, router])

  const checkAuth = async () => {
    const auth = getFirebaseAuth()
    const firebaseUser = auth.currentUser
    if (!firebaseUser || !firebaseUser.emailVerified) {
      if (firebaseUser && !firebaseUser.emailVerified) {
        await signOut(auth)
      }
      setUser(null)
      setIsAuthenticated(false)
      if (redirectToLogin) router.replace('/login')
      return
    }
    const db = getFirebaseDb()
    const profileSnap = await getDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid))
    const profile = profileSnap.data()
    setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      nombre: profile?.nombre,
      apellido: profile?.apellido,
      telefono: profile?.telefono,
      rancho: profile?.rancho,
      rancho_hectareas: profile?.rancho_hectareas,
      rancho_pais: profile?.rancho_pais,
      rancho_ciudad: profile?.rancho_ciudad,
      rancho_direccion: profile?.rancho_direccion,
      rancho_descripcion: profile?.rancho_descripcion,
      moneda: profile?.moneda,
      plan: profile?.plan || 'gratuito',
      suscripcion_activa: profile?.suscripcion_activa || false,
    })
    setIsAuthenticated(true)
  }

  return { user, loading, isAuthenticated, checkAuth }
}
