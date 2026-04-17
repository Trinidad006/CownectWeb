import { Rancho } from '@/domain/entities/Rancho'
import { RanchoRepository } from '@/domain/repositories/RanchoRepository'

export class ObtenerRanchosUseCase {
  constructor(private readonly ranchoRepository: RanchoRepository) {}

  async execute(usuarioId: string): Promise<Rancho[]> {
    return this.ranchoRepository.getAll(usuarioId)
  }
}
