import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { verifyWorkerPassword } from '@/lib/workerPassword'
import { buildTrabajadorAuthUid } from '@/lib/trabajadorAuthUid'

function isPremium(usuario: Record<string, unknown> | null): boolean {
  if (!usuario) return false
  return usuario.plan === 'premium' || usuario.suscripcion_activa === true
}

/**
 * POST /api/trabajadores/login
 * Body: { ownerEmail, username, password }
 * Respuesta: { customToken } para signInWithCustomToken en el cliente.
 */
export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Servidor sin credenciales de administración.' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const ownerEmail = String(body?.ownerEmail || '').trim()
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')

    if (!ownerEmail || !username || !password) {
      return NextResponse.json(
        { error: 'Se requieren ownerEmail (correo del dueño), username y password.' },
        { status: 400 }
      )
    }

    const ownerUid = await firestoreAdminServer.findUsuarioIdByEmail(ownerEmail)
    if (!ownerUid) {
      return NextResponse.json({ error: 'No se encontró un dueño con ese correo.' }, { status: 404 })
    }

    const usuario = (await firestoreAdminServer.getUsuario(ownerUid)) as Record<string, unknown> | null
    if (!isPremium(usuario)) {
      return NextResponse.json(
        { error: 'El rancho no tiene plan premium; las sesiones de trabajador no están habilitadas.' },
        { status: 403 }
      )
    }

    const trabajador = await firestoreAdminServer.getTrabajadorByOwnerAndUsername(ownerUid, username)
    if (!trabajador || trabajador.activo === false) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    const salt = String(trabajador.password_salt || '')
    const hash = String(trabajador.password_hash || '')
    if (!salt || !hash || !verifyWorkerPassword(password, salt, hash)) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    const authUid = buildTrabajadorAuthUid(ownerUid, trabajador.id)
    const auth = getFirebaseAdminAuth()
    const customToken = await auth.createCustomToken(authUid, {
      tipo: 'trabajador',
      owner_uid: ownerUid,
      worker_id: trabajador.id,
    })

    return NextResponse.json({ customToken })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error en login de trabajador'
    console.error('trabajadores/login', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
