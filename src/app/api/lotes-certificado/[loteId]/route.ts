import { NextRequest, NextResponse } from 'next/server'
import { PremiumAPIMiddleware } from '@/infrastructure/utils/PremiumAPIMiddleware'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { getCurrentUserFromRequest } from '@/infrastructure/utils/authServer'

/**
 * PATCH /api/lotes-certificado/:loteId
 * Body: { nombre?: string, animal_ids?: string[] }
 * No permite editar si el lote ya tiene certificado on-chain registrado.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ loteId: string }> }
) {
  try {
    const validacion = await PremiumAPIMiddleware.validarAccesoPremium(request, 'certificado_cownect')
    if (!validacion.valido) return validacion.response!

    const apiUser = await getCurrentUserFromRequest(request)
    if (!apiUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { loteId } = await context.params
    if (!loteId) {
      return NextResponse.json({ error: 'loteId requerido' }, { status: 400 })
    }

    const lote = (await firestoreAdminServer.getLoteCertificado(loteId)) as Record<string, unknown> | null
    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }
    if (lote.usuario_id !== apiUser.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (lote.tx_hash || lote.certificate_id_onchain) {
      return NextResponse.json(
        { error: 'Este lote ya tiene certificado emitido; no se puede editar' },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const patch: Record<string, unknown> = {}

    if (typeof body.nombre === 'string' && body.nombre.trim()) {
      patch.nombre = body.nombre.trim()
    }

    if (Array.isArray(body.animal_ids)) {
      const animal_ids = body.animal_ids.filter(
        (x: unknown) => typeof x === 'string' && (x as string).length > 0
      ) as string[]
      if (animal_ids.length === 0) {
        return NextResponse.json({ error: 'animal_ids debe incluir al menos un id' }, { status: 400 })
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
      patch.animal_ids = animal_ids
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Sin cambios (nombre o animal_ids)' }, { status: 400 })
    }

    await firestoreAdminServer.updateLoteCertificado(loteId, patch)
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
