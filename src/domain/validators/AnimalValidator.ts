import { Animal } from '../entities/Animal'
import { InvalidSiniigaFormat } from '../exceptions/InvalidSiniigaFormat'

/** Estados productivos válidos para hembras */
export const ESTADOS_HEMBRA = ['Cría', 'Becerra', 'Destetado', 'Vaca Ordeña', 'Vaca Seca'] as const
/** Estados productivos válidos para machos */
export const ESTADOS_MACHO = ['Becerro', 'Novillo', 'Toro de Engorda', 'Toro Reproductor'] as const

export class AnimalValidator {
  /**
   * Valida que el estado productivo coincida con el sexo del animal.
   * Hembra solo puede tener estados de hembras; macho solo de machos.
   */
  static validarSexoConEstado(sexo: 'M' | 'H', estado: string): { valido: boolean; error?: string } {
    if (!estado || !estado.trim()) return { valido: true }
    const e = estado.trim()
    if (sexo === 'H') {
      if (ESTADOS_MACHO.includes(e as any)) {
        return { valido: false, error: 'Una hembra no puede tener estado de macho (ej. Toro de Engorda). Elija un estado de hembra.' }
      }
      if (!ESTADOS_HEMBRA.includes(e as any)) {
        return { valido: false, error: 'Seleccione un estado productivo válido para hembra.' }
      }
    } else {
      if (ESTADOS_HEMBRA.includes(e as any)) {
        return { valido: false, error: 'Un macho no puede tener estado de hembra (ej. Vaca Ordeña). Elija un estado de macho.' }
      }
      if (!ESTADOS_MACHO.includes(e as any)) {
        return { valido: false, error: 'Seleccione un estado productivo válido para macho.' }
      }
    }
    return { valido: true }
  }

  /**
   * Formatea el arete al estilo SINIIGA mientras el usuario escribe.
   * Formato: XXX-XXXXXX-XXXXX (3 letras, 6 dígitos, 5 dígitos).
   * Solo permite letras y números; inserta los guiones automáticamente.
   */
  static formatNumeroIdentificacionSINIIGA(val: string): string {
    const raw = (val || '').replace(/[\s\-]/g, '')
    const letters = (raw.match(/[A-Za-z]/g) || []).slice(0, 3).join('').toUpperCase()
    const digits = (raw.replace(/[^0-9]/g, '')).slice(0, 11)
    const part2 = digits.slice(0, 6)
    const part3 = digits.slice(6, 11)
    if (!part2 && !part3) return letters
    if (!part3) return `${letters}-${part2}`
    return `${letters}-${part2}-${part3}`
  }
  static validarDocumentosCompletos(animal: Animal): boolean {
    return !!(
      animal.documento_guia_transito &&
      animal.documento_factura_venta &&
      animal.documento_certificado_movilizacion &&
      animal.documento_certificado_zoosanitario &&
      animal.documento_patente_fierro &&
      animal.foto
    )
  }

  /**
   * Valida el estado de documentación del animal
   * Retorna 'completa' si todos los documentos están presentes, 'incompleta' en caso contrario
   */
  static validarEstadoDocumentacion(animal: Animal): 'completa' | 'incompleta' {
    const documentosCompletos = this.validarDocumentosCompletos(animal)
    return documentosCompletos ? 'completa' : 'incompleta'
  }

  static validarMadre(madre: Animal | null | undefined, esCria: boolean): { valido: boolean; error?: string } {
    if (!esCria) {
      return { valido: true } // No es cría, no necesita madre
    }
    
    if (!madre) {
      return { valido: false, error: 'Debe seleccionar una madre para la cría' }
    }
    
    if (madre.sexo !== 'H') {
      return { valido: false, error: 'La madre seleccionada debe ser una hembra' }
    }
    
    if (madre.estado?.toLowerCase() === 'muerto' || madre.estado?.toLowerCase() === 'robado') {
      return { valido: false, error: 'La madre seleccionada no está disponible' }
    }
    
    if (madre.activo === false) {
      return { valido: false, error: 'La madre seleccionada no está disponible' }
    }
    
    return { valido: true }
  }

