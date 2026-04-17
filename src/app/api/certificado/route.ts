import { NextRequest, NextResponse } from 'next/server'
import { FirebaseRanchoRepository } from '@/infrastructure/repositories/FirebaseRanchoRepository'
import { FirebaseAnimalRepository } from '@/infrastructure/repositories/FirebaseAnimalRepository'
import { VerificarCertificadoCownectUseCase } from '@/domain/use-cases/certificado/VerificarCertificadoCownectUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'
import { CertificadoCownectService } from '@/domain/services/CertificadoCownectService'

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
    const MIN = CertificadoCownectService.MINIMO_VACAS_CERTIFICADO
    const hembrasActivas = animales.filter((a) => a.activo !== false && a.sexo === 'H').length
    const puntuacion = resultado.elegible
      ? 100
      : Math.min(99, Math.round((hembrasActivas / Math.max(MIN, 1)) * 100))

    const certificado = {
      elegible: resultado.elegible,
      puntuacion,
      criterios: [
        {
          nombre: 'Umbral de hembras activas',
          cumplido: hembrasActivas >= MIN,
          descripcion: `Se requieren al menos ${MIN} hembras activas. Actualmente: ${hembrasActivas}.`,
        },
      ],
      recomendaciones: resultado.elegible
        ? []
        : [resultado.motivo || resultado.mensaje].filter(Boolean),
    }

    return NextResponse.json({ certificado }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error verificando certificado' }, { status: 500 })
  }
}
