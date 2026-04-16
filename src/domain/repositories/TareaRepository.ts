import { Tarea } from '@/domain/entities/Tarea'

export interface TareaRepository {
  getAllByUser(usuarioId: string): Promise<Tarea[]>
  getById(id: string, usuarioId: string): Promise<Tarea | null>
  create(tarea: Tarea): Promise<Tarea>
}
