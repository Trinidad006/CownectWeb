import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'

function publicBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (!u) return ''
  return u.startsWith('http') ? u : `https://${u}`
}

/**
 * GET /api/lotes/:loteId/certificate-metadata.json
 * Metadata pública del lote para el campo `metadataUri` on-chain.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ loteId: string }> }
) {
  try {
    const { loteId } = await context.params
    if (!loteId) {
      return NextResponse.json({ error: 'loteId requerido' }, { status: 400 })
    }

    const lote = (await firestoreAdminServer.getLoteCertificado(loteId)) as Record<string, unknown> | null
    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    const nombre = String(lote.nombre || 'Lote certificado')
    const animalIds = Array.isArray(lote.animal_ids) ? (lote.animal_ids as string[]) : []

    const animalesResumidos: { id: string; arete?: string; nombre?: string; raza?: string }[] = []
    for (const aid of animalIds.slice(0, 50)) {
      const a = (await firestoreAdminServer.getAnimal(aid)) as Record<string, unknown> | null
      if (a) {
        animalesResumidos.push({
          id: aid,
          arete: a.numero_identificacion as string | undefined,
          nombre: a.nombre as string | undefined,
          raza: (a.raza as string) || undefined,
        })
      }
    }

    const base = publicBaseUrl()
    const body: Record<string, unknown> = {
      name: nombre,
      description: `Certificado Cownect — lote con ${animalIds.length} animal(es) registrado(s) en Cownect.`,
      attributes: [
        { trait_type: 'Tipo', value: 'Lote certificado' },
        { trait_type: 'Animales en lote', value: String(animalIds.length) },
        { trait_type: 'ID lote', value: loteId },
      ],
      animales: animalesResumidos,
    }
    if (base) body.external_url = `${base}/dashboard/certificado`

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
