import { RegistroClinico } from '@/domain/entities/RegistroClinico'

export interface RegistroClinicoRepository {
  getAllByUser(usuarioId: string): Promise<RegistroClinico[]>
  getById(id: string, usuarioId: string): Promise<RegistroClinico | null>
  create(registro: RegistroClinico): Promise<RegistroClinico>
}
