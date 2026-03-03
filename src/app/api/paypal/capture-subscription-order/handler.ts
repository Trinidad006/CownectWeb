import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

export type WebhookBody = {
  orderID?: string
  subscriptionID?: string
  userId?: string
  status?: string
}

export type CaptureResult = {
  status: number
  body: unknown
}

const STATUS_COMPLETED = 'COMPLETED'

export async function handleCaptureSubscription(
  body: WebhookBody
): Promise<CaptureResult> {
  try {
    const { orderID, subscriptionID, userId, status } = body

    if (!status || status !== STATUS_COMPLETED) {
      return {
        status: 400,
        body: { error: 'Estado de pago inválido. Se requiere status: COMPLETED.' },
      }
    }

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return {
        status: 400,
        body: { error: 'Falta userId en el cuerpo de la petición.' },
      }
    }

    if (!hasAdminCredentials()) {
      return {
        status: 503,
        body: {
          error:
            'Configuración de servidor incompleta. Añade FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local.',
        },
      }
    }

    const db = getFirebaseAdminDb()
    const userRef = db.collection('usuarios').doc(userId.trim())
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      return {
        status: 404,
        body: { error: 'Usuario no encontrado.' },
      }
    }

    const updateData = {
      plan: 'premium' as const,
      suscripcion_activa: true,
      suscripcion_fecha: new Date().toISOString(),
      ...(orderID && { paypal_order_id: orderID }),
      ...(subscriptionID && { paypal_subscription_id: subscriptionID }),
    }

    await userRef.set(updateData, { merge: true })

    return {
      status: 200,
      body: {
        success: true,
        message: 'Suscripción activada correctamente.',
        plan: 'premium' as const,
      },
    }
  } catch (error: unknown) {
    console.error('PayPal capture-subscription-order webhook:', error)
    return {
      status: 500,
      body: {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la suscripción.',
      },
    }
  }
}

