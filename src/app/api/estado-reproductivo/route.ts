import { NextRequest, NextResponse } from 'next/server'
import { hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { FirebaseAdminEventoAnimalRepository } from '@/infrastructure/repositories/FirebaseAdminEventoAnimalRepository'
import { VerificarEstadoReproductivoUseCase } from '@/domain/use-cases/reproduccion/VerificarEstadoReproductivoUseCase'
import { FirebaseAdminAnimalRepository } from '@/infrastructure/repositories/FirebaseAdminAnimalRepository'

/**
 * GET: Estado reproductivo de una hembra (FPP, días abiertos, alerta re-celo).
 * Query: ?animal_id=xxx&userId=xxx
 */
export async function GET(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: 'Configuración de Firebase Admin requerida.' },
      { status: 503 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const animal_id = searchParams.get('animal_id')
    const userId = searchParams.get('userId')
    if (!animal_id || !userId) {
      return NextResponse.json(
        { error: 'Faltan query params: animal_id, userId.' },
        { status: 400 }
      )
    }
    const eventoRepo = new FirebaseAdminEventoAnimalRepository()
    const animalRepo = new FirebaseAdminAnimalRepository()
    const useCase = new VerificarEstadoReproductivoUseCase(eventoRepo, animalRepo)
    const result = await useCase.ejecutar(animal_id.trim(), userId.trim())
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al verificar estado reproductivo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
