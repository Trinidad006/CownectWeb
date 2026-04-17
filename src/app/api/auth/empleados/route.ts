import { NextRequest, NextResponse } from 'next/server'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'
import { generarPinKioskoUnico } from '@/infrastructure/utils/pinKioskoServer'
import { registrarEmpleadoConAdmin } from '@/infrastructure/utils/registrarEmpleadoAdmin'
import { hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    if (!hasAdminCredentials()) {
      return NextResponse.json(
        {
          error:
            'Firebase Admin no está configurado. En .env.local define una de estas opciones: FIREBASE_SERVICE_ACCOUNT_PATH=./tu-clave.json (archivo en el proyecto), GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_JSON (JSON en una línea), o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID. Reinicia el servidor tras guardar.',
        },
        { status: 503 }
      )
    }

    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'empleados')
    if (!validacion.valido) {
      return validacion.response!
    }

    const body = await request.json()
    const { email, nombre, apellido, telefono } = body

    const dueno = validacion.user as { id: string; email?: string; telefono?: string }
    const emailNorm = String(email ?? '')
      .trim()
      .toLowerCase()
    const duenoEmail = String(dueno.email ?? '')
      .trim()
      .toLowerCase()

    if (!emailNorm || !emailNorm.includes('@')) {
      return NextResponse.json({ error: 'Correo electrónico no válido' }, { status: 400 })
    }

    if (emailNorm === duenoEmail) {
      return NextResponse.json(
        {
          error:
            'El empleado debe tener un correo distinto al tuyo. En Firebase cada cuenta necesita un email único.',
        },
        { status: 400 }
      )
    }

    const telEmp = String(telefono ?? '').replace(/\D/g, '')
    const telDueno = String(dueno.telefono ?? '').replace(/\D/g, '')
    if (telEmp.length > 0 && telDueno.length > 0 && telEmp === telDueno) {
      return NextResponse.json(
        {
          error:
            'El teléfono del empleado no puede ser el mismo que el del dueño. Usa el número del trabajador o déjalo vacío.',
        },
        { status: 400 }
      )
    }

    if (!nombre?.trim() || !apellido?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })
    }

    const pin_kiosko = await generarPinKioskoUnico()
    const password = `Cownect${pin_kiosko}`

    const creado = await registrarEmpleadoConAdmin({
      email: emailNorm,
      password,
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      telefono: telefono ? String(telefono).trim() : undefined,
      id_rancho_jefe: dueno.id,
      pin_kiosko,
    })

    if (creado.error) {
      return NextResponse.json({ error: creado.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        user: {
          id: creado.uid,
          email: emailNorm,
          rol: 'TRABAJADOR',
          pin_kiosko,
        },
        pin_kiosko,
        message: 'Empleado registrado. Guarda el PIN: solo se muestra una vez aquí.',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error registrando empleado'
    console.error('[api/auth/empleados]', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
