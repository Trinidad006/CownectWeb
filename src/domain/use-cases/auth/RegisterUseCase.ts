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
    // Datos opcionales del rancho (si los pides en el formulario de registro)
    rancho?: string
    rancho_hectareas?: number
    rancho_pais?: string
    rancho_ciudad?: string
    rancho_direccion?: string
    rancho_descripcion?: string
    moneda?: string
  }): Promise<{ user: User | null; error: string | null }> {
    // Validaciones
    if (!data.email || !data.password) {
      return { user: null, error: 'Email y contraseña son requeridos' }
    }

    if (data.password.length < 6) {
      return { user: null, error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    // El repositorio se encargará de asignarle el rol 'PROPIETARIO'
    return await this.authRepository.register(data)
  }
}
