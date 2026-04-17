import { Produccion } from '@/domain/entities/Produccion'
import { ProduccionRepository } from '@/domain/repositories/ProduccionRepository'

export class RegistrarProduccionUseCase {
  constructor(private readonly produccionRepository: ProduccionRepository) {}

  async execute(produccion: Produccion): Promise<{ produccion: Produccion | null; error: string | null }> {
    if (!produccion.usuario_id) {
      return { produccion: null, error: 'Se requiere el usuario que registra la producción.' }
    }
    if (!produccion.tipo) {
      return { produccion: null, error: 'El tipo de producción es obligatorio.' }
    }
    if (!produccion.cantidad || produccion.cantidad <= 0) {
      return { produccion: null, error: 'La cantidad debe ser mayor que cero.' }
    }
    if (!produccion.fecha_registro) {
      return { produccion: null, error: 'La fecha de registro es obligatoria.' }
    }
    const result = await this.produccionRepository.create(produccion)
    return { produccion: result, error: null }
  }
}
