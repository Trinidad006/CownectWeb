import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { issueCertificateOnchain } from '@/infrastructure/blockchain/animalCertificatesOnchain'
import { getCurrentUserFromRequest } from '@/infrastructure/utils/authServer'

const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL

function offchainLoteId(loteId: string) {
  return `lote:${loteId}`
}

/**
 * POST /api/lote-certificates
 * Body: {
 *   userId: string
 *   loteId: string
 *   auto?: boolean
 *   certificateIdOnchain?, metadataUri?, txHash?, ownerWallet? — modo manual
 * }
 *
 * El certificado on-chain usa `animalIdOffchain = "lote:{loteId}"` en el mismo contrato AnimalCertificates.
 * Todos los animales del lote deben estar revisados por admin (`revisado_para_venta`) y ser del usuario.
 */
export async function POST(request: NextRequest) {
  try {
    const apiUser = await getCurrentUserFromRequest(request)
    if (!apiUser) {
      return NextResponse.json(
        {
          error:
            'No autenticado. Envía Authorization: Bearer <Firebase ID token>.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      userId,
      loteId,
      certificateIdOnchain,
      ownerWallet,
      metadataUri,
      txHash,
      auto,
    } = body || {}

    if (!userId || !loteId) {
      return NextResponse.json({ error: 'userId y loteId son requeridos' }, { status: 400 })
    }
    if (apiUser.id !== userId) {
      return NextResponse.json({ error: 'userId no coincide con la sesión' }, { status: 403 })
    }

    const [usuarioRaw, loteRaw] = await Promise.all([
      firestoreAdminServer.getUsuario(userId),
      firestoreAdminServer.getLoteCertificado(loteId),
    ])

    const usuario: any = usuarioRaw
    const lote: any = loteRaw

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    if (!lote) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }
    if (lote.usuario_id !== userId) {
      return NextResponse.json({ error: 'Este lote no te pertenece' }, { status: 403 })
    }

    const isPremium = usuario.plan === 'premium' || usuario.suscripcion_activa === true
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Solo perfiles premium pueden registrar certificados on‑chain' },
        { status: 403 }
      )
    }

    const animalIds: string[] = Array.isArray(lote.animal_ids) ? lote.animal_ids : []
    if (animalIds.length === 0) {
      return NextResponse.json(
        { error: 'El lote debe incluir al menos un animal' },
        { status: 400 }
      )
    }

    for (const aid of animalIds) {
      const animal: any = await firestoreAdminServer.getAnimal(aid)
      if (!animal || animal.usuario_id !== userId) {
        return NextResponse.json(
          { error: `Animal inválido o no es tuyo: ${aid}` },
          { status: 403 }
        )
      }
      if (animal.activo === false) {
        return NextResponse.json(
          { error: `El animal ${aid} está inactivo; quítalo del lote` },
          { status: 400 }
        )
      }
      if (animal.revisado_para_venta !== true) {
        return NextResponse.json(
          {
            error: `Todos los animales del lote deben estar validados por administración. Falta: ${aid}`,
          },
          { status: 400 }
        )
      }
    }

    const existingByLote: any[] = await firestoreAdminServer.getLoteCertificates(loteId)
    if (existingByLote.length > 0) {
      const existing = existingByLote[0]
      return NextResponse.json(
        {
          error: 'Este lote ya tiene un certificado Cownect registrado',
          id: existing.id,
          cownectCertificateId: existing.cownect_certificate_id ?? null,
          certificateIdOnchain: existing.certificate_id_onchain,
          txHash: existing.tx_hash ?? null,
          qrUrl: existing.tx_hash ? `https://amoy.polygonscan.com/tx/${existing.tx_hash}` : null,
        },
        { status: 409 }
      )
    }

    const chainKey = offchainLoteId(loteId)

    let finalCertificateIdOnchain = certificateIdOnchain as string | undefined
    let finalMetadataUri = metadataUri as string | undefined
    let finalTxHash = txHash as string | undefined

    if (auto) {
      const baseUrl =
        PUBLIC_BASE_URL?.startsWith('http')
          ? PUBLIC_BASE_URL
          : PUBLIC_BASE_URL
            ? `https://${PUBLIC_BASE_URL}`
            : undefined

      finalMetadataUri =
        finalMetadataUri ||
        (baseUrl
          ? `${baseUrl}/api/lotes/${encodeURIComponent(loteId)}/certificate-metadata.json`
          : `https://cownect-web.vercel.app/api/lotes/${encodeURIComponent(loteId)}/certificate-metadata.json`)

      const onchain = await issueCertificateOnchain({
        animalIdOffchain: chainKey,
        metadataUri: finalMetadataUri,
      })

      finalCertificateIdOnchain = onchain.certificateIdOnchain
      finalTxHash = onchain.txHash
    } else {
      if (!certificateIdOnchain || !metadataUri) {
        return NextResponse.json(
          { error: 'certificateIdOnchain y metadataUri son requeridos en modo manual' },
          { status: 400 }
        )
      }
      finalCertificateIdOnchain = certificateIdOnchain
      finalMetadataUri = metadataUri
      finalTxHash = txHash
    }

    if (!finalCertificateIdOnchain || !finalMetadataUri) {
      return NextResponse.json(
        { error: 'No se pudo determinar certificateIdOnchain o metadataUri' },
        { status: 500 }
      )
    }

    if (finalTxHash) {
      const existing: any = await firestoreAdminServer.findLoteCertificateByTxHash(finalTxHash)
      if (existing) {
        if (existing.lote_id !== loteId) {
          return NextResponse.json(
            { error: 'Este código (txHash) ya está registrado para otro lote' },
            { status: 409 }
          )
        }
        await firestoreAdminServer.updateLoteCertificado(loteId, {
          certificate_id_onchain: existing.certificate_id_onchain,
          tx_hash: existing.tx_hash,
          metadata_uri: existing.metadata_uri ?? finalMetadataUri,
        })
        return NextResponse.json(
          {
            id: existing.id,
            certificateIdOnchain: existing.certificate_id_onchain,
            txHash: existing.tx_hash,
            qrUrl: `https://amoy.polygonscan.com/tx/${existing.tx_hash}`,
          },
          { status: 200 }
        )
      }
    }

    const created = await firestoreAdminServer.addLoteCertificate({
      loteId,
      usuarioId: userId,
      ownerWallet: ownerWallet ?? usuario.wallet_address ?? null,
      certificateIdOnchain: finalCertificateIdOnchain,
      metadataUri: finalMetadataUri,
      txHash: finalTxHash ?? null,
    })

    await firestoreAdminServer.updateLoteCertificado(loteId, {
      certificate_id_onchain: finalCertificateIdOnchain,
      tx_hash: finalTxHash ?? null,
      metadata_uri: finalMetadataUri,
    })

    return NextResponse.json(
      {
        id: created.id,
        cownectCertificateId: created.cownectCertificateId,
        certificateIdOnchain: finalCertificateIdOnchain,
        txHash: finalTxHash,
        offchainId: chainKey,
        qrUrl: finalTxHash ? `https://amoy.polygonscan.com/tx/${finalTxHash}` : null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('create lote certificate:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al registrar certificado de lote' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lote-certificates?loteId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get('loteId')

    if (!loteId) {
      return NextResponse.json({ error: 'loteId es requerido' }, { status: 400 })
    }

    const certificados = await firestoreAdminServer.getLoteCertificates(loteId)
    return NextResponse.json({ certificados })
  } catch (error: any) {
    console.error('get lote certificates:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al obtener certificados' },
      { status: 500 }
    )
  }
}
