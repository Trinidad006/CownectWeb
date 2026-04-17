import { NextRequest, NextResponse } from 'next/server'
import { firestoreServiceServer } from '@/infrastructure/services/firestoreServiceServer'

/**
 * POST /api/buy-requests
 * Body: { fromUserId, toUserId, animalIds?, mensajeInicial }
 *
 * GET /api/buy-requests?userId=...
 * Devuelve { received, sent } para el usuario.
 *
 * Nota: para un entorno real, deberíamos inferir fromUserId a partir
 * del token de autenticación, no desde el body. Por ahora se asume
 * que el cliente envía el uid correcto.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromUserId, toUserId, animalIds, mensajeInicial } = body || {}

    if (!fromUserId || !toUserId || !mensajeInicial) {
      return NextResponse.json(
        { error: 'fromUserId, toUserId y mensajeInicial son requeridos' },
        { status: 400 }
      )
    }

    const id = await firestoreServiceServer.createBuyRequest({
      fromUserId,
      toUserId,
      animalIds,
      mensajeInicial,
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    console.error('create buy request:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear buy request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const data = await firestoreServiceServer.getBuyRequestsForUser(userId)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('get buy requests:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al obtener buy requests' },
      { status: 500 }
    )
  }
}

