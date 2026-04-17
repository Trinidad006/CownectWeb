import { NextRequest, NextResponse } from 'next/server'
import { firestoreServiceServer } from '@/infrastructure/services/firestoreServiceServer'

/**
 * GET /api/buy-requests/[id]/chat
 * Devuelve los mensajes del chat asociado (chatId = buyRequestId).
 *
 * POST /api/buy-requests/[id]/chat
 * Body: { authorId, texto, attachmentUrls? }
 */
export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const chatId = context.params.id
    const messages = await firestoreServiceServer.getChatMessages(chatId)
    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('get chat messages:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const chatId = context.params.id
    const body = await request.json()
    const { authorId, texto, attachmentUrls } = body || {}

    if (!authorId || !texto) {
      return NextResponse.json(
        { error: 'authorId y texto son requeridos' },
        { status: 400 }
      )
    }

    const messageId = await firestoreServiceServer.addChatMessage({
      chatId,
      authorId,
      texto,
      attachmentUrls,
    })

    return NextResponse.json({ id: messageId }, { status: 201 })
  } catch (error: any) {
    console.error('add chat message:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}

