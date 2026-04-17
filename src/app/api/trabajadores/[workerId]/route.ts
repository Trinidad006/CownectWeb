import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_CREDENTIALS_MISSING,
  getFirebaseAdminAuth,
  hasAdminCredentials,
} from '@/infrastructure/config/firebaseAdmin'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'

function isPremium(usuario: Record<string, unknown> | null): boolean {
  if (!usuario) return false
  const plan = String(usuario.plan || '').trim().toLowerCase()
  const rawActiva = usuario.suscripcion_activa
  const suscripcionActiva =
    rawActiva === true ||
    rawActiva === 1 ||
    (typeof rawActiva === 'string' && ['true', '1', 'si', 'sí'].includes(rawActiva.trim().toLowerCase()))
  return plan === 'premium' || suscripcionActiva
}

/**
 * PATCH /api/trabajadores/:workerId
 * Body: { activo: boolean }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workerId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(ADMIN_CREDENTIALS_MISSING, { status: 503 })
  }
  try {
    const authHeader = request.headers.get('authorization') || ''
    const m = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!m) {
      return NextResponse.json({ error: 'Falta Authorization Bearer.' }, { status: 401 })
    }
    const decoded = await getFirebaseAdminAuth().verifyIdToken(m[1])
    const ownerUid = decoded.uid
    const usuario = (await firestoreAdminServer.getUsuario(ownerUid)) as Record<string, unknown> | null
    if (!isPremium(usuario)) {
      return NextResponse.json({ error: 'Solo premium.' }, { status: 403 })
    }

    const { workerId } = await context.params
    if (!workerId) {
      return NextResponse.json({ error: 'workerId requerido' }, { status: 400 })
    }

    const body = await request.json()
    const activo = body?.activo
    if (typeof activo !== 'boolean') {
      return NextResponse.json({ error: 'activo (boolean) es requerido' }, { status: 400 })
    }

    await firestoreAdminServer.setTrabajadorActivo(ownerUid, workerId, activo)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    console.error('trabajadores PATCH', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
