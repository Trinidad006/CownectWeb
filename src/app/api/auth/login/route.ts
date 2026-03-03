import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'
import { LoginUseCase } from '@/domain/use-cases/auth/LoginUseCase'

// Nota: La autenticación se realiza en el cliente con Firebase Auth.
// Esta ruta puede usarse para validación server-side si se pasa un token.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const authRepository = new FirebaseAuthRepository()
    const loginUseCase = new LoginUseCase(authRepository)

    const result = await loginUseCase.execute({
      email,
      password,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { user: result.user, message: 'Inicio de sesión exitoso' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
