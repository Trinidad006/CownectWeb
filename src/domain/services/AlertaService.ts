import { Animal } from '@/domain/entities/Animal'
import { EstadoReproductivoCompleto } from './EstadoReproductivoService'
import { Vacunacion } from '@/domain/entities/Vacunacion'

export type AlertaTipo = 'RECELO' | 'VACUNACION' | 'DESTETE' | 'CERTIFICADO' | 'PRODUCCION'

export interface Alerta {
  tipo: AlertaTipo
  mensaje: string
  animal_id?: string
  rancho_id?: string
  fechaProxima?: string
}

const DIAS_UMBRAL_VACUNACION = 7

function estaProximaVencimiento(fecha?: string): boolean {
  if (!fecha) return false
  const target = new Date(fecha)
  const hoy = new Date()
  const dias = Math.ceil((target.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000))
  return dias <= DIAS_UMBRAL_VACUNACION && dias >= 0
}

export class AlertaService {
  static generarAlertasReproductivas(
    estado: EstadoReproductivoCompleto,
    animal: Animal
  ): Alerta[] {
    const alertas: Alerta[] = []
    if (estado.alertaRecelo) {
      alertas.push({
        tipo: 'RECELO',
        mensaje: `La hembra ${animal.nombre || animal.numero_identificacion || 'sin identificar'} puede estar en recelo. ${estado.mensajeAlertaRecelo || ''}`.trim(),
        animal_id: animal.id,
      })
    }
    return alertas
  }

  static generarAlertasVacunacion(
    vacunaciones: Vacunacion[],
    animal: Animal
  ): Alerta[] {
    return vacunaciones
      .filter((v) => estaProximaVencimiento(v.proxima_dosis))
      .map((v) => ({
        tipo: 'VACUNACION',
        mensaje: `Vacunación próxima para ${animal.nombre || animal.numero_identificacion || 'el animal'}: ${v.tipo_vacuna} el ${v.proxima_dosis}.`, 
        animal_id: animal.id,
        fechaProxima: v.proxima_dosis,
      }))
  }
}
