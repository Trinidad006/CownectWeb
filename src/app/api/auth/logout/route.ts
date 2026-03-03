import { NextRequest, NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@/infrastructure/repositories/FirebaseAuthRepository'

// La sesión se cierra en el cliente con signOut() de Firebase.
// Esta ruta puede usarse para limpiar cookies o sesiones server-side si se implementan.
export async function POST(request: NextRequest) {
  try {
    const authRepository = new FirebaseAuthRepository()
    await authRepository.logout()

    return NextResponse.json(
      { message: 'Sesión cerrada exitosamente' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
