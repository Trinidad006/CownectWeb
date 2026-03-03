import { EventoAnimal, TipoEvento } from '../entities/EventoAnimal'
import { EventoAnimalRepository } from '../repositories/EventoAnimalRepository'

/** Estado de cierre de vida derivado del último evento MUERTE/VENTA/ROBO/DESCARTE. */
export type EstadoCierreVida =
  | { tipo: 'activo' }
  | { tipo: 'muerto'; fecha_evento: string; motivo_id?: string }
  | { tipo: 'venta'; fecha_evento: string; motivo_id?: string }
  | { tipo: 'robo'; fecha_evento: string; motivo_id?: string }
  | { tipo: 'descarte'; fecha_evento: string; motivo_id?: string }

/** Estado reproductivo derivado de eventos (solo aplicable a hembras). */
export type EstadoReproductivo =
  | 'gestante'   // DIAGNOSTICO_GESTACION positivo sin PARTO/ABORTO posterior
  | 'lactando'   // PARTO reciente sin DESTETE posterior
  | 'vacía'      // diagnóstico negativo o post-destete sin nueva gestación
  | 'indefinido' // sin datos suficientes

/**
 * Servicio que deriva el estado actual del animal a partir de su historial de eventos.
 * No se leen campos estado/activo/razon_inactivo en animales.
 */
export class EstadoDesdeEventosService {
  constructor(private readonly eventoRepo: EventoAnimalRepository) {}

  /**
   * Obtiene el estado de cierre de vida: activo o el último evento MUERTE/VENTA/ROBO/DESCARTE.
   */
  async getEstadoCierre(animalId: string, userId: string): Promise<EstadoCierreVida> {
    const eventos = await this.eventoRepo.getByAnimalId(animalId, userId, 'desc')
    const cierre = eventos.find((e) =>
      ['MUERTE', 'VENTA', 'ROBO', 'DESCARTE'].includes(e.tipo_evento)
    )
    if (!cierre) return { tipo: 'activo' }
    switch (cierre.tipo_evento) {
      case 'MUERTE':
        return { tipo: 'muerto', fecha_evento: cierre.fecha_evento, motivo_id: cierre.motivo_id }
      case 'VENTA':
        return { tipo: 'venta', fecha_evento: cierre.fecha_evento, motivo_id: cierre.motivo_id }
      case 'ROBO':
        return { tipo: 'robo', fecha_evento: cierre.fecha_evento, motivo_id: cierre.motivo_id }
      case 'DESCARTE':
        return { tipo: 'descarte', fecha_evento: cierre.fecha_evento, motivo_id: cierre.motivo_id }
      default:
        return { tipo: 'activo' }
    }
  }

  /**
   * Deriva estado reproductivo para hembras:
   * - Gestante: último DIAGNOSTICO_GESTACION positivo sin PARTO ni ABORTO después.
   * - Lactando: último PARTO sin DESTETE después.
   * - Vacía: último diagnóstico negativo o último DESTETE sin nueva gestación.
   */
  async getEstadoReproductivo(animalId: string, userId: string): Promise<EstadoReproductivo> {
    const eventos = await this.eventoRepo.getByAnimalId(animalId, userId, 'desc')
    const partos = eventos.filter((e) => e.tipo_evento === 'PARTO')
    const abortos = eventos.filter((e) => e.tipo_evento === 'ABORTO')
    const destetes = eventos.filter((e) => e.tipo_evento === 'DESTETE')
    const diagnosticos = eventos.filter((e) => e.tipo_evento === 'DIAGNOSTICO_GESTACION')

    const ultimoParto = partos[0]
    const ultimoAborto = abortos[0]
    const ultimoDestete = destetes[0]
    const ultimoDiagPositivo = diagnosticos.find((d) => d.motivo_id === 'POSITIVO')
    const ultimoDiagNegativo = diagnosticos.find((d) => d.motivo_id === 'NEGATIVO')

    // Gestante: hay diagnóstico positivo y no hay PARTO ni ABORTO posterior
    if (ultimoDiagPositivo) {
      const fechaDiag = new Date(ultimoDiagPositivo.fecha_evento).getTime()
      const hayPartoDespues = ultimoParto && new Date(ultimoParto.fecha_evento).getTime() > fechaDiag
      const hayAbortoDespues = ultimoAborto && new Date(ultimoAborto.fecha_evento).getTime() > fechaDiag
      if (!hayPartoDespues && !hayAbortoDespues) return 'gestante'
    }

    // Lactando: hay PARTO y no hay DESTETE posterior
    if (ultimoParto) {
      const fechaParto = new Date(ultimoParto.fecha_evento).getTime()
      const hayDesteteDespues = ultimoDestete && new Date(ultimoDestete.fecha_evento).getTime() > fechaParto
      if (!hayDesteteDespues) return 'lactando'
    }

    // Vacía: último diagnóstico negativo o post-destete sin gestación posterior
    if (ultimoDiagNegativo) return 'vacía'
    if (ultimoDestete && !ultimoDiagPositivo) return 'vacía'
    if (ultimoParto && ultimoDestete && new Date(ultimoDestete.fecha_evento) > new Date(ultimoParto.fecha_evento)) {
      if (!ultimoDiagPositivo || new Date(ultimoDiagPositivo.fecha_evento) < new Date(ultimoDestete.fecha_evento)) {
        return 'vacía'
      }
    }

    return 'indefinido'
  }

  /**
   * Indica si el animal está "activo" en el sistema (no muerto, vendido, robado, descartado).
   */
  async estaActivo(animalId: string, userId: string): Promise<boolean> {
    const estado = await this.getEstadoCierre(animalId, userId)
    return estado.tipo === 'activo'
  }
}
