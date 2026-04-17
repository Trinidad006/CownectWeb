import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'
import { RegistrarEmpleadoUseCase } from '@/domain/use-cases/auth/RegistrarEmpleadoUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'

export async function POST(request: NextRequest) {
  try {
    // Validar acceso premium para gestión de empleados
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'empleados')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { email, nombre, apellido, telefono, id_rancho_jefe, pin_kiosko } = body

    const authRepository = new FirebaseAuthRepository()
    const useCase = new RegistrarEmpleadoUseCase(authRepository)

    const result = await useCase.execute({
      email,
      nombre,
      apellido,
      telefono,
      id_rancho_jefe,
      pin_kiosko,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      user: result.user, 
      message: 'Empleado registrado exitosamente. Se ha enviado un correo de verificación.' 
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error registrando empleado' }, { status: 500 })
  }
}
