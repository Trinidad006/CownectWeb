import { Rancho } from '@/domain/entities/Rancho'

export interface RanchoRepository {
  getAll(usuarioId: string): Promise<Rancho[]>
  getById(id: string, usuarioId: string): Promise<Rancho | null>
  create(rancho: Rancho): Promise<Rancho>
  update(id: string, rancho: Partial<Rancho>): Promise<Rancho>
  delete(id: string, usuarioId: string): Promise<void>
}
