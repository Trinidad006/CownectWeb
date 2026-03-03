import { Animal } from '../entities/Animal'

export interface AnimalRepository {
  getAll(userId: string): Promise<Animal[]>
  getById(id: string, userId: string): Promise<Animal | null>
  create(animal: Animal): Promise<Animal>
  update(id: string, animal: Partial<Animal>): Promise<Animal>
  delete(id: string, userId: string): Promise<void>
  findByNumeroIdentificacion(
    numeroIdentificacion: string,
    userId: string,
    excludeId?: string
  ): Promise<Animal | null>

  /**
   * Métodos simplificados usados en pruebas de integración (TC-INV-05)
   * contra el emulador de Firestore. Trabajan sobre una colección
   * minimalista de animales indexados por su SINIIGA.
   */
  save(animal: {
    siniiga: string
    nombre: string
    raza: string
    estado: string
  }): Promise<void>

  findById(siniiga: string): Promise<{
    siniiga: string
    nombre: string
    raza: string
    estado: string
  } | null>

  updateStatus(siniiga: string, estado: string): Promise<void>
}

