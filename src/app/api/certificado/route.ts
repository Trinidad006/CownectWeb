import { NextRequest, NextResponse } from 'next/server'
import { FirebaseRanchoRepository } from '@/infrastructure/repositories/FirebaseRanchoRepository'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { VerificarCertificadoCownectUseCase } from '@/domain/use-cases/certificado/VerificarCertificadoCownectUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'

export async function POST(request: NextRequest) {
  try {
    // Validar acceso premium para certificado Cownect
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'certificado_cownect')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { rancho_id, usuario_id } = body
    if (!rancho_id || !usuario_id) {
      return NextResponse.json({ error: 'rancho_id y usuario_id son requeridos' }, { status: 400 })
    }

    const ranchoRepo = new FirebaseRanchoRepository()
    const rancho = await ranchoRepo.getById(rancho_id, usuario_id)
    if (!rancho) {
      return NextResponse.json({ error: 'Rancho no encontrado' }, { status: 404 })
    }

    const animalRepo = new FirebaseAnimalRepository()
    const animales = await animalRepo.getAll(usuario_id)
    const useCase = new VerificarCertificadoCownectUseCase()

    const resultado = await useCase.execute(rancho, animales)
    return NextResponse.json({ certificado: resultado }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error verificando certificado' }, { status: 500 })
  }
}
