import { Animal } from '@/domain/entities/Animal'
import { Rancho } from '@/domain/entities/Rancho'

export interface CertificadoCownectResultado {
  elegible: boolean
  motivo?: string
  animalesConteo: number
  fechaEvaluacion: string
  mensaje: string
}

export class CertificadoCownectService {
  static MINIMO_VACAS_CERTIFICADO = 100

  static evaluarElegibilidad(rancho: Rancho, animales: Animal[]): CertificadoCownectResultado {
    const animalesActivos = animales.filter((animal) => animal.activo !== false && animal.sexo === 'H')
    const cantidad = animalesActivos.length
    const fechaEvaluacion = new Date().toISOString()

    if (cantidad < this.MINIMO_VACAS_CERTIFICADO) {
      return {
        elegible: false,
        animalesConteo: cantidad,
        fechaEvaluacion,
        motivo: `Se requieren al menos ${this.MINIMO_VACAS_CERTIFICADO} hembras activas para el certificado Cownect. Actualmente hay ${cantidad}.`,
        mensaje: 'El rancho todavía no cumple con el umbral de certificación Cownect.',
      }
    }

    return {
      elegible: true,
      animalesConteo: cantidad,
      fechaEvaluacion,
      mensaje: `Rancho elegible para certificación Cownect. Se encontraron ${cantidad} hembras activas.`,
    }
  }
}
