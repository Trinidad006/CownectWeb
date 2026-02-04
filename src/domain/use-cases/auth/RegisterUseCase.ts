import { AuthRepository } from '@/domain/repositories/AuthRepository'
import { User } from '@/domain/entities/User'

export class RegisterUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: {
    email: string
    password: string
    nombre?: string
    apellido?: string
    telefono?: string
  }): Promise<{ user: User | null; error: string | null }> {
    // Validaciones
    if (!data.email || !data.password) {
      return { user: null, error: 'Email y contraseña son requeridos' }
    }

    if (data.password.length < 6) {
      return { user: null, error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    return await this.authRepository.register(data)
  }
}

