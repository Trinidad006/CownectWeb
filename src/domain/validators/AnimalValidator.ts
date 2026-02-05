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
      animal.documento_patente_fierro
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
    
    if (madre.vendido_a || madre.estado_venta === 'vendido') {
      return { valido: false, error: 'La madre seleccionada fue vendida' }
    }
    
    return { valido: true }
  }
}

