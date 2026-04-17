import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_CREDENTIALS_MISSING,
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  hasAdminCredentials,
} from '@/infrastructure/config/firebaseAdmin'

function isAnimalMarkedInactive(animal: Record<string, unknown>): boolean {
  const estado = String(animal.estado || '').trim().toLowerCase()
  if (animal.activo === false) return true
  return (
    estado.includes('robado') ||
    estado.includes('robo') ||
    estado.includes('hurtado') ||
    estado.includes('hurto') ||
    estado.includes('muerto') ||
    estado.includes('vendido') ||
    estado.includes('inactivo')
  )
}

export async function GET(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(ADMIN_CREDENTIALS_MISSING, { status: 503 })
  }

  try {
    const authHeader = request.headers.get('authorization') || ''
    const m = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!m) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }
    const decoded = await getFirebaseAdminAuth().verifyIdToken(m[1])
    const ownerUid =
      decoded.tipo === 'trabajador' && typeof decoded.owner_uid === 'string'
        ? decoded.owner_uid
        : decoded.uid

    const db = getFirebaseAdminDb()
    const usuarioSnap = await db.collection('usuarios').doc(ownerUid).get()
    const ranchoId = String(usuarioSnap.data()?.rancho_actual_id || '').trim()

    const byUsuarioPromise = db.collection('animales').where('usuario_id', '==', ownerUid).get()
    const byRanchoPromise = ranchoId
      ? db.collection('animales').where('rancho_id', '==', ranchoId).get()
      : Promise.resolve(null)

    const [byUsuario, byRancho] = await Promise.all([byUsuarioPromise, byRanchoPromise])
    const merged = new Map<string, Record<string, unknown>>()
    for (const d of byUsuario.docs) merged.set(d.id, { id: d.id, ...d.data() })
    if (byRancho) {
      for (const d of byRancho.docs) merged.set(d.id, { id: d.id, ...d.data() })
    }

    const inactivos = Array.from(merged.values())
      .filter((a) => isAnimalMarkedInactive(a))
      .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')))

    return NextResponse.json({ animales: inactivos })
  } catch (error) {
    console.error('api/animales/inactivos GET', error)
    return NextResponse.json({ error: 'No se pudieron cargar los animales inactivos.' }, { status: 500 })
  }
}

