import { Animal } from '../entities/Animal'

export class AnimalValidator {
  static validarEstadoVenta(estado: string): estado is 'en_venta' | 'proceso_venta' | 'vendido' {
    return ['en_venta', 'proceso_venta', 'vendido'].includes(estado)
  }

  static puedePonerseEnVenta(animal: Animal): { valido: boolean; error?: string } {
    if (animal.estado_venta === 'vendido') {
      return { valido: false, error: 'Este animal ya fue vendido' }
    }
    if (animal.estado_venta === 'proceso_venta') {
      return { valido: false, error: 'Este animal está en proceso de venta' }
    }
    return { valido: true }
  }

  static puedeComprarse(animal: Animal): { valido: boolean; error?: string } {
    if (!animal.en_venta) {
      return { valido: false, error: 'Este animal no está en venta' }
    }
    if (animal.estado_venta === 'vendido') {
      return { valido: false, error: 'Este animal ya fue vendido' }
    }
    if (animal.estado_venta === 'proceso_venta') {
      return { valido: false, error: 'Este animal está en proceso de venta' }
    }
    return { valido: true }
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
    
    if (madre.estado_venta === 'vendido') {
      return { valido: false, error: 'La madre seleccionada fue vendida' }
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
    
    // Aquí se pueden agregar más validaciones en el futuro
    // Por ejemplo: validar fecha de nacimiento, especie, etc.
    
    return {
      valido: errores.length === 0,
      errores
    }
  }
}

