import { NextRequest, NextResponse } from 'next/server'
import { FirebaseProduccionRepository } from '@/infrastructure/repositories/FirebaseProduccionRepository'
import { RegistrarProduccionUseCase } from '@/domain/use-cases/produccion/RegistrarProduccionUseCase'

const produccionRepository = new FirebaseProduccionRepository()

/**
 * GET /api/produccion?usuario_id=...
 * Obtiene todos los registros de produccion del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuario_id = searchParams.get('usuario_id')

    if (!usuario_id) {
      return NextResponse.json({ error: 'Se requiere usuario_id' }, { status: 400 })
    }

    const data = await produccionRepository.getAllByUser(usuario_id)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al obtener produccion' }, { status: 500 })
  }
}

/**
 * POST /api/produccion
 * Registra un nuevo evento de produccion (leche/carne)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuario_id, rancho_id, animal_id, tipo, cantidad, unidad, fecha_registro, observaciones } = body

    const useCase = new RegistrarProduccionUseCase(produccionRepository)

    const result = await useCase.execute({
      usuario_id,
      rancho_id: rancho_id || 'default',
      animal_id,
      tipo,
      cantidad,
      unidad: unidad || (tipo === 'leche' ? 'L' : 'Kg'),
      fecha_registro: fecha_registro || new Date().toISOString(),
      observaciones,
    } as any)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ produccion: result.produccion }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error registrando produccion' }, { status: 500 })
  }
}
