import { AuthRepository } from '@/domain/repositories/AuthRepository'
import { User } from '@/domain/entities/User'

export class RegistrarEmpleadoUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: {
    email: string
    nombre: string
    apellido: string
    telefono?: string
    id_rancho_jefe: string
    pin_kiosko: string
  }): Promise<{ user: User | null; error: string | null }> {
    if (!data.email || !data.nombre || !data.id_rancho_jefe || !data.pin_kiosko) {
      return { user: null, error: 'Faltan datos obligatorios para el empleado' }
    }

    if (data.pin_kiosko.length !== 4) {
      return { user: null, error: 'El PIN debe ser de 4 dígitos' }
    }

    // Registramos al empleado con una contraseña temporal (el email servirá para confirmación)
    // El rol será 'TRABAJADOR'
    return await this.authRepository.register({
      email: data.email,
      password: `Cownect${data.pin_kiosko}`, // Contraseña inicial temporal
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      rol: 'TRABAJADOR' as any,
      id_rancho_jefe: data.id_rancho_jefe,
      pin_kiosko: data.pin_kiosko,
      plan: 'gratuito', // El empleado no paga su propio plan
    } as any)
  }
}
