import { EventoAnimal, TipoEvento } from '../entities/EventoAnimal'
import { EventoAnimalRepository } from '../repositories/EventoAnimalRepository'

export interface KpiReproduccion {
  /** Días entre el último y el penúltimo PARTO (null si no hay dos partos). */
  intervaloEntrePartosDias: number | null
  /** Días desde el último PARTO sin nueva gestación confirmada (null si no hay parto). */
  diasAbiertos: number | null
  /** Número de partos registrados. */
  totalPartos: number
}

export interface KpiMortalidadDescarte {
  totalMuertes: number
  totalVentas: number
  totalRobos: number
  totalDescartes: number
  /** Agregado por motivo_id para MUERTE. */
  muertesPorMotivo: Record<string, number>
  /** Agregado por motivo_id para DESCARTE. */
  descartesPorMotivo: Record<string, number>
}

/**
 * Servicio que calcula KPIs a partir del historial de eventos (sin campos fijos en animales).
 */
export class KpiReproduccionService {
  constructor(private readonly eventoRepo: EventoAnimalRepository) {}

  /**
   * Intervalo entre partos: tiempo entre dos eventos PARTO consecutivos de la misma hembra.
   * Días abiertos: días desde el último PARTO hasta hoy (o hasta DIAGNOSTICO_GESTACION positivo).
   */
  async getKpiReproduccion(animalId: string, userId: string): Promise<KpiReproduccion> {
    const eventos = await this.eventoRepo.getByAnimalId(animalId, userId, 'asc')
    const partos = eventos.filter((e) => e.tipo_evento === 'PARTO')
    const diagnosticosPositivos = eventos.filter(
      (e) => e.tipo_evento === 'DIAGNOSTICO_GESTACION' && e.motivo_id === 'POSITIVO'
    )

    let intervaloEntrePartosDias: number | null = null
    if (partos.length >= 2) {
      const p1 = new Date(partos[partos.length - 2].fecha_evento).getTime()
      const p2 = new Date(partos[partos.length - 1].fecha_evento).getTime()
      intervaloEntrePartosDias = Math.round((p2 - p1) / (24 * 60 * 60 * 1000))
    }

    let diasAbiertos: number | null = null
    const ultimoParto = partos[partos.length - 1]
    if (ultimoParto) {
      const fechaUltimoParto = new Date(ultimoParto.fecha_evento).getTime()
      const gestacionConfirmadaDespues = diagnosticosPositivos.some(
        (d) => new Date(d.fecha_evento).getTime() > fechaUltimoParto
      )
      if (!gestacionConfirmadaDespues) {
        diasAbiertos = Math.floor((Date.now() - fechaUltimoParto) / (24 * 60 * 60 * 1000))
      }
    }

    return {
      intervaloEntrePartosDias,
      diasAbiertos,
      totalPartos: partos.length,
    }
  }

  /**
   * Tasa de mortalidad/descarte: agregados por tipo_evento y motivo en un rango de fechas.
   */
  async getKpiMortalidadDescarte(
    userId: string,
    desde: string,
    hasta: string
  ): Promise<KpiMortalidadDescarte> {
    const eventos = await this.eventoRepo.getByUsuarioYFechas(userId, desde, hasta)
    const muertes = eventos.filter((e) => e.tipo_evento === 'MUERTE')
    const ventas = eventos.filter((e) => e.tipo_evento === 'VENTA')
    const robos = eventos.filter((e) => e.tipo_evento === 'ROBO')
    const descartes = eventos.filter((e) => e.tipo_evento === 'DESCARTE')

    const muertesPorMotivo: Record<string, number> = {}
    muertes.forEach((e) => {
      const m = e.motivo_id ?? 'SIN_MOTIVO'
      muertesPorMotivo[m] = (muertesPorMotivo[m] ?? 0) + 1
    })
    const descartesPorMotivo: Record<string, number> = {}
    descartes.forEach((e) => {
      const m = e.motivo_id ?? 'SIN_MOTIVO'
      descartesPorMotivo[m] = (descartesPorMotivo[m] ?? 0) + 1
    })

    return {
      totalMuertes: muertes.length,
      totalVentas: ventas.length,
      totalRobos: robos.length,
      totalDescartes: descartes.length,
      muertesPorMotivo,
      descartesPorMotivo,
    }
  }
}
