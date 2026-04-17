import { RegistroClinico } from '@/domain/entities/RegistroClinico'
import { RegistroClinicoRepository } from '@/domain/repositories/RegistroClinicoRepository'

export class RegistrarRegistroClinicoUseCase {
  constructor(private readonly registroClinicoRepository: RegistroClinicoRepository) {}

  async execute(registro: RegistroClinico): Promise<{ registro: RegistroClinico | null; error: string | null }> {
    if (!registro.usuario_id) {
      return { registro: null, error: 'Se requiere el usuario que registra el diagnóstico.' }
    }
    if (!registro.enfermedad || !registro.enfermedad.trim()) {
      return { registro: null, error: 'El nombre de la enfermedad es obligatorio.' }
    }
    if (!registro.fecha_registro) {
      return { registro: null, error: 'La fecha de registro es obligatoria.' }
    }
    const result = await this.registroClinicoRepository.create(registro)
    return { registro: result, error: null }
  }
}
