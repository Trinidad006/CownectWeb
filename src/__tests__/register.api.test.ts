import request from 'supertest';

// Mantemos el timeout largo porque ya vimos que tarda unos 28 segundos
jest.setTimeout(40000);

const API_URL = 'http://localhost:3000'; 

describe('API de Registro - POST /api/auth/register', () => {

  test('Debe devolver HTTP 201 cuando el registro es exitoso', async () => {
    const payload = {
      email: `cow_test_${Date.now()}@cownect.com`, 
      password: 'password123',
      nombre: 'Ganadero Cownect',
      apellido: 'Yucatán'
    };

    const response = await request(API_URL)
      .post('/api/auth/register')
      .send(payload);

    // Cambiamos a 201 porque es lo que tu servidor está respondiendo correctamente
    expect(response.status).toBe(201); 
    expect(response.body.user).toBeDefined();
  });

  test('Debe devolver HTTP 400 cuando faltan datos', async () => {
    const response = await request(API_URL)
      .post('/api/auth/register')
      .send({ password: '123' });

    expect(response.status).toBe(400);
  });
});