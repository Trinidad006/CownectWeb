import { getFirebaseAdminAuth, getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

function mensajeErrorFirebaseAdmin(err: unknown): string {
  const e = err as { errorInfo?: { code?: string; message?: string }; code?: string; message?: string }
  const code = e?.errorInfo?.code || e?.code || ''
  const raw = e?.errorInfo?.message || e?.message || ''

  switch (code) {
    case 'auth/email-already-exists':
      return 'Ya existe una cuenta con este correo. Usa otro email o recupera la contraseña de esa cuenta.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo. Usa otro email.'
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.'
    case 'auth/invalid-password':
    case 'auth/weak-password':
      return 'La contraseña temporal no cumple las reglas de Firebase (longitud o complejidad).'
    case 'auth/operation-not-allowed':
      return 'El registro por email/contraseña no está habilitado en Firebase Console (Authentication → Sign-in method).'
    default:
      if (raw && raw.length < 200) return raw
      return 'No se pudo crear la cuenta del empleado. Revisa la consola del servidor o la configuración de Firebase Admin.'
  }
}

/**
 * Crea usuario Auth + documento `usuarios` con Firebase Admin (válido en rutas API; bypasea reglas).
 */
export async function registrarEmpleadoConAdmin(params: {
  email: string
  password: string
  nombre: string
  apellido: string
  telefono?: string
  id_rancho_jefe: string
  pin_kiosko: string
}): Promise<{ uid: string; error: string | null }> {
  if (!hasAdminCredentials()) {
    return {
      uid: '',
      error:
        'Firebase Admin no está configurado. Añade FIREBASE_SERVICE_ACCOUNT_PATH o las variables de cuenta de servicio en .env.local.',
    }
  }

  const auth = getFirebaseAdminAuth()
  const db = getFirebaseAdminDb()
  const now = new Date().toISOString()

  try {
    const userRecord = await auth.createUser({
      email: params.email,
      password: params.password,
      displayName: `${params.nombre} ${params.apellido}`.trim(),
      disabled: false,
    })

    const uid = userRecord.uid

    await db.collection('usuarios').doc(uid).set({
      email: params.email,
      rol: 'TRABAJADOR',
      id_rancho_jefe: params.id_rancho_jefe,
      pin_kiosko: params.pin_kiosko,
      plan: 'gratuito',
      suscripcion_activa: false,
      nombre: params.nombre ?? null,
      apellido: params.apellido ?? null,
      telefono: params.telefono ?? null,
      rancho: null,
      rancho_ids: null,
      rancho_actual_id: null,
      is_admin: false,
      suspendido: false,
      created_at: now,
      updated_at: now,
    })

    return { uid, error: null }
  } catch (err) {
    return { uid: '', error: mensajeErrorFirebaseAdmin(err) }
  }
}
