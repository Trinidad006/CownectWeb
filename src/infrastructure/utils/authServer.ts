import { NextRequest } from 'next/server'
import { getFirebaseAdminDb, getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import type { User } from '@/domain/entities/User'

const USUARIOS = 'usuarios'

export type ApiCurrentUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'rol'
  | 'plan'
  | 'suscripcion_activa'
  | 'nombre'
  | 'apellido'
  | 'telefono'
  | 'rancho'
  | 'rancho_hectareas'
  | 'rancho_pais'
  | 'rancho_ciudad'
  | 'rancho_direccion'
  | 'rancho_descripcion'
  | 'moneda'
  | 'suscripcion_fecha'
>

/**
 * Usuario autenticado en rutas API leyendo `Authorization: Bearer <Firebase ID token>`.
 * Requiere variables de servicio de Firebase Admin en el servidor.
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<ApiCurrentUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const idToken = authHeader.slice(7).trim()
  if (!idToken) return null

  if (!hasAdminCredentials()) {
    return null
  }

  try {
    const adminAuth = getFirebaseAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    const db = getFirebaseAdminDb()
    const snap = await db.collection(USUARIOS).doc(decoded.uid).get()
    const profile = snap.data() || {}

    const email = (decoded.email as string | undefined) || (profile.email as string) || ''

    return {
      id: decoded.uid,
      email,
      rol: profile.rol,
      nombre: profile.nombre,
      apellido: profile.apellido,
      telefono: profile.telefono,
      rancho: profile.rancho,
      rancho_hectareas: profile.rancho_hectareas,
      rancho_pais: profile.rancho_pais,
      rancho_ciudad: profile.rancho_ciudad,
      rancho_direccion: profile.rancho_direccion,
      rancho_descripcion: profile.rancho_descripcion,
      moneda: profile.moneda,
      plan: profile.plan || 'gratuito',
      suscripcion_activa: profile.suscripcion_activa || false,
      suscripcion_fecha: profile.suscripcion_fecha,
    }
  } catch (e) {
    console.error('[getCurrentUserFromRequest]', e)
    return null
  }
}
