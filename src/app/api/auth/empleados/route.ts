import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'
import { RegistrarEmpleadoUseCase } from '@/domain/use-cases/auth/RegistrarEmpleadoUseCase'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'
import { generarPinKioskoUnico } from '@/infrastructure/utils/pinKioskoServer'

export async function POST(request: NextRequest) {
  try {
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'empleados')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { email, nombre, apellido, telefono, id_rancho_jefe } = body

    const pin_kiosko = await generarPinKioskoUnico()

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
      pin_kiosko,
      message: 'Empleado registrado. Guarda el PIN: solo se muestra una vez aquí.',
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error registrando empleado' }, { status: 500 })
  }
}
