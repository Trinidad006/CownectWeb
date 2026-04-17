import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { hashWorkerPassword } from '@/lib/workerPassword'

const DEFAULT_USER = 'usuario'
const DEFAULT_PASS = '12345'

function isPremium(usuario: Record<string, unknown> | null): boolean {
  if (!usuario) return false
  return usuario.plan === 'premium' || usuario.suscripcion_activa === true
}

/**
 * POST /api/trabajadores/setup-default
 * Crea el trabajador por defecto usuario/12345 si el dueño premium aún no tiene ninguno.
 * Header: Authorization: Bearer <ID token dueño>
 */
export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Servidor sin credenciales de administración.' }, { status: 503 })
  }
  try {
    const authHeader = request.headers.get('authorization') || ''
    const m = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!m) {
      return NextResponse.json({ error: 'Falta Authorization Bearer.' }, { status: 401 })
    }
    const auth = getFirebaseAdminAuth()
    const decoded = await auth.verifyIdToken(m[1])
    const ownerUid = decoded.uid

    const usuario = (await firestoreAdminServer.getUsuario(ownerUid)) as Record<string, unknown> | null
    if (!isPremium(usuario)) {
      return NextResponse.json({ error: 'Solo premium.' }, { status: 403 })
    }

    const count = await firestoreAdminServer.countTrabajadores(ownerUid)
    if (count > 0) {
      return NextResponse.json({ message: 'Ya existen trabajadores; no se creó el predeterminado.', created: false })
    }

    const existingName = await firestoreAdminServer.getTrabajadorByOwnerAndUsername(ownerUid, DEFAULT_USER)
    if (existingName) {
      return NextResponse.json({ message: 'El usuario predeterminado ya existe.', created: false })
    }

    const { salt, hash } = hashWorkerPassword(DEFAULT_PASS)
    const id = await firestoreAdminServer.createTrabajador(ownerUid, {
      username: DEFAULT_USER,
      password_salt: salt,
      password_hash: hash,
    })

    return NextResponse.json(
      {
        created: true,
        id,
        username: DEFAULT_USER,
        hint: 'Contraseña inicial predeterminada; cámbiala tras el primer uso (próxima fase desde panel del dueño).',
      },
      { status: 201 }
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    console.error('setup-default', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
