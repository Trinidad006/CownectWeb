import { Animal } from '../entities/Animal'
import { AnimalValidator } from './AnimalValidator'
import { EDAD_MINIMA_MESES_REPRODUCCION } from '../constants/reproduccion'

export interface ValidacionReproductivaResult {
  valido: boolean
  error?: string
}

/**
 * Validaciones para el submódulo de Gestión de Fertilidad y Ciclo Reproductivo.
 * - Solo hembras (sexo === 'H').
 * - Edad > 15 meses (madurez sexual).
 * - Identificación SINIIGA válida (todo registro debe estar ligado a código válido).
 */
export class ReproductivoValidator {
  /**
   * Valida que el animal sea hembra.
   */
  static validarGeneroHembra(animal: Animal): ValidacionReproductivaResult {
    if (animal.sexo !== 'H') {
      return {
        valido: false,
        error: 'Solo se permiten registros reproductivos para hembras. El animal seleccionado no es hembra.',
      }
    }
    return { valido: true }
  }

  /**
   * Valida que la edad al momento del evento sea mayor a 15 meses (madurez sexual).
   * fecha_evento: fecha del evento (ISO); fecha_nacimiento del animal en ISO o YYYY-MM-DD.
   */
  static validarEdadMinima(
    fechaNacimiento: string | undefined,
    fechaEvento: string
  ): ValidacionReproductivaResult {
    if (!fechaNacimiento || !fechaNacimiento.trim()) {
      return {
        valido: false,
        error: 'El animal debe tener fecha de nacimiento registrada para validar madurez sexual.',
      }
    }
    const nacimiento = new Date(fechaNacimiento)
    const evento = new Date(fechaEvento)
    if (isNaN(nacimiento.getTime()) || isNaN(evento.getTime())) {
      return { valido: false, error: 'Fechas inválidas.' }
    }
    const meses = (evento.getTime() - nacimiento.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    if (meses < EDAD_MINIMA_MESES_REPRODUCCION) {
      return {
        valido: false,
        error: `El animal debe tener más de ${EDAD_MINIMA_MESES_REPRODUCCION} meses (madurez sexual) para registrar eventos reproductivos. Edad actual aproximada: ${Math.floor(meses)} meses.`,
      }
    }
    return { valido: true }
  }

  /**
   * Valida que el registro esté ligado a un código SINIIGA válido.
   * Acepta formato XXX-XXXXXX-XXXXX (ej. MEX-123456-12345) o 484/MX + Estado + 8 dígitos (ej. 484MX-XX-12345678).
   */
  static validarSiniigaLigado(numeroIdentificacion: string | undefined): ValidacionReproductivaResult {
    if (!numeroIdentificacion || !numeroIdentificacion.trim()) {
      return {
        valido: false,
        error: 'Todo registro reproductivo debe estar ligado a un código SINIIGA válido. Registre el arete del animal.',
      }
    }
    const n = numeroIdentificacion.trim().toUpperCase()
    // Formato XXX-XXXXXX-XXXXX (ej. MEX-123456-12345)
    const formatoArete = /^[A-Z]{3}-[0-9]{6}-[0-9]{5}$/.test(n)
    // Formato 484/MX + Estado (2 caracteres) + 8 dígitos
    const formato484 = /^484MX-[A-Z0-9]{2}-[0-9]{8}$/.test(n) || /^484\/MX-[A-Z0-9]{2}-[0-9]{8}$/.test(n)
    if (formatoArete || formato484) {
      return { valido: true }
    }
    return {
      valido: false,
      error:
        'Código SINIIGA inválido. Use formato XXX-XXXXXX-XXXXX (ej. MEX-123456-12345) o 484/MX + Estado + 8 dígitos.',
    }
  }

  /**
   * Ejecuta todas las validaciones reproductivas para un animal y fecha de evento.
   */
  static validarParaRegistroReproductivo(
    animal: Animal,
    fechaEvento: string
  ): ValidacionReproductivaResult {
    const genero = this.validarGeneroHembra(animal)
    if (!genero.valido) return genero
    const edad = this.validarEdadMinima(animal.fecha_nacimiento, fechaEvento)
    if (!edad.valido) return edad
    const siniiga = this.validarSiniigaLigado(animal.numero_identificacion)
    if (!siniiga.valido) return siniiga
    return { valido: true }
  }
}
