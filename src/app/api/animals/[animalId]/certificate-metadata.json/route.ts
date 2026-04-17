import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'

function publicBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (!u) return ''
  return u.startsWith('http') ? u : `https://${u}`
}

/**
 * GET /api/animals/:animalId/certificate-metadata.json
 * JSON público para `metadataUri` on-chain (exploradores / wallets).
 * Sin auth de usuario: solo datos no sensibles del animal.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ animalId: string }> }
) {
  try {
    const { animalId } = await context.params
    if (!animalId) {
      return NextResponse.json({ error: 'animalId requerido' }, { status: 400 })
    }

    const animal = (await firestoreAdminServer.getAnimal(animalId)) as Record<string, unknown> | null
    if (!animal) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })
    }

    const numero = String(animal.numero_identificacion || animalId)
    const nombre = (animal.nombre as string) || `Animal ${numero}`
    const parts = [
      'Certificado Cownect — trazabilidad del animal.',
      animal.raza ? `Raza: ${animal.raza}.` : '',
      animal.especie ? `Especie: ${animal.especie}.` : '',
    ]
    const description = parts.filter(Boolean).join(' ')

    const base = publicBaseUrl()
    const image =
      typeof animal.foto === 'string' && animal.foto.trim() !== '' ? (animal.foto as string) : undefined

    const body: Record<string, unknown> = {
      name: `${nombre} (${numero})`,
      description,
      attributes: [
        { trait_type: 'Arete / ID', value: numero },
        ...(animal.raza ? [{ trait_type: 'Raza', value: animal.raza as string }] : []),
        ...(animal.especie ? [{ trait_type: 'Especie', value: animal.especie as string }] : []),
        ...(typeof animal.origen === 'string'
          ? [{ trait_type: 'Origen', value: animal.origen as string }]
          : []),
        {
          trait_type: 'Revisado para venta',
          value: animal.revisado_para_venta === true ? 'Sí' : 'No',
        },
      ],
    }
    if (image) body.image = image
    if (base) body.external_url = `${base}/dashboard/gestion`

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
