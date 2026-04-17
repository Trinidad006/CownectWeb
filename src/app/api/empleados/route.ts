import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { firestoreServiceServer } from '@/infrastructure/services/firestoreServiceServer'
import { buildTrabajadorAuthUid } from '@/lib/trabajadorAuthUid'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

/**
 * GET /api/empleados?usuario_id=...
 * Obtiene la lista de empleados asociados a un ranchero
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const usuario_id = searchParams.get('usuario_id')

  if (!usuario_id) {
    return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 })
  }

  try {
    const authHeader = req.headers.get('authorization') || ''
    const m = authHeader.match(/^Bearer\s+(.+)$/i)
    let ownerUid: string | null = null
    if (m && hasAdminCredentials()) {
      try {
        const decoded = await getFirebaseAdminAuth().verifyIdToken(m[1])
        ownerUid = decoded.uid
      } catch {
        ownerUid = null
      }
    }

    // Legacy (kiosko): usuarios con rol TRABAJADOR
    let legacy: Array<Record<string, unknown>> = []
    try {
      legacy = (await firestoreServiceServer.getEmpleadosByJefe(usuario_id)) as Array<Record<string, unknown>>
    } catch (error) {
      console.warn('api/empleados: fuente legacy no disponible', error)
      legacy = []
    }
    // Nuevo flujo: subcolección trabajadores del dueño
    const ownerIds = Array.from(new Set([usuario_id, ownerUid].filter((v): v is string => Boolean(v))))
    const trabajadoresPorOwner = await Promise.all(
      ownerIds.map(async (id) => {
        try {
          return await firestoreAdminServer.listTrabajadores(id)
        } catch (error) {
          console.warn(`api/empleados: no se pudieron listar trabajadores para owner ${id}`, error)
          return []
        }
      })
    )
    const trabajadores = trabajadoresPorOwner.flat()

    const normalizedLegacy = (legacy as Array<Record<string, any>>).map((e) => ({
      id: String(e.id),
      nombre: String(e.nombre || e.username || 'Empleado'),
      apellido: typeof e.apellido === 'string' ? e.apellido : '',
      cargo: typeof e.cargo === 'string' ? e.cargo : 'Trabajador',
      activo: e.activo !== false,
      aliases: [String(e.id)],
      source: 'legacy',
    }))

    const normalizedTrabajadores = (trabajadores as Array<Record<string, any>>).map((t) => ({
      id: String(t.id),
      nombre: String(t.nombre || t.username || 'Trabajador'),
      apellido: typeof t.apellido === 'string' ? t.apellido : '',
      cargo: 'Trabajador',
      activo: t.activo !== false,
      aliases: ownerIds.map((ownerId) => buildTrabajadorAuthUid(ownerId, String(t.id))).concat(String(t.id)),
      source: 'trabajadores',
    }))

    const seen = new Set<string>()
    const dedupedTrabajadores = normalizedTrabajadores.filter((t) => {
      const k = String(t.id)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    const merged = [...normalizedLegacy, ...dedupedTrabajadores].filter((e) => e.activo !== false)
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Error al listar empleados:', error)
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
  }
}
