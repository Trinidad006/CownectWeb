import { EventoAnimal } from '../entities/EventoAnimal'
import { DIAS_GESTACION_BOVINO, DIAS_ALERTA_RECELO } from '../constants/reproduccion'

export interface EstadoReproductivoCompleto {
  /** Fecha probable de parto (283 días desde último servicio con diagnóstico positivo, o desde servicio si aún no hay diagnóstico). */
  fechaProbableParto: string | null
  /** Días entre último parto y el nuevo servicio efectivo (o hasta hoy si no hay servicio posterior). */
  diasAbiertos: number | null
  /** true si han pasado ≥21 días desde un servicio sin confirmación de preñez. */
  alertaRecelo: boolean
  /** Mensaje descriptivo para la alerta. */
  mensajeAlertaRecelo: string | null
  /** Último servicio (fecha). */
  ultimoServicio: string | null
  /** Último parto (fecha). */
  ultimoParto: string | null
  /** Último diagnóstico de gestación (positivo o negativo). */
  ultimoDiagnostico: { fecha: string; resultado: 'POSITIVO' | 'NEGATIVO' } | null
}

/**
 * Calcula FPP, días abiertos y alerta de re-celo a partir del historial de eventos
 * ordenado cronológicamente (asc).
 */
export function calcularEstadoReproductivo(eventos: EventoAnimal[]): EstadoReproductivoCompleto {
  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
  )
  const servicios = ordenados.filter((e) => e.tipo_evento === 'SERVICIO')
  const partos = ordenados.filter((e) => e.tipo_evento === 'PARTO')
  const diagnosticos = ordenados.filter((e) => e.tipo_evento === 'DIAGNOSTICO_GESTACION')
  const abortos = ordenados.filter((e) => e.tipo_evento === 'ABORTO')

  const ultimoParto = partos[partos.length - 1] ?? null
  const ultimoServicio = servicios[servicios.length - 1] ?? null
  const ultimoDiagPositivo = [...diagnosticos].reverse().find((d) => d.motivo_id === 'POSITIVO')
  const ultimoDiagNegativo = [...diagnosticos].reverse().find((d) => d.motivo_id === 'NEGATIVO')
  const ultimoDiagnostico = ultimoDiagPositivo || ultimoDiagNegativo || null

  let fechaProbableParto: string | null = null
  if (ultimoDiagPositivo) {
    const fechaServicio = ultimoServicio
      ? new Date(ultimoServicio.fecha_evento)
      : new Date(ultimoDiagPositivo.fecha_evento)
    const fpp = new Date(fechaServicio)
    fpp.setDate(fpp.getDate() + DIAS_GESTACION_BOVINO)
    fechaProbableParto = fpp.toISOString().split('T')[0]
  } else if (ultimoServicio && !ultimoDiagNegativo) {
    const fpp = new Date(ultimoServicio.fecha_evento)
    fpp.setDate(fpp.getDate() + DIAS_GESTACION_BOVINO)
    fechaProbableParto = fpp.toISOString().split('T')[0]
  }

  let diasAbiertos: number | null = null
  if (ultimoParto) {
    const fechaUltimoParto = new Date(ultimoParto.fecha_evento).getTime()
    const servicioPosterior = servicios.find((s) => new Date(s.fecha_evento).getTime() > fechaUltimoParto)
    const hasta = servicioPosterior
      ? new Date(servicioPosterior.fecha_evento).getTime()
      : Date.now()
    diasAbiertos = Math.floor((hasta - fechaUltimoParto) / (24 * 60 * 60 * 1000))
  }

  let alertaRecelo = false
  let mensajeAlertaRecelo: string | null = null
  if (ultimoServicio && !ultimoDiagPositivo) {
    const hayAbortoDespues = abortos.some(
      (a) => new Date(a.fecha_evento).getTime() > new Date(ultimoServicio!.fecha_evento).getTime()
    )
    const hayPartoDespues = ultimoParto && new Date(ultimoParto.fecha_evento).getTime() > new Date(ultimoServicio.fecha_evento).getTime()
    if (!hayAbortoDespues && !hayPartoDespues) {
      const diasDesdeServicio = Math.floor(
        (Date.now() - new Date(ultimoServicio.fecha_evento).getTime()) / (24 * 60 * 60 * 1000)
      )
      if (diasDesdeServicio >= DIAS_ALERTA_RECELO) {
        alertaRecelo = true
        mensajeAlertaRecelo = `Han pasado ${diasDesdeServicio} días desde el último servicio sin confirmación de preñez. Considere re-celo o nuevo diagnóstico.`
      }
    }
  }

  return {
    fechaProbableParto,
    diasAbiertos,
    alertaRecelo,
    mensajeAlertaRecelo,
    ultimoServicio: ultimoServicio?.fecha_evento ?? null,
    ultimoParto: ultimoParto?.fecha_evento ?? null,
    ultimoDiagnostico: ultimoDiagnostico
      ? { fecha: ultimoDiagnostico.fecha_evento, resultado: ultimoDiagnostico.motivo_id as 'POSITIVO' | 'NEGATIVO' }
      : null,
  }
}
