import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'
import { RegisterUseCase } from '@/domain/use-cases/auth/RegisterUseCase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, apellido, telefono, rancho, rancho_hectareas, rancho_pais, rancho_ciudad, rancho_direccion, rancho_descripcion, moneda } = body

    const authRepository = new FirebaseAuthRepository()
    const registerUseCase = new RegisterUseCase(authRepository)

    const result = await registerUseCase.execute({
      email,
      password,
      nombre,
      apellido,
      telefono,
      rancho,
      rancho_hectareas: rancho_hectareas ? parseFloat(rancho_hectareas) : undefined,
      rancho_pais,
      rancho_ciudad,
      rancho_direccion,
      rancho_descripcion,
      moneda,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { user: result.user, message: 'Usuario registrado exitosamente' },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
