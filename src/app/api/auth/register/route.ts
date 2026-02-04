import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthRepository } from '@/infrastructure/repositories/SupabaseAuthRepository'
import { RegisterUseCase } from '@/domain/use-cases/auth/RegisterUseCase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, apellido, telefono } = body

    const authRepository = new SupabaseAuthRepository()
    const registerUseCase = new RegisterUseCase(authRepository)

    const result = await registerUseCase.execute({
      email,
      password,
      nombre,
      apellido,
      telefono,
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

