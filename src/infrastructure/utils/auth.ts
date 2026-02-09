import { getFirebaseAuth, getFirebaseDb } from '../config/firebase'
import { doc, getDoc } from 'firebase/firestore'

const USUARIOS_COLLECTION = 'usuarios'

export async function checkAuthentication(): Promise<{ isAuthenticated: boolean; userId: string | null }> {
  try {
    const auth = getFirebaseAuth()
    const user = auth.currentUser
    if (!user) {
      return { isAuthenticated: false, userId: null }
    }
    return { isAuthenticated: true, userId: user.uid }
  } catch (error) {
    return { isAuthenticated: false, userId: null }
  }
}

export async function getCurrentUser(): Promise<{
  id: string
  email: string
  nombre?: string
  apellido?: string
  telefono?: string
  rancho?: string
  rancho_hectareas?: number
  rancho_pais?: string
  rancho_ciudad?: string
  rancho_direccion?: string
  rancho_descripcion?: string
  moneda?: string
  plan?: 'gratuito' | 'premium'
  suscripcion_activa?: boolean
} | null> {
  try {
    const auth = getFirebaseAuth()
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return null

    const db = getFirebaseDb()
    const profileSnap = await getDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid))
    const profile = profileSnap.data()

    return {
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
  } catch (error) {
    return null
  }
}
