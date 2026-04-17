import { Animal } from '@/domain/entities/Animal'
import { Rancho } from '@/domain/entities/Rancho'
import { CertificadoCownectResultado, CertificadoCownectService } from '@/domain/services/CertificadoCownectService'

export class VerificarCertificadoCownectUseCase {
  async execute(rancho: Rancho, animales: Animal[]): Promise<CertificadoCownectResultado> {
    return CertificadoCownectService.evaluarElegibilidad(rancho, animales)
  }
}
