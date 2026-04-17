import { NextRequest, NextResponse } from 'next/server'
import { FirebaseRanchoAdminRepository } from '@/infrastructure/repositories/FirebaseRanchoAdminRepository'
import { CrearRanchoUseCase } from '@/domain/use-cases/rancho/CrearRanchoUseCase'
import { ObtenerRanchosUseCase } from '@/domain/use-cases/rancho/ObtenerRanchosUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'

export async function GET(request: NextRequest) {
  try {
    // Validar acceso premium para múltiples ranchos
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'multiple_ranchos')
    if (!validacion.valido) {
      return validacion.response!
    }

    const { searchParams } = new URL(request.url)
    const usuario_id = searchParams.get('usuario_id')

    if (!usuario_id) {
      return NextResponse.json({ error: 'usuario_id es requerido' }, { status: 400 })
    }

    const ranchoRepository = new FirebaseRanchoAdminRepository()
    const useCase = new ObtenerRanchosUseCase(ranchoRepository)
    const result = await useCase.execute(usuario_id)

    return NextResponse.json({ ranchos: result }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error obteniendo ranchos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar acceso premium para múltiples ranchos
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'multiple_ranchos')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { usuario_id, nombre, pais, ciudad, direccion, descripcion, hectareas, tipos_ganado } = body
    const ranchoRepository = new FirebaseRanchoAdminRepository()
    const useCase = new CrearRanchoUseCase(ranchoRepository)
    const result = await useCase.execute({
      usuario_id,
      nombre,
      pais,
      ciudad,
      direccion,
      descripcion,
      hectareas,
      tipos_ganado,
    })
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ rancho: result.rancho }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando rancho' }, { status: 500 })
  }
}
