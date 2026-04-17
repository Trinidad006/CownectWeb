import { NextRequest, NextResponse } from 'next/server'
import {
  obtenerEmailPorPinKiosko,
  validarEmailPinKiosko,
} from '@/infrastructure/utils/pinKioskoServer'

/**
 * Devuelve el email asociado al PIN para que el cliente haga signInWithEmailAndPassword.
 * La sesión de Firebase debe abrirse en el navegador, no en el servidor.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pinRaw = body.pin != null ? String(body.pin) : ''
    const pin = pinRaw.replace(/\D/g, '')
    const emailOpcional = body.email != null ? String(body.email).trim().toLowerCase() : ''

    if (pin.length !== 4) {
      return NextResponse.json({ error: 'El PIN debe ser de 4 dígitos' }, { status: 400 })
    }

    let email: string | null = null

    if (emailOpcional) {
      const ok = await validarEmailPinKiosko(emailOpcional, pin)
      if (!ok) {
        return NextResponse.json({ error: 'PIN o correo incorrectos' }, { status: 401 })
      }
      email = emailOpcional
    } else {
      const res = await obtenerEmailPorPinKiosko(pin)
      if (res.error === 'ambiguo') {
        return NextResponse.json(
          { error: 'PIN duplicado en el sistema. Contacta al administrador.' },
          { status: 409 }
        )
      }
      if (!res.email) {
        return NextResponse.json({ error: 'PIN no válido o no registrado' }, { status: 401 })
      }
      email = res.email
    }

    return NextResponse.json({
      email,
      message: 'Usa este correo con la contraseña temporal en el cliente',
    })
  } catch (error: any) {
    console.error('[login-pin]', error)
    return NextResponse.json({ error: 'Error al validar el PIN' }, { status: 500 })
  }
}
