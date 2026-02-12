import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
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
        plan: 'gratuito',
        suscripcion_activa: false,
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
        plan: profile?.plan || 'gratuito',
        suscripcion_activa: profile?.suscripcion_activa || false,
        suscripcion_fecha: profile?.suscripcion_fecha,
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
        plan: profile?.plan || 'gratuito',
        suscripcion_activa: profile?.suscripcion_activa || false,
        suscripcion_fecha: profile?.suscripcion_fecha,
      }
    } catch (error) {
      return null
    }
  }

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validación backend: email no vacío
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        return { success: false, error: 'El correo electrónico es requerido.' }
      }

      // Validación backend: formato básico de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return { success: false, error: 'El correo electrónico no tiene un formato válido.' }
      }

      const auth = getFirebaseAuth()
      
      // Configurar la URL de redirección después de resetear la contraseña
      const actionCodeSettings = typeof window !== 'undefined' ? {
        url: `${window.location.origin}/login?reset=success`,
        handleCodeInApp: false,
      } : undefined

      await firebaseSendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings)
      
      // Por seguridad, siempre devolvemos éxito incluso si el usuario no existe
      // Esto previene la enumeración de usuarios (ataque de seguridad)
      return { success: true, error: null }
    } catch (error: any) {
      let errorMessage = 'Error al enviar el correo de recuperación.'
      
      // Manejo específico de errores de Firebase Auth
      if (error?.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.'
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.'
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      } else if (error?.code === 'auth/user-not-found') {
        // Por seguridad, mostramos el mismo mensaje de éxito para evitar enumeración
        // Firebase puede lanzar este error, pero por seguridad no lo revelamos
        return { success: true, error: null }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    }
  }
}
