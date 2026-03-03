import { AnimalRepository } from '../../repositories/AnimalRepository'
import { EventoAnimalRepository } from '../../repositories/EventoAnimalRepository'
import { EventoAnimal } from '../../entities/EventoAnimal'
import { ReproductivoValidator } from '../../validators/ReproductivoValidator'
import { EventoTemporalValidator } from '../../validators/EventoTemporalValidator'
import type { ExamenOvarico } from '../../value-objects/ExamenOvarico'

export interface RegistrarCeloInput {
  animal_id: string
  usuario_id: string
  fecha_evento: string
  signos_celo?: string
  examen_ovarico?: ExamenOvarico
  motivo_id?: string
  observaciones?: string
}

export interface RegistrarServicioInput {
  animal_id: string
  usuario_id: string
  fecha_evento: string
  tipo_servicio: 'INSEMINACION' | 'MONTA_NATURAL'
  toro_id?: string
  pajilla_id?: string
  motivo_id?: string
  observaciones?: string
}

export type RegistrarEventoReproductivoInput = RegistrarCeloInput | RegistrarServicioInput

function isRegistrarServicioInput(
  input: RegistrarEventoReproductivoInput
): input is RegistrarServicioInput {
  return 'tipo_servicio' in input
}

/**
 * Caso de uso: registrar evento reproductivo (Celo o Servicio).
 * Valida hembra, edad > 15 meses, SINIIGA válido e integridad temporal.
 */
export class RegistrarServicioUseCase {
  constructor(
    private readonly animalRepo: AnimalRepository,
    private readonly eventoRepo: EventoAnimalRepository,
    private readonly eventoTemporalValidator: EventoTemporalValidator
  ) {}

  async ejecutarCelo(input: RegistrarCeloInput): Promise<EventoAnimal> {
    const animal = await this.animalRepo.getById(input.animal_id, input.usuario_id)
    if (!animal) throw new Error('Animal no encontrado.')
    const validacion = ReproductivoValidator.validarParaRegistroReproductivo(animal, input.fecha_evento)
    if (!validacion.valido) throw new Error(validacion.error)
    const eventosExistentes = await this.eventoRepo.getByAnimalId(input.animal_id, input.usuario_id, 'asc')
    const evento: EventoAnimal = {
      animal_id: input.animal_id,
      tipo_evento: 'CELO',
      fecha_evento: input.fecha_evento,
      usuario_id: input.usuario_id,
      motivo_id: input.motivo_id ?? 'DETECTADO',
      observaciones: input.observaciones,
      signos_celo: input.signos_celo,
      examen_ovarico: input.examen_ovarico,
    }
    const temporal = await this.eventoTemporalValidator.validarAntesDeRegistrar(evento, eventosExistentes)
    if (!temporal.valido) throw new Error(temporal.error)
    return this.eventoRepo.create(evento)
  }

  async ejecutarServicio(input: RegistrarServicioInput): Promise<EventoAnimal> {
    const animal = await this.animalRepo.getById(input.animal_id, input.usuario_id)
    if (!animal) throw new Error('Animal no encontrado.')
    const validacion = ReproductivoValidator.validarParaRegistroReproductivo(animal, input.fecha_evento)
    if (!validacion.valido) throw new Error(validacion.error)
    const eventosExistentes = await this.eventoRepo.getByAnimalId(input.animal_id, input.usuario_id, 'asc')
    const evento: EventoAnimal = {
      animal_id: input.animal_id,
      tipo_evento: 'SERVICIO',
      fecha_evento: input.fecha_evento,
      usuario_id: input.usuario_id,
      motivo_id: input.motivo_id ?? (input.tipo_servicio === 'INSEMINACION' ? 'INSEMINACION' : 'MONTA_NATURAL'),
      observaciones: input.observaciones,
      tipo_servicio: input.tipo_servicio,
      toro_id: input.toro_id,
      pajilla_id: input.pajilla_id,
    }
    const temporal = await this.eventoTemporalValidator.validarAntesDeRegistrar(evento, eventosExistentes)
    if (!temporal.valido) throw new Error(temporal.error)
    return this.eventoRepo.create(evento)
  }

  async ejecutar(input: RegistrarEventoReproductivoInput): Promise<EventoAnimal> {
    if (isRegistrarServicioInput(input)) {
      return this.ejecutarServicio(input)
    }
    return this.ejecutarCelo(input)
  }
}
