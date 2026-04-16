import { Rancho } from '@/domain/entities/Rancho'
import { RanchoRepository } from '@/domain/repositories/RanchoRepository'

export class CrearRanchoUseCase {
  constructor(private readonly ranchoRepository: RanchoRepository) {}

  async execute(rancho: Rancho): Promise<{ rancho: Rancho | null; error: string | null }> {
    if (!rancho.usuario_id) {
      return { rancho: null, error: 'Se requiere el identificador del usuario propietario.' }
    }
    if (!rancho.nombre || !rancho.nombre.trim()) {
      return { rancho: null, error: 'El nombre del rancho es obligatorio.' }
    }
    const created = await this.ranchoRepository.create(rancho)
    return { rancho: created, error: null }
  }
}
