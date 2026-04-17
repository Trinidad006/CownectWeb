import { Tarea } from '@/domain/entities/Tarea'
import { TareaRepository } from '@/domain/repositories/TareaRepository'

export class CrearTareaUseCase {
  constructor(private readonly tareaRepository: TareaRepository) {}

  async execute(tarea: Tarea): Promise<{ tarea: Tarea | null; error: string | null }> {
    if (!tarea.usuario_id) {
      return { tarea: null, error: 'Se requiere el identificador del usuario.' }
    }
    if (!tarea.titulo || !tarea.titulo.trim()) {
      return { tarea: null, error: 'El título de la tarea es obligatorio.' }
    }
    const nuevaTarea = await this.tareaRepository.create({
      ...tarea,
      estado: tarea.estado ?? 'PENDIENTE',
    })
    return { tarea: nuevaTarea, error: null }
  }
}
