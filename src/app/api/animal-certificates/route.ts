import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { issueCertificateOnchain } from '@/infrastructure/blockchain/animalCertificatesOnchain'

// URL base pública para construir links de trazabilidad / QR
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL

/**
 * Certificados on‑chain para animales.
 *
 * POST /api/animal-certificates
 * Body: {
 *   userId: string          // uid de Firebase del ganadero (dueño del animal)
 *   animalId: string        // ID del animal en la colección 'animales'
 *   // Modo manual (ya existe en blockchain):
 *   certificateIdOnchain?: string // ID del certificado en el contrato AnimalCertificates
 *   ownerWallet?: string     // wallet que figura como owner en el contrato
 *   metadataUri?: string     // metadata JSON (IPFS, etc.) usado al emitir el certificado
 *   txHash?: string          // hash de la transacción on‑chain (opcional)
 *
 *   // Modo automático (nuevo):
 *   auto?: boolean           // si true, el backend emite el certificado en blockchain
 * }
 *
 * Solo se permite registrar certificados para usuarios con plan premium
 * (plan === 'premium' o suscripcion_activa === true) y sobre animales
 * que realmente le pertenecen (animal.usuario_id === userId).
 *
 * En modo manual este endpoint NO crea el certificado en la blockchain;
 * asume que ya fue emitido en el contrato AnimalCertificates y aquí solo se
 * guarda el espejo off‑chain vinculado al animal.
 *
 * En modo automático (`auto: true`) el backend emite el certificado en
 * el contrato AnimalCertificates (Polygon Amoy) y luego guarda el espejo
 * off‑chain con el `certificateIdOnchain` y el `txHash` como código único.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      animalId,
      certificateIdOnchain,
      ownerWallet,
      metadataUri,
      txHash,
      auto,
    } = body || {}

    if (!userId || !animalId) {
      return NextResponse.json(
        { error: 'userId y animalId son requeridos' },
        { status: 400 }
      )
    }

    const [usuarioRaw, animalRaw] = await Promise.all([
      firestoreAdminServer.getUsuario(userId),
      firestoreAdminServer.getAnimal(animalId),
    ])

    const usuario: any = usuarioRaw
    const animal: any = animalRaw

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    if (!animal) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })
    }
    if (animal.usuario_id !== userId) {
      return NextResponse.json({ error: 'No puedes certificar animales de otro usuario' }, { status: 403 })
    }

    const isPremium = usuario.plan === 'premium' || usuario.suscripcion_activa === true
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Solo perfiles premium pueden registrar certificados on‑chain' },
        { status: 403 }
      )
    }

    // Reglas de negocio: el animal debe estar validado por administración.
    // Esto evita que el usuario marque/revise por su cuenta.
    const validadoPorAdmin = animal.revisado_para_venta === true
    if (!validadoPorAdmin) {
      return NextResponse.json(
        { error: 'El animal debe estar validado/revisado por administración antes de generar certificados' },
        { status: 400 }
      )
    }

    // Solo permitimos un certificado por animal.
    const existingByAnimal: any[] = await firestoreAdminServer.getAnimalCertificates(animalId)
    if (existingByAnimal.length > 0) {
      const existing = existingByAnimal[0]
      return NextResponse.json(
        {
          error: 'Este animal ya tiene un certificado Cownect registrado',
          id: existing.id,
          cownectCertificateId: existing.cownect_certificate_id ?? null,
          certificateIdOnchain: existing.certificate_id_onchain,
          txHash: existing.tx_hash ?? null,
          qrUrl: existing.tx_hash ? `https://amoy.polygonscan.com/tx/${existing.tx_hash}` : null,
        },
        { status: 409 }
      )
    }

    let finalCertificateIdOnchain = certificateIdOnchain as string | undefined
    let finalMetadataUri = metadataUri as string | undefined
    let finalTxHash = txHash as string | undefined

    // --- Modo automático: emitir en blockchain desde el backend ---
    if (auto) {
      const baseUrl =
        PUBLIC_BASE_URL?.startsWith('http')
          ? PUBLIC_BASE_URL
          : PUBLIC_BASE_URL
          ? `https://${PUBLIC_BASE_URL}`
          : undefined

      // Metadata mínima: endpoint público que describe al animal/certificado
      finalMetadataUri =
        finalMetadataUri ||
        (baseUrl
          ? `${baseUrl}/api/animals/${encodeURIComponent(animalId)}/certificate-metadata.json`
          : `https://cownect-web.vercel.app/api/animals/${encodeURIComponent(animalId)}/certificate-metadata.json`)

      const onchain = await issueCertificateOnchain({
        animalIdOffchain: animalId,
        metadataUri: finalMetadataUri,
      })

      finalCertificateIdOnchain = onchain.certificateIdOnchain
      finalTxHash = onchain.txHash
    } else {
      // --- Modo manual (compatibilidad con flujo existente) ---
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

    // --- Unicidad global del código (txHash) ---
    if (finalTxHash) {
      const existing: any = await firestoreAdminServer.findAnimalCertificateByTxHash(finalTxHash)
      if (existing) {
        // Si intentan reutilizar el mismo código para otro animal, lo rechazamos.
        if (existing.animal_id !== animalId) {
          return NextResponse.json(
            { error: 'Este código (txHash) ya está registrado para otro animal' },
            { status: 409 }
          )
        }
        // Mismo animal => aseguramos disponibilidad para venta.
        await firestoreAdminServer.updateAnimal(animalId, {
          en_venta: true,
          revisado_para_venta: true,
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

    const created = await firestoreAdminServer.addAnimalCertificate({
      animalId,
      usuarioId: userId,
      ownerWallet: ownerWallet ?? usuario.wallet_address ?? null,
      certificateIdOnchain: finalCertificateIdOnchain,
      metadataUri: finalMetadataUri,
      txHash: finalTxHash ?? null,
    })

    // --- Marcar animal como revisado / disponible para venta ---
    // (En este proyecto el marketplace se apoya en `en_venta`.)
    await firestoreAdminServer.updateAnimal(animalId, {
      en_venta: true,
      revisado_para_venta: true,
    })

    return NextResponse.json(
      {
        id: created.id,
        cownectCertificateId: created.cownectCertificateId,
        certificateIdOnchain: finalCertificateIdOnchain,
        txHash: finalTxHash,
        qrUrl: finalTxHash ? `https://amoy.polygonscan.com/tx/${finalTxHash}` : null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('create animal certificate:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al registrar certificado de animal' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/animal-certificates?animalId=...
 * Devuelve los certificados registrados para un animal concreto.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const animalId = searchParams.get('animalId')

    if (!animalId) {
      return NextResponse.json({ error: 'animalId es requerido' }, { status: 400 })
    }

    const certificados = await firestoreAdminServer.getAnimalCertificates(animalId)
    return NextResponse.json({ certificados })
  } catch (error: any) {
    console.error('get animal certificates:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al obtener certificados' },
      { status: 500 }
    )
  }
}

