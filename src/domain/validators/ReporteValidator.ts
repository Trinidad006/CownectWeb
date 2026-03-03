import { Reporte } from '../entities/Reporte'

export class ReporteValidator {
  /**
   * Valida que un reporte tenga los campos requeridos
   */
  static validarReporte(reporte: Partial<Reporte>): { valido: boolean; error?: string } {
    if (!reporte.reportador_id || !reporte.reportador_id.trim()) {
      return { valido: false, error: 'El ID del reportador es requerido' }
    }

    if (!reporte.reportado_id || !reporte.reportado_id.trim()) {
      return { valido: false, error: 'El ID del usuario reportado es requerido' }
    }

    if (reporte.reportador_id === reporte.reportado_id) {
      return { valido: false, error: 'No puedes reportarte a ti mismo' }
    }

    if (!reporte.motivo || !reporte.motivo.trim()) {
      return { valido: false, error: 'El motivo del reporte es requerido' }
    }

    return { valido: true }
  }

  /**
   * Valida que el motivo del reporte sea válido
   */
  static validarMotivo(motivo: string): { valido: boolean; error?: string } {
    const motivosValidos = [
      'contenido_inapropiado',
      'informacion_falsa',
      'comportamiento_abusivo',
      'spam',
      'fraude',
      'otro'
    ]

    if (!motivo || !motivo.trim()) {
      return { valido: false, error: 'El motivo del reporte es requerido' }
    }

    if (!motivosValidos.includes(motivo)) {
      return { valido: false, error: 'El motivo del reporte no es válido' }
    }

    return { valido: true }
  }

  /**
   * Valida que el estado del reporte sea válido
   */
  static validarEstado(estado: string): estado is 'pendiente' | 'aceptado' | 'rechazado' {
    return ['pendiente', 'aceptado', 'rechazado'].includes(estado)
  }

  /**
   * Valida un reporte completo antes de crear o actualizar
   */
  static validarReporteCompleto(reporte: Partial<Reporte>): { valido: boolean; errores: string[] } {
    const errores: string[] = []

    const validacionBasica = this.validarReporte(reporte)
    if (!validacionBasica.valido && validacionBasica.error) {
      errores.push(validacionBasica.error)
    }

    if (reporte.motivo) {
      const validacionMotivo = this.validarMotivo(reporte.motivo)
      if (!validacionMotivo.valido && validacionMotivo.error) {
        errores.push(validacionMotivo.error)
      }
    }

    if (reporte.estado && !this.validarEstado(reporte.estado)) {
      errores.push('El estado del reporte no es válido')
    }

    return {
      valido: errores.length === 0,
      errores
    }
  }
}

