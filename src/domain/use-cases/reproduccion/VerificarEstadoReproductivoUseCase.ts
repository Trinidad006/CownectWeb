import { EventoAnimalRepository } from '../../repositories/EventoAnimalRepository'
import { AnimalRepository } from '../../repositories/AnimalRepository'
import { EstadoReproductivoCompleto, calcularEstadoReproductivo } from '../../services/EstadoReproductivoService'
import { EVENTOS_REPRODUCTIVOS } from '../../entities/EventoAnimal'
import type { EventoAnimal } from '../../entities/EventoAnimal'

export interface VerificarEstadoReproductivoOutput {
  animal_id: string
  estado: EstadoReproductivoCompleto
  eventosReproductivos: EventoAnimal[]
}

/**
 * Caso de uso: verificar estado reproductivo de una hembra (FPP, días abiertos, alerta re-celo).
 */
export class VerificarEstadoReproductivoUseCase {
  constructor(
    private readonly eventoRepo: EventoAnimalRepository,
    private readonly animalRepo: AnimalRepository
  ) {}

  async ejecutar(animalId: string, userId: string): Promise<VerificarEstadoReproductivoOutput> {
    const animal = await this.animalRepo.getById(animalId, userId)
    if (!animal) throw new Error('Animal no encontrado.')
    if (animal.sexo !== 'H') {
      throw new Error('El estado reproductivo solo aplica a hembras.')
    }
    const todosEventos = await this.eventoRepo.getByAnimalId(animalId, userId, 'asc')
    const eventosReproductivos = todosEventos.filter((e) =>
      EVENTOS_REPRODUCTIVOS.includes(e.tipo_evento)
    )
    const estado = calcularEstadoReproductivo(eventosReproductivos)
    return {
      animal_id: animalId,
      estado,
      eventosReproductivos,
    }
  }
}


