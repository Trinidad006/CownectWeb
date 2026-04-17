import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

type AllowedStatus = 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'pending'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json(
      { error: 'Configuración de Firebase Admin requerida en el servidor.' },
      { status: 503 }
    )
  }

  try {
    const buyRequestId = context.params.id
    const body = await request.json()
    const actorUserId = String(body?.actorUserId || '').trim()
    const status = String(body?.status || '').trim() as AllowedStatus
    const consentimientoCompartirContacto = body?.consentimientoCompartirContacto === true

    if (!buyRequestId || !actorUserId || !status) {
      return NextResponse.json(
        { error: 'buyRequestId, actorUserId y status son requeridos.' },
        { status: 400 }
      )
    }

    const allowed: AllowedStatus[] = ['accepted', 'rejected', 'cancelled', 'completed', 'pending']
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'status inválido.' }, { status: 400 })
    }

    const db = getFirebaseAdminDb()
    const requestRef = db.collection('buy_requests').doc(buyRequestId)
    const requestSnap = await requestRef.get()

    if (!requestSnap.exists) {
      return NextResponse.json({ error: 'Solicitud no encontrada.' }, { status: 404 })
    }

    const reqData = requestSnap.data() as Record<string, any>
    const fromUserId = String(reqData.from_user_id || '')
    const toUserId = String(reqData.to_user_id || '')

    // Regla simple: quien recibe decide aceptar/rechazar.
    if ((status === 'accepted' || status === 'rejected') && actorUserId !== toUserId) {
      return NextResponse.json(
        { error: 'Solo el receptor de la solicitud puede aceptar o rechazar.' },
        { status: 403 }
      )
    }
    // Cancelar solo lo puede hacer quien envió la solicitud.
    if (status === 'cancelled' && actorUserId !== fromUserId) {
      return NextResponse.json(
        { error: 'Solo quien envió la solicitud puede cancelarla.' },
        { status: 403 }
      )
    }

    if (status === 'accepted') {
      if (!consentimientoCompartirContacto) {
        return NextResponse.json(
          { error: 'Debes confirmar el consentimiento para compartir contacto al aceptar.' },
          { status: 400 }
        )
      }

      const ownerSnap = await db.collection('usuarios').doc(toUserId).get()
      if (!ownerSnap.exists) {
        return NextResponse.json({ error: 'No se encontró el perfil del vendedor.' }, { status: 404 })
      }
      const ownerData = ownerSnap.data() as Record<string, any>

      const telefono = String(ownerData.telefono || '').trim()
      const email = String(ownerData.email || '').trim()
      const contactoTipo = telefono ? 'telefono' : email ? 'correo' : null
      const contactoValor = telefono || email || ''

      if (!contactoTipo || !contactoValor) {
        return NextResponse.json(
          { error: 'No tienes teléfono ni correo disponible para compartir.' },
          { status: 400 }
        )
      }

      await requestRef.update({
        estado: 'accepted',
        updated_at: new Date().toISOString(),
        contacto_compartido_tipo: contactoTipo,
        contacto_compartido_valor: contactoValor,
        contacto_compartido_por: toUserId,
        contacto_compartido_para: fromUserId,
        contacto_compartido_en: new Date().toISOString(),
      })

      return NextResponse.json({ ok: true, estado: 'accepted', contactoTipo, contactoValor })
    }

    await requestRef.update({
      estado: status,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, estado: status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo actualizar el estado de la solicitud.' },
      { status: 500 }
    )
  }
}
