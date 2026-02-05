import { Animal } from '../entities/Animal'

export interface AnimalRepository {
  getAll(userId: string): Promise<Animal[]>
  getById(id: string, userId: string): Promise<Animal | null>
  create(animal: Animal): Promise<Animal>
  update(id: string, animal: Partial<Animal>): Promise<Animal>
  delete(id: string, userId: string): Promise<void>
  getForSale(): Promise<Animal[]>
  markForSale(id: string, price: number, userId: string): Promise<void>
}

