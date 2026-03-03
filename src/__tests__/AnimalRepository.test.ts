// Polyfill mínimo para funciones de Node usadas por el SDK del emulador
;(global as any).setImmediate =
  (global as any).setImmediate || ((fn: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(fn, 0, ...args))

jest.setTimeout(20000)
jest.mock('../infrastructure/config/firebase', () => {
  // Configuramos una app aislada para las pruebas usando el emulador
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeApp } = require('firebase/app')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore')

  const app = initializeApp({ projectId: 'cownect-test' })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, 'localhost', 8080)

  return {
    getFirebaseDb: () => db,
  }
})

import { FirebaseAnimalRepository } from '../infrastructure/repositories/FirebaseAnimalRepository'

const repository = new FirebaseAnimalRepository()

describe('TC-INV-05: Persistencia en Repositorio (Firebase Emulator)', () => {
  const testAnimal = {
    siniiga: '3102938475',
    nombre: 'Vaca de Prueba',
    raza: 'Holstein',
    estado: 'activo',
  }

  test('Debe guardar, encontrar y actualizar un animal correctamente', async () => {
    // 1. Guardar un nuevo registro
    await repository.save(testAnimal)

    // 2. Recuperar el registro guardado
    const fetchedAnimal = await repository.findById(testAnimal.siniiga)

    // Resultado Esperado: Datos idénticos
    expect(fetchedAnimal).toBeDefined()
    expect(fetchedAnimal?.nombre).toBe(testAnimal.nombre)
    expect(fetchedAnimal?.siniiga).toBe(testAnimal.siniiga)

    // 3. Cambiar el estado a 'inactivo'
    await repository.updateStatus(testAnimal.siniiga, 'inactivo')
    const updatedAnimal = await repository.findById(testAnimal.siniiga)

    // Resultado Esperado: Operación exitosa y consistente
    expect(updatedAnimal?.estado).toBe('inactivo')
  })
})

