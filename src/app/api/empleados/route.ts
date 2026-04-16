import { NextRequest, NextResponse } from 'next/server'
import { firestoreService } from '@/infrastructure/services/firestoreService'

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
    const empleados = await firestoreService.getEmpleadosByJefe(usuario_id)
    return NextResponse.json(empleados)
  } catch (error) {
    console.error('Error al listar empleados:', error)
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
  }
}
