import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'

const ADMIN_REVIEW_PASSWORD = process.env.ADMIN_REVIEW_PASSWORD

/**
 * POST /api/animal-certificates/admin-validate
 * Body: { adminPassword: string, animalId: string }
 *
 * Marca un animal como revisado/validado por administración en Firestore.
 * Después de esto, el usuario premium puede generar certificados on-chain.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { adminPassword?: string; animalId?: string }
    const { adminPassword, animalId } = body || {}

    if (!adminPassword || !animalId) {
      return NextResponse.json({ error: 'adminPassword y animalId son requeridos' }, { status: 400 })
    }

    if (!ADMIN_REVIEW_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_REVIEW_PASSWORD no está configurado' }, { status: 500 })
    }
    if (adminPassword !== ADMIN_REVIEW_PASSWORD) {
      return NextResponse.json({ error: 'adminPassword incorrecta' }, { status: 403 })
    }

    const animal: any = await firestoreAdminServer.getAnimal(animalId)
    if (!animal) return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })

    // Temporalmente: no requerimos documentación completa para marcar revisado
    // (para desbloquear generación/registro de certificados).

    await firestoreAdminServer.updateAnimal(animalId, {
      revisado_para_venta: true,
      en_venta: true,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    console.error('admin-validate:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al marcar el animal como revisado' },
      { status: 500 }
    )
  }
}

