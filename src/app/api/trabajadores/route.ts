import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { hashWorkerPassword } from '@/lib/workerPassword'

function isPremium(usuario: Record<string, unknown> | null): boolean {
  if (!usuario) return false
  return usuario.plan === 'premium' || usuario.suscripcion_activa === true
}

/**
 * POST /api/trabajadores
 * Header: Authorization: Bearer <Firebase ID token del dueño>
 * Body: { username: string, password: string }
 */
export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Servidor sin credenciales de administración.' }, { status: 503 })
  }
  try {
    const authHeader = request.headers.get('authorization') || ''
    const m = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!m) {
      return NextResponse.json({ error: 'Falta Authorization Bearer con el ID token del dueño.' }, { status: 401 })
    }
    const idToken = m[1]
    const auth = getFirebaseAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)
    const ownerUid = decoded.uid

    const usuario = (await firestoreAdminServer.getUsuario(ownerUid)) as Record<string, unknown> | null
    if (!isPremium(usuario)) {
      return NextResponse.json({ error: 'Solo cuentas premium pueden crear trabajadores.' }, { status: 403 })
    }

    const body = await request.json()
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')
    if (!username || !password) {
      return NextResponse.json({ error: 'username y password son requeridos.' }, { status: 400 })
    }
    if (password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres.' }, { status: 400 })
    }

    const existing = await firestoreAdminServer.getTrabajadorByOwnerAndUsername(ownerUid, username)
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un trabajador con ese usuario.' }, { status: 409 })
    }

    const { salt, hash } = hashWorkerPassword(password)
    const id = await firestoreAdminServer.createTrabajador(ownerUid, {
      username,
      password_salt: salt,
      password_hash: hash,
    })

    return NextResponse.json({ id, username }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al crear trabajador'
    console.error('trabajadores POST', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
