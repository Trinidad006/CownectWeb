import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb, getLanguageCodeByCountry } from '../config/firebase'
import { AuthRepository, RegisterData, LoginData } from '@/domain/repositories/AuthRepository'
import { User } from '@/domain/entities/User'

const USUARIOS_COLLECTION = 'usuarios'

export class FirebaseAuthRepository implements AuthRepository {
  async register(data: RegisterData): Promise<{ user: User | null; error: string | null }> {
    try {
      // Determinar idioma según el país
      const languageCode = data.rancho_pais 
        ? getLanguageCodeByCountry(data.rancho_pais)
        : 'es' // Por defecto español
      
      const auth = getFirebaseAuth(languageCode)
      const db = getFirebaseDb()

      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      const profile = {
        email: data.email,
        plan: 'gratuito',
        suscripcion_activa: false,
        nombre: data.nombre ?? null,
        apellido: data.apellido ?? null,
        telefono: data.telefono ?? null,
        rancho: data.rancho ?? null,
        rancho_hectareas: data.rancho_hectareas ?? null,
        rancho_pais: data.rancho_pais ?? null,
        rancho_ciudad: data.rancho_ciudad ?? null,
        rancho_direccion: data.rancho_direccion ?? null,
        rancho_descripcion: data.rancho_descripcion ?? null,
        moneda: data.moneda ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await setDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid), profile)

      // Asegurar que el idioma esté configurado antes de enviar el correo
      auth.languageCode = languageCode
      // Solo enviar email de verificación si estamos en el cliente (tiene window)
      if (typeof window !== 'undefined') {
        await sendEmailVerification(firebaseUser, {
          url: `${window.location.origin}/login?registered=verify`,
          handleCodeInApp: false,
        })
      } else {
        // En el servidor, enviar sin URL (Firebase usará la configuración por defecto)
        await sendEmailVerification(firebaseUser)
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        rancho: data.rancho,
        rancho_hectareas: data.rancho_hectareas,
        rancho_pais: data.rancho_pais,
        rancho_ciudad: data.rancho_ciudad,
        rancho_direccion: data.rancho_direccion,
        rancho_descripcion: data.rancho_descripcion,
        moneda: data.moneda,
      }

      return { user, error: null }
    } catch (error: any) {
      const message =
        error?.code === 'auth/email-already-in-use'
          ? 'El correo ya está registrado'
          : error?.message || 'Error al registrar'
      return { user: null, error: message }
    }
  }

  async login(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()

      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      const profileSnap = await getDoc(doc(db, USUARIOS_COLLECTION, firebaseUser.uid))
      const profile = profileSnap.data()

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || data.email,
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
      }

      return { user, error: null }
    } catch (error: any) {
      let message = 'Error al iniciar sesión'
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        message = 'Credenciales incorrectas. Verifique su email y contraseña.'
      } else if (error?.message) {
        message = error.message
      }
      return { user: null, error: message }
    }
  }

  async logout(): Promise<void> {
    const auth = getFirebaseAuth()
    await signOut(auth)
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()
      const firebaseUser = auth.currentUser

      if (!firebaseUser) return null

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
      }
    } catch (error) {
      return null
    }
  }
}