  /**
   * Valida el formato del número de identificación SINIIGA
   * Formato esperado: XXX-XXXXXX-XXXXX 
   * - 3 letras mayúsculas (código de país, ej: MEX)
   * - Guion
   * - 6 dígitos numéricos
   * - Guion  
   * - 5 dígitos numéricos
   * Ejemplo válido: MEX-123456-12345
   */
  static validarFormatoSINIIGA(numeroIdentificacion: string): { valido: boolean; error?: string } {
    // Normalizar: convertir a mayúsculas y eliminar espacios
    const numeroNormalizado = numeroIdentificacion.trim().toUpperCase()
    
    // Patrón SINIIGA: XXX-XXXXXX-XXXXX
    const siniiigaPattern = /^[A-Z]{3}-[0-9]{6}-[0-9]{5}$/
    
    if (!siniiigaPattern.test(numeroNormalizado)) {
      return {
        valido: false,
        error: 'El formato del arete SINIIGA es inválido. Debe ser: XXX-XXXXXX-XXXXX (ejemplo: MEX-123456-12345)'
      }
    }
    
    return { valido: true }
  }

  /**
   * Valida el número de identificación completo:
   * - Formato SINIIGA si se proporciona
   * - No puede estar vacío si se proporciona
   * - Retorna resultado estructurado para mejor manejo de errores
   */
  static validarNumeroIdentificacion(numeroIdentificacion: string | undefined): { valido: boolean; error?: string } {
    // Si no se proporciona, es válido (es opcional)
    if (!numeroIdentificacion || !numeroIdentificacion.trim()) {
      return { valido: true }
    }
    
    const numeroTrimmed = numeroIdentificacion.trim()
    
    // No puede estar vacío después de trim
    if (numeroTrimmed.length === 0) {
      return { valido: false, error: 'El número de identificación no puede estar vacío' }
    }
    
    // Validar formato SINIIGA (obligatorio si se proporciona)
    const validacionFormato = this.validarFormatoSINIIGA(numeroTrimmed)
    if (!validacionFormato.valido) {
      return validacionFormato
    }
    
    return { valido: true }
  }

  /**
   * Valida un animal completo antes de crear o actualizar
   * Retorna resultado estructurado con todos los errores encontrados
   */
  static validarAnimalCompleto(animal: Animal, esEdicion: boolean = false): { valido: boolean; errores: string[] } {
    const errores: string[] = []
    
    // Validar número de identificación
    if (animal.numero_identificacion) {
      const validacionId = this.validarNumeroIdentificacion(animal.numero_identificacion)
      if (!validacionId.valido && validacionId.error) {
        errores.push(validacionId.error)
      }
    }
    
    // Validar que estado productivo coincida con sexo
    if (animal.sexo && animal.estado && (ESTADOS_HEMBRA.includes(animal.estado as any) || ESTADOS_MACHO.includes(animal.estado as any))) {
      const validacionSexo = this.validarSexoConEstado(animal.sexo, animal.estado)
      if (!validacionSexo.valido && validacionSexo.error) {
        errores.push(validacionSexo.error)
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    }
  }

  /**
   * Valida un identificador SINIIGA simplificado:
   * - Debe contener exactamente 10 dígitos numéricos.
   * - No se permiten letras ni caracteres especiales.
   * Lanza InvalidSiniigaFormat si no cumple las reglas.
   */
  static validateSiniiga(id: string): void {
    const trimmed = (id ?? '').trim()

    // Debe tener exactamente 10 caracteres
    if (trimmed.length !== 10) {
      throw new InvalidSiniigaFormat()
    }

    // Solo dígitos numéricos
    if (!/^[0-9]{10}$/.test(trimmed)) {
      throw new InvalidSiniigaFormat()
    }
  }
}

