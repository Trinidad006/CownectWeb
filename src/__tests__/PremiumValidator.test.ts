import { PremiumValidator } from '@/domain/validators/PremiumValidator'
import { User } from '@/domain/entities/User'

describe('PremiumValidator', () => {
  const usuarioFreemium: User = {
    id: 'user1',
    email: 'test@example.com',
    plan: 'gratuito',
    suscripcion_activa: false,
    rancho_ids: [],
    rancho_actual_id: undefined
  }

  const usuarioPremium: User = {
    id: 'user2',
    email: 'premium@example.com',
    plan: 'premium',
    suscripcion_activa: true,
    rancho_ids: ['rancho1'],
    rancho_actual_id: 'rancho1'
  }

  const usuarioPremiumInactivo: User = {
    id: 'user3',
    email: 'inactive@example.com',
    plan: 'premium',
    suscripcion_activa: false,
    rancho_ids: ['rancho1'],
    rancho_actual_id: 'rancho1'
  }

  describe('validarPremium', () => {
    test('debe validar correctamente usuario freemium', () => {
      const result = PremiumValidator.validarPremium(usuarioFreemium)
      expect(result.valido).toBe(false)
      expect(result.error).toContain('Premium')
    })

    test('debe validar correctamente usuario premium activo', () => {
      const result = PremiumValidator.validarPremium(usuarioPremium)
      expect(result.valido).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('debe rechazar usuario premium con suscripción inactiva', () => {
      const result = PremiumValidator.validarPremium(usuarioPremiumInactivo)
      expect(result.valido).toBe(false)
      expect(result.error).toContain('activa')
    })
  })

  describe('validarAccesoMultipleRanchos', () => {
    test('debe permitir acceso a múltiples ranchos para usuario premium', () => {
      const result = PremiumValidator.validarAccesoMultipleRanchos(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar acceso a múltiples ranchos para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoMultipleRanchos(usuarioFreemium)
      expect(result.valido).toBe(false)
      expect(result.error).toContain('Premium')
    })
  })

  describe('validarAccesoEmpleados', () => {
    test('debe permitir gestión de empleados para usuario premium', () => {
      const result = PremiumValidator.validarAccesoEmpleados(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar gestión de empleados para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoEmpleados(usuarioFreemium)
      expect(result.valido).toBe(false)
    })
  })

  describe('validarAccesoProduccion', () => {
    test('debe permitir registro de producción para usuario premium', () => {
      const result = PremiumValidator.validarAccesoProduccion(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar registro de producción para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoProduccion(usuarioFreemium)
      expect(result.valido).toBe(false)
    })
  })

  describe('validarAccesoHistorialClinico', () => {
    test('debe permitir historial clínico avanzado para usuario premium', () => {
      const result = PremiumValidator.validarAccesoHistorialClinico(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar historial clínico avanzado para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoHistorialClinico(usuarioFreemium)
      expect(result.valido).toBe(false)
    })
  })

  describe('validarAccesoTareas', () => {
    test('debe permitir sistema de tareas para usuario premium', () => {
      const result = PremiumValidator.validarAccesoTareas(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar sistema de tareas para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoTareas(usuarioFreemium)
      expect(result.valido).toBe(false)
    })
  })

  describe('validarAccesoCertificadoCownect', () => {
    test('debe permitir certificado Cownect para usuario premium', () => {
      const result = PremiumValidator.validarAccesoCertificadoCownect(usuarioPremium)
      expect(result.valido).toBe(true)
    })

    test('debe denegar certificado Cownect para usuario freemium', () => {
      const result = PremiumValidator.validarAccesoCertificadoCownect(usuarioFreemium)
      expect(result.valido).toBe(false)
    })
  })
})
