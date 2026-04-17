import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/infrastructure/utils/auth'
import { PremiumValidator } from '@/domain/validators/PremiumValidator'

export type PremiumValidationType =
  | 'premium'
  | 'multiple_ranchos'
  | 'empleados'
  | 'produccion'
  | 'historial_clinico'
  | 'tareas'
  | 'certificado_cownect'

export class PremiumAPIMiddleware {
  /**
   * Middleware para validar acceso premium en APIs
   */
  static async validarAccesoPremium(
    request: NextRequest,
    tipoValidacion: PremiumValidationType
  ): Promise<{ valido: boolean; response?: NextResponse; user?: any }> {
    try {
      // Obtener usuario autenticado
      const user = await getCurrentUser()
      if (!user) {
        return {
          valido: false,
          response: NextResponse.json(
            { error: 'Usuario no autenticado' },
            { status: 401 }
          )
        }
      }

      // Validar según el tipo requerido
      let validacion
      switch (tipoValidacion) {
        case 'premium':
          validacion = PremiumValidator.validarPremium(user)
          break
        case 'multiple_ranchos':
          validacion = PremiumValidator.validarAccesoMultipleRanchos(user)
          break
        case 'empleados':
          validacion = PremiumValidator.validarAccesoEmpleados(user)
          break
        case 'produccion':
          validacion = PremiumValidator.validarAccesoProduccion(user)
          break
        case 'historial_clinico':
          validacion = PremiumValidator.validarAccesoHistorialClinico(user)
          break
        case 'tareas':
          validacion = PremiumValidator.validarAccesoTareas(user)
          break
        case 'certificado_cownect':
          validacion = PremiumValidator.validarAccesoCertificadoCownect(user)
          break
        default:
          return {
            valido: false,
            response: NextResponse.json(
              { error: 'Tipo de validación no válido' },
              { status: 400 }
            )
          }
      }

      if (!validacion.valido) {
        return {
          valido: false,
          response: NextResponse.json(
            { error: validacion.error },
            { status: 403 }
          )
        }
      }

      return { valido: true, user }
    } catch (error) {
      console.error('Error en validación premium:', error)
      return {
        valido: false,
        response: NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        )
      }
    }
  }
}
