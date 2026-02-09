import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/infrastructure/config/firebase'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env.local')
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
  if (!res.ok) {
    const err = await res.text()
    throw new Error('PayPal auth failed: ' + err)
  }
  const data = await res.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, animalId, compradorId } = body
    if (!amount || amount <= 0 || !currency || !animalId || !compradorId) {
      return NextResponse.json(
        { error: 'Faltan amount, currency, animalId o compradorId' },
        { status: 400 }
      )
    }
    const value = typeof amount === 'number' ? amount.toFixed(2) : String(Number(amount).toFixed(2))
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
            amount: { currency_code: currency, value },
            description: 'Compra de animal - Cownect',
          },
        ],
      }),
    })
    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.message || 'Error al crear orden PayPal', details: errData },
        { status: createRes.status }
      )
    }
    const order = await createRes.json()
    const orderID = order.id
    if (!orderID) {
      return NextResponse.json({ error: 'PayPal no devolvió order ID' }, { status: 500 })
    }
    const db = getFirebaseDb()
    await setDoc(doc(db, 'paypal_pending_orders', orderID), {
      animalId,
      compradorId,
      amount: value,
      currency,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ orderID })
  } catch (error: any) {
    console.error('PayPal create-order:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear orden' },
      { status: 500 }
    )
  }
}
