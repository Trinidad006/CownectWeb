import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'
import { firestoreService } from '@/infrastructure/services/firestoreService'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error('Faltan NEXT_PUBLIC_PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env.local')
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('PayPal auth failed')
  const data = await res.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderID } = body
    if (!orderID) {
      return NextResponse.json({ error: 'Falta orderID' }, { status: 400 })
    }
    let animalId: string
    let compradorId: string
    if (hasAdminCredentials()) {
      const db = getFirebaseAdminDb()
      const pendingSnap = await db.collection('paypal_pending_orders').doc(orderID).get()
      if (!pendingSnap.exists) {
        return NextResponse.json({ error: 'Orden no encontrada o ya usada' }, { status: 404 })
      }
      const data = pendingSnap.data()
      animalId = data?.animalId
      compradorId = data?.compradorId
    } else {
      const db = getFirebaseDb()
      const pendingSnap = await getDoc(doc(db, 'paypal_pending_orders', orderID))
      if (!pendingSnap.exists()) {
        return NextResponse.json({ error: 'Orden no encontrada o ya usada' }, { status: 404 })
      }
      const data = pendingSnap.data()
      animalId = data?.animalId
      compradorId = data?.compradorId
    }
    if (!animalId || !compradorId) {
      return NextResponse.json({ error: 'Datos de la orden inválidos' }, { status: 400 })
    }
    const token = await getPayPalAccessToken()
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!captureRes.ok) {
      const errData = await captureRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.message || 'Error al capturar el pago' },
        { status: captureRes.status }
      )
    }
    await firestoreService.comprarAnimal(animalId, compradorId)
    if (hasAdminCredentials()) {
      await getFirebaseAdminDb().collection('paypal_pending_orders').doc(orderID).delete()
    } else {
      await deleteDoc(doc(getFirebaseDb(), 'paypal_pending_orders', orderID))
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PayPal capture-order:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al capturar el pago' },
      { status: 500 }
    )
  }
}
