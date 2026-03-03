import { EventoAnimal, TipoEvento } from '../entities/EventoAnimal'

export interface EventoAnimalRepository {
  /** Obtiene todos los eventos de un animal ordenados por fecha (más reciente primero por defecto). */
  getByAnimalId(animalId: string, userId: string, orden: 'asc' | 'desc'): Promise<EventoAnimal[]>

  /** Obtiene el último evento de un tipo dado para un animal (ej. último PARTO, última MUERTE). */
  getUltimoPorTipo(animalId: string, tipo: TipoEvento, userId: string): Promise<EventoAnimal | null>

  /** Verifica si el animal tiene algún evento de cierre de vida (MUERTE, VENTA, ROBO, DESCARTE). */
  tieneEventoCierre(animalId: string, userId: string): Promise<boolean>

  /** Registra un nuevo evento. Debe validarse integridad temporal antes de llamar. */
  create(evento: EventoAnimal): Promise<EventoAnimal>

  /** Eventos de un usuario en un rango de fechas (para KPIs agregados). */
  getByUsuarioYFechas(
    userId: string,
    desde: string,
    hasta: string,
    tipoEvento?: TipoEvento
  ): Promise<EventoAnimal[]>
}
