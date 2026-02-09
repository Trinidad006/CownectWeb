import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

const SUBSCRIPTION_AMOUNT = Number(process.env.SUBSCRIPTION_PRICE) || 9.99
const SUBSCRIPTION_CURRENCY = process.env.SUBSCRIPTION_CURRENCY || 'USD'

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
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }
    const value = SUBSCRIPTION_AMOUNT.toFixed(2)
    const token = await getPayPalAccessToken()
    const createRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: SUBSCRIPTION_CURRENCY, value },
            description: 'Suscripción Cownect Premium - Acceso a Marketplace y más',
          },
        ],
      }),
    })
    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.message || 'Error al crear orden' },
        { status: createRes.status }
      )
    }
    const order = await createRes.json()
    const orderID = order.id
    if (!orderID) {
      return NextResponse.json({ error: 'PayPal no devolvió order ID' }, { status: 500 })
    }
    const db = getFirebaseDb()
    await setDoc(doc(db, 'paypal_pending_subscriptions', orderID), {
      userId,
      amount: value,
      currency: SUBSCRIPTION_CURRENCY,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ orderID })
  } catch (error: unknown) {
    console.error('PayPal create-subscription-order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear orden' },
      { status: 500 }
    )
  }
}
