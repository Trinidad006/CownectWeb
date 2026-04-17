import { NextRequest, NextResponse } from 'next/server'
import { FirebaseTareaAdminRepository } from '@/infrastructure/repositories/FirebaseTareaAdminRepository'
import { CrearTareaUseCase } from '@/domain/use-cases/tareas/CrearTareaUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'

const tareaRepository = new FirebaseTareaAdminRepository()

/**
 * GET /api/tareas?usuario_id=...
 * Obtiene la lista de tareas asociadas a un ranchero
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const usuario_id = searchParams.get('usuario_id')

  if (!usuario_id) {
    return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 })
  }

  try {
    const tareas = await tareaRepository.getAllByUser(usuario_id)
    return NextResponse.json(tareas)
  } catch (error) {
    console.error('Error al listar tareas:', error)
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 })
  }
}

/**
 * POST /api/tareas
 * Crea una nueva tarea
 */
export async function POST(request: NextRequest) {
  try {
    // Validar acceso premium para sistema de tareas
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'tareas')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { usuario_id, rancho_id, titulo, descripcion, asignado_a, fecha_vencimiento } = body

    const useCase = new CrearTareaUseCase(tareaRepository)

    const result = await useCase.execute({
      usuario_id,
      rancho_id,
      titulo,
      descripcion,
      asignado_a,
      fecha_vencimiento,
    } as any)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.tarea, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando tarea' }, { status: 500 })
  }
}
