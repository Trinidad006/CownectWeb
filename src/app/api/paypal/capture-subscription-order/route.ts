import { NextRequest, NextResponse } from 'next/server'
import { handleCaptureSubscription, type WebhookBody } from './handler'

/**
 * TC-PAY-05: Webhook para captura de suscripción PayPal.
 * POST /api/paypal/capture-subscription-order
 * Body: { orderID, subscriptionID, userId, status }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as WebhookBody
  const result = await handleCaptureSubscription(body)
  return NextResponse.json(result.body, { status: result.status })
}

