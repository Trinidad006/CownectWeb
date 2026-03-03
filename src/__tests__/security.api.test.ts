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
})


