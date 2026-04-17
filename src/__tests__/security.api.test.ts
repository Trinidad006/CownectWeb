import { TextEncoder, TextDecoder } from 'util'
;(global as any).TextEncoder = TextEncoder
;(global as any).TextDecoder = TextDecoder as any

// Cargamos supertest vía require para que use el polyfill anterior
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request: typeof import('supertest') = require('supertest')

const API_URL = 'http://localhost:3000'

describe('TC-PAY-06: Seguridad en Rutas Protegidas', () => {

  test('Debe devolver 403 si un usuario Freemium intenta usar funciones Premium', async () => {
    // 1. Simulamos una petición de un usuario no autorizado
    const response = await request(API_URL)
      .post('/api/premium-feature')
      .send({ userId: 'user_freemium_id', plan: 'freemium' })

    // Resultado Esperado: Error 403 (Prohibido)
    expect(response.status).toBe(403)
    expect(response.body.error).toMatch(/premium required|forbidden/i)
  })

  test('Debe permitir el acceso si el usuario es Premium', async () => {
    const response = await request(API_URL)
      .post('/api/premium-feature')
      .send({ userId: 'user_premium_id', plan: 'premium' })

    expect(response.status).toBe(200)
  })

  describe('Validación Premium en APIs Nuevas', () => {
    test('Debe devolver 403 para múltiples ranchos sin plan premium', async () => {
      const response = await request(API_URL)
        .post('/api/rancho')
        .send({
          usuario_id: 'user_freemium_id',
          nombre: 'Rancho Test',
          pais: 'México',
          ciudad: 'CDMX'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toMatch(/premium|requiere/i)
    })

    test('Debe devolver 403 para registro de producción sin plan premium', async () => {
      const response = await request(API_URL)
        .post('/api/produccion')
        .send({
          usuario_id: 'user_freemium_id',
          rancho_id: 'rancho_id',
          animal_id: 'animal_id',
          tipo: 'LECHE',
          cantidad: 10,
          unidad: 'LITROS'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toMatch(/premium|requiere/i)
    })

    test('Debe devolver 403 para historial clínico sin plan premium', async () => {
      const response = await request(API_URL)
        .post('/api/salud')
        .send({
          usuario_id: 'user_freemium_id',
          rancho_id: 'rancho_id',
          animal_id: 'animal_id',
          enfermedad: 'Mastitis',
          diagnostico: 'Inflamación de la ubre'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toMatch(/premium|requiere/i)
    })

    test('Debe devolver 403 para sistema de tareas sin plan premium', async () => {
      const response = await request(API_URL)
        .post('/api/tareas')
        .send({
          usuario_id: 'user_freemium_id',
          rancho_id: 'rancho_id',
          titulo: 'Vacunar ganado',
          descripcion: 'Vacuna contra aftosa'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toMatch(/premium|requiere/i)
    })

    test('Debe devolver 403 para certificado Cownect sin plan premium', async () => {
      const response = await request(API_URL)
        .post('/api/certificado')
        .send({
          usuario_id: 'user_freemium_id',
          rancho_id: 'rancho_id'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toMatch(/premium|requiere/i)
    })
  })
})


