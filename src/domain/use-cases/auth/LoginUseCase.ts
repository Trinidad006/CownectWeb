import { AuthRepository } from '@/domain/repositories/AuthRepository'
import { User } from '@/domain/entities/User'

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: {
    email: string
    password: string
  }): Promise<{ user: User | null; error: string | null }> {
    // Validaciones
    if (!data.email || !data.password) {
      return { user: null, error: 'Email y contraseña son requeridos' }
    }

    return await this.authRepository.login(data)
  }
}

