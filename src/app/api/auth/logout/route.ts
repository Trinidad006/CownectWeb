import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthRepository } from '@/infrastructure/repositories/SupabaseAuthRepository'

export async function POST(request: NextRequest) {
  try {
    const authRepository = new SupabaseAuthRepository()
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

