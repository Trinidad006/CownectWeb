import { User } from '@/domain/entities/User'

export class PremiumValidator {
  /**
   * Valida que el usuario tenga plan premium activo
   * (Usado para funcionalidades de venta/comerciales que sigan siendo de pago)
   */
  static validarPremium(user: User): { valido: boolean; error?: string } {
    if (!user.plan || user.plan !== 'premium') {
      return {
        valido: false,
        error: 'Esta función requiere un plan Premium. Actualiza tu suscripción para acceder.'
      }
    }

    if (!user.suscripcion_activa) {
      return {
        valido: false,
        error: 'Tu suscripción Premium no está activa. Contacta soporte para reactivarla.'
      }
    }

    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a múltiples ranchos (GRATUITO según requerimiento)
   */
  static validarAccesoMultipleRanchos(user: User): { valido: boolean; error?: string } {
    // La gestión de múltiples ranchos es gratuita
    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a gestión de empleados (GRATUITO según requerimiento)
   */
  static validarAccesoEmpleados(user: User): { valido: boolean; error?: string } {
    // La gestión de empleados es gratuita
    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a registro de producción (GRATUITO según requerimiento)
   */
  static validarAccesoProduccion(user: User): { valido: boolean; error?: string } {
    // El registro de producción es gratuito
    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a historial clínico avanzado (GRATUITO según requerimiento)
   */
  static validarAccesoHistorialClinico(user: User): { valido: boolean; error?: string } {
    // El historial clínico es gratuito
    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a sistema de tareas (GRATUITO según requerimiento)
   */
  static validarAccesoTareas(user: User): { valido: boolean; error?: string } {
    // El sistema de tareas es gratuito
    return { valido: true }
  }

  /**
   * Valida que el usuario tenga acceso a certificado Cownect (premium)
   * (Esto se mantiene premium ya que es un aval comercial)
   */
  static validarAccesoCertificadoCownect(user: User): { valido: boolean; error?: string } {
    const premiumCheck = this.validarPremium(user)
    if (!premiumCheck.valido) {
      return premiumCheck
    }

    return { valido: true }
  }
}
