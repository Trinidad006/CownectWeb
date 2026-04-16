import { Produccion } from '@/domain/entities/Produccion'

export interface ProduccionRepository {
  getAllByUser(usuarioId: string): Promise<Produccion[]>
  getById(id: string, usuarioId: string): Promise<Produccion | null>
  create(produccion: Produccion): Promise<Produccion>
}
