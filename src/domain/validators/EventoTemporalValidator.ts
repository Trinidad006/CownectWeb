import { EventoAnimal, EVENTOS_CIERRE_VIDA, TipoEvento } from '../entities/EventoAnimal'
import { EventoAnimalRepository } from '../repositories/EventoAnimalRepository'

export interface ValidacionTemporalResult {
  valido: boolean
  error?: string
}

/**
 * Validaciones de integridad temporal para eventos de animal.
 * - No registrar eventos después de MUERTE, VENTA, ROBO o DESCARTE.
 * - PARTO no puede ocurrir antes de un SERVICIO.
 * - No dos PARTOS consecutivos sin SERVICIO (o DIAGNOSTICO_GESTACION) intermedio.
 */
export class EventoTemporalValidator {
  constructor(private readonly eventoRepo: EventoAnimalRepository) {}

  /**
   * Valida si se puede registrar el evento (animal no cerrado, fechas y secuencia reproductiva).
   */
  async validarAntesDeRegistrar(
    evento: EventoAnimal,
    eventosExistentes: EventoAnimal[]
  ): Promise<ValidacionTemporalResult> {
    // 1. No permitir eventos si ya existe un evento de cierre de vida
    const ultimoCierre = eventosExistentes
      .filter((e) => EVENTOS_CIERRE_VIDA.includes(e.tipo_evento))
      .sort((a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime())[0]
    if (ultimoCierre) {
      return {
        valido: false,
        error: `No se pueden registrar eventos: el animal ya tiene un evento de ${ultimoCierre.tipo_evento} (${ultimoCierre.fecha_evento}).`,
      }
    }

    // 2. fecha_evento no puede ser futura
    const fechaEvento = new Date(evento.fecha_evento)
    if (fechaEvento > new Date()) {
      return { valido: false, error: 'La fecha del evento no puede ser futura.' }
    }

    // 3. Validaciones específicas por tipo
    if (evento.tipo_evento === 'PARTO') {
      const resultado = this.validarParto(eventosExistentes, evento)
      if (!resultado.valido) return resultado
    }

    if (evento.tipo_evento === 'NACIMIENTO' && !evento.madre_id) {
      return { valido: false, error: 'En evento de NACIMIENTO la madre_id es obligatoria.' }
    }

    return { valido: true }
  }

  /**
   * PARTO no puede ocurrir antes de un SERVICIO.
   * No puede haber dos PARTOS sin un SERVICIO o DIAGNOSTICO_GESTACION positivo entre ellos.
   */
  private validarParto(eventosExistentes: EventoAnimal[], nuevoParto: EventoAnimal): ValidacionTemporalResult {
    const fechaParto = new Date(nuevoParto.fecha_evento)
    const eventosOrdenados = [...eventosExistentes].sort(
      (a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
    )

    const partosAnteriores = eventosOrdenados.filter((e) => e.tipo_evento === 'PARTO')
    const servicios = eventosOrdenados.filter((e) => e.tipo_evento === 'SERVICIO')
    const diagnosticosPositivos = eventosOrdenados.filter(
      (e) => e.tipo_evento === 'DIAGNOSTICO_GESTACION' && e.motivo_id === 'POSITIVO'
    )

    // Debe existir al menos un SERVICIO o DIAGNOSTICO_GESTACION positivo antes del parto
    const hayServicioAntes = servicios.some((s) => new Date(s.fecha_evento) < fechaParto)
    const hayDiagnosticoAntes = diagnosticosPositivos.some((d) => new Date(d.fecha_evento) < fechaParto)
    if (partosAnteriores.length > 0 && !hayServicioAntes && !hayDiagnosticoAntes) {
      return {
        valido: false,
        error: 'No puede haber un PARTO sin un SERVICIO o diagnóstico de gestación positivo previo.',
      }
    }

    // Si ya hay un PARTO, debe haber SERVICIO o DIAGNOSTICO entre el último parto y este
    if (partosAnteriores.length > 0) {
      const ultimoParto = partosAnteriores[partosAnteriores.length - 1]
      const fechaUltimoParto = new Date(ultimoParto.fecha_evento)
      const hayServicioEntre =
        servicios.some((s) => {
          const t = new Date(s.fecha_evento).getTime()
          return t > fechaUltimoParto.getTime() && t < fechaParto.getTime()
        }) ||
        diagnosticosPositivos.some((d) => {
          const t = new Date(d.fecha_evento).getTime()
          return t > fechaUltimoParto.getTime() && t < fechaParto.getTime()
        })
      if (!hayServicioEntre) {
        return {
          valido: false,
          error: 'No puede haber dos PARTOS sin un SERVICIO o diagnóstico de gestación positivo entre ellos.',
        }
      }
    }

    return { valido: true }
  }
}
