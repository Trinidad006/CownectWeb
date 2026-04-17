import { NextRequest, NextResponse } from 'next/server'
import { FirebaseRegistroClinicoRepository } from '@/infrastructure/repositories/FirebaseRegistroClinicoRepository'
import { RegistrarRegistroClinicoUseCase } from '@/domain/use-cases/salud/RegistrarRegistroClinicoUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'

export async function POST(request: NextRequest) {
  try {
    // Validar acceso premium para historial clínico avanzado
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'historial_clinico')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { usuario_id, rancho_id, animal_id, fecha_registro, enfermedad, diagnostico, tratamiento, veterinario, estado, observaciones } = body

    const registroRepository = new FirebaseRegistroClinicoRepository()
    const useCase = new RegistrarRegistroClinicoUseCase(registroRepository)

    const result = await useCase.execute({
      usuario_id,
      rancho_id,
      animal_id,
      fecha_registro,
      enfermedad,
      diagnostico,
      tratamiento,
      veterinario,
      estado,
      observaciones,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ registro: result.registro }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error registrando historia clínica' }, { status: 500 })
  }
}
