import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error('Faltan credenciales de PayPal en .env.local')
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
    let userId: string
    if (hasAdminCredentials()) {
      const db = getFirebaseAdminDb()
      const pendingSnap = await db.collection('paypal_pending_subscriptions').doc(orderID).get()
      if (!pendingSnap.exists) {
        return NextResponse.json({ error: 'Orden no encontrada o ya usada' }, { status: 404 })
      }
      userId = pendingSnap.data()?.userId
    } else {
      const db = getFirebaseDb()
      const pendingRef = doc(db, 'paypal_pending_subscriptions', orderID)
      const pendingSnap = await getDoc(pendingRef)
      if (!pendingSnap.exists()) {
        return NextResponse.json({ error: 'Orden no encontrada o ya usada' }, { status: 404 })
      }
      userId = pendingSnap.data()?.userId
    }
    if (!userId) {
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
    const userData = { plan: 'premium', suscripcion_activa: true, suscripcion_fecha: new Date().toISOString() }
    if (hasAdminCredentials()) {
      const db = getFirebaseAdminDb()
      await db.collection('usuarios').doc(userId).set(userData, { merge: true })
      await db.collection('paypal_pending_subscriptions').doc(orderID).delete()
    } else {
      const db = getFirebaseDb()
      await setDoc(doc(db, 'usuarios', userId), userData, { merge: true })
      await deleteDoc(doc(db, 'paypal_pending_subscriptions', orderID))
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('PayPal capture-subscription-order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al capturar el pago' },
      { status: 500 }
    )
  }
}
