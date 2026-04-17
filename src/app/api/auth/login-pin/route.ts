import { NextRequest, NextResponse } from 'next/server'
import {
  obtenerTrabajadorPorPinKiosko,
} from '@/infrastructure/utils/pinKioskoServer'
import { getFirebaseAdminAuth, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

/**
 * Devuelve sesión para trabajador por PIN.
 * Si hay Firebase Admin, entrega customToken (flujo recomendado).
 * Si no hay Admin, devuelve email como fallback legado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pinRaw = body.pin != null ? String(body.pin) : ''
    const pin = pinRaw.replace(/\D/g, '')

    if (pin.length !== 4) {
      return NextResponse.json({ error: 'El PIN debe ser de 4 dígitos' }, { status: 400 })
    }

    const trabajador = await obtenerTrabajadorPorPinKiosko(pin)
    if (trabajador.error === 'ambiguo') {
      return NextResponse.json(
        { error: 'PIN duplicado en el sistema. Contacta al administrador.' },
        { status: 409 }
      )
    }
    if (!trabajador.uid || !trabajador.email) {
      return NextResponse.json({ error: 'PIN no válido o no registrado' }, { status: 401 })
    }

    if (hasAdminCredentials()) {
      const auth = getFirebaseAdminAuth()
      const customToken = await auth.createCustomToken(trabajador.uid, {
        tipo: 'empleado_pin',
      })
      return NextResponse.json({
        customToken,
        email: trabajador.email,
        message: 'Acceso por PIN exitoso',
      })
    }

    return NextResponse.json({
      email: trabajador.email,
      message: 'Usa este correo con la contraseña temporal en el cliente',
    })
  } catch (error: any) {
    console.error('[login-pin]', error)
    return NextResponse.json({ error: 'Error al validar el PIN' }, { status: 500 })
  }
}
