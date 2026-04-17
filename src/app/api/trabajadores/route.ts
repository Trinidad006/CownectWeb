import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { hashWorkerPassword } from '@/lib/workerPassword'

function isPremium(usuario: Record<string, unknown> | null): boolean {
  if (!usuario) return false
  return usuario.plan === 'premium' || usuario.suscripcion_activa === true
}

async function requireOwnerPremium(request: NextRequest): Promise<{ ownerUid: string } | NextResponse> {
  const authHeader = request.headers.get('authorization') || ''
  const m = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!m) {
    return NextResponse.json({ error: 'Falta Authorization Bearer con el ID token del dueño.' }, { status: 401 })
  }
  const auth = getFirebaseAdminAuth()
  const decoded = await auth.verifyIdToken(m[1])
  const ownerUid = decoded.uid
  const usuario = (await firestoreAdminServer.getUsuario(ownerUid)) as Record<string, unknown> | null
  if (!isPremium(usuario)) {
    return NextResponse.json({ error: 'Solo cuentas premium pueden gestionar trabajadores.' }, { status: 403 })
  }
  return { ownerUid }
}

/**
 * GET /api/trabajadores
 * Lista trabajadores del dueño (sin secretos).
 */
export async function GET(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Servidor sin credenciales de administración.' }, { status: 503 })
  }
  try {
    const auth = await requireOwnerPremium(request)
    if (auth instanceof NextResponse) return auth
    const trabajadores = await firestoreAdminServer.listTrabajadores(auth.ownerUid)
    return NextResponse.json({ trabajadores })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al listar trabajadores'
    console.error('trabajadores GET', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
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
    const auth = await requireOwnerPremium(request)
    if (auth instanceof NextResponse) return auth
    const { ownerUid } = auth

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
