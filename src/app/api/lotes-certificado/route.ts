import { NextRequest, NextResponse } from 'next/server'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { getCurrentUserFromRequest } from '@/infrastructure/utils/authServer'

/**
 * GET /api/lotes-certificado — lista lotes del usuario autenticado (premium certificado).
 */
export async function GET(request: NextRequest) {
  try {
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'certificado_cownect')
    if (!validacion.valido) return validacion.response!

    const apiUser = await getCurrentUserFromRequest(request)
    if (!apiUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const lotes = await firestoreAdminServer.listLotesCertificadoByUsuario(apiUser.id)
    return NextResponse.json({ lotes })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/lotes-certificado
 * Body: { nombre: string, rancho_id?: string | null, animal_ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'certificado_cownect')
    if (!validacion.valido) return validacion.response!

    const apiUser = await getCurrentUserFromRequest(request)
    if (!apiUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const rancho_id = body.rancho_id === undefined || body.rancho_id === null ? null : String(body.rancho_id)
    const animal_ids = Array.isArray(body.animal_ids)
      ? body.animal_ids.filter((x: unknown) => typeof x === 'string' && (x as string).length > 0)
      : []

    if (!nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
    }
    if (animal_ids.length === 0) {
      return NextResponse.json(
        { error: 'Agrega al menos un animal al lote (animal_ids)' },
        { status: 400 }
      )
    }

    for (const aid of animal_ids) {
      const animal = await firestoreAdminServer.getAnimal(aid)
      if (!animal || (animal as { usuario_id?: string }).usuario_id !== apiUser.id) {
        return NextResponse.json(
          { error: `El animal ${aid} no existe o no pertenece a tu cuenta` },
          { status: 403 }
        )
      }
    }

    const id = await firestoreAdminServer.createLoteCertificado(apiUser.id, {
      nombre,
      rancho_id,
      animal_ids,
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
