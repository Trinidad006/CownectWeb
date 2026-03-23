import { NextRequest, NextResponse } from 'next/server'
import { firestoreAdminServer } from '@/infrastructure/services/firestoreAdminServer'
import { ethers } from 'ethers'

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS
const ADMIN_REVIEW_PASSWORD = process.env.ADMIN_REVIEW_PASSWORD

const ANIMAL_CERTIFICATES_ABI = [
  'event CertificateIssued(uint256 indexed certificateId, address indexed owner, string animalIdOffchain, string metadataUri)',
] as const

async function extractCertificateIssuedFromTx(params: {
  txHash: string
  animalId: string
}) {
  if (!RPC_URL || !CONTRACT_ADDRESS) {
    throw new Error('Blockchain no configurada correctamente en el servidor')
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const receipt = await provider.getTransactionReceipt(params.txHash)
  if (!receipt) return null

  const iface = new ethers.Interface(ANIMAL_CERTIFICATES_ABI)

  for (const log of receipt.logs) {
    if (!log.address || log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue

    try {
      const parsed = iface.parseLog(log)
      if (parsed?.name !== 'CertificateIssued') continue

      const args = parsed.args as any
      const animalIdOffchain = String(args.animalIdOffchain)
      if (animalIdOffchain !== params.animalId) continue

      return {
        certificateIdOnchain: args.certificateId.toString(),
        ownerWallet: String(args.owner),
        metadataUri: String(args.metadataUri),
        txHash: params.txHash,
      }
    } catch {
      // si no es parseable con el ABI, seguimos con el resto de logs
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      animalId?: string
      txHash?: string
      adminPassword?: string
    }
    const { animalId, txHash, adminPassword } = body || {}

    if (!animalId || !txHash || !adminPassword) {
      return NextResponse.json({ error: 'animalId, txHash y adminPassword son requeridos' }, { status: 400 })
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash.trim())) {
      return NextResponse.json({ error: 'txHash inválido' }, { status: 400 })
    }

    if (!ADMIN_REVIEW_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_REVIEW_PASSWORD no está configurado en el servidor' }, { status: 500 })
    }

    if (adminPassword !== ADMIN_REVIEW_PASSWORD) {
      return NextResponse.json({ error: 'adminPassword incorrecta' }, { status: 403 })
    }

    const animal = await firestoreAdminServer.getAnimal(animalId)
    const animalAny: any = animal
    if (!animalAny) return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 })

    // Solo un certificado por animal.
    const existingByAnimal: any[] = await firestoreAdminServer.getAnimalCertificates(animalId)
    if (existingByAnimal.length > 0) {
      const existingAnimalCert = existingByAnimal[0]
      if (existingAnimalCert.tx_hash === txHash.trim()) {
        return NextResponse.json(
          {
            id: existingAnimalCert.id,
            cownectCertificateId: existingAnimalCert.cownect_certificate_id ?? null,
            certificateIdOnchain: existingAnimalCert.certificate_id_onchain,
            txHash: existingAnimalCert.tx_hash ?? null,
            qrUrl: existingAnimalCert.tx_hash
              ? `https://amoy.polygonscan.com/tx/${existingAnimalCert.tx_hash}`
              : null,
          },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { error: 'Este animal ya tiene un certificado Cownect registrado' },
        { status: 409 }
      )
    }

    // Temporalmente: no requerimos documentación completa para marcar revisado
    // (para desbloquear generación/registro de certificados).

    // 1) Validar txHash en blockchain y extraer el certificadoIssued correspondiente
    const certificate = await extractCertificateIssuedFromTx({ txHash: txHash.trim(), animalId })
    if (!certificate) {
      return NextResponse.json(
        { error: 'Ese txHash no corresponde al animal o no contiene el evento CertificateIssued' },
        { status: 400 }
      )
    }

    // 2) Unicidad global del código (txHash)
    const existing: any = await firestoreAdminServer.findAnimalCertificateByTxHash(txHash.trim())
    if (existing) {
      if (existing.animal_id !== animalId) {
        return NextResponse.json(
          { error: 'Este código (txHash) ya está registrado para otro animal' },
          { status: 409 }
        )
      }
      // mismo animal => ya está; igual marcamos en BD como revisado por si acaso
      await firestoreAdminServer.updateAnimal(animalId, {
        en_venta: true,
        revisado_para_venta: true,
      })

      return NextResponse.json(
        { id: existing.id, certificateIdOnchain: existing.certificate_id_onchain, txHash: existing.tx_hash },
        { status: 200 }
      )
    }

    // 3) Guardar espejo off‑chain vinculado al animal
    const created = await firestoreAdminServer.addAnimalCertificate({
      animalId,
      usuarioId: animalAny.usuario_id,
      ownerWallet: certificate.ownerWallet,
      certificateIdOnchain: certificate.certificateIdOnchain,
      metadataUri: certificate.metadataUri,
      txHash: certificate.txHash,
    })

    // 4) Marcar animal como revisado / disponible
    await firestoreAdminServer.updateAnimal(animalId, {
      en_venta: true,
      revisado_para_venta: true,
    })

    return NextResponse.json(
      {
        id: created.id,
        cownectCertificateId: created.cownectCertificateId,
        certificateIdOnchain: certificate.certificateIdOnchain,
        txHash: certificate.txHash,
        qrUrl: `https://amoy.polygonscan.com/tx/${certificate.txHash}`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('mark-reviewed:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al marcar el animal como revisado' },
      { status: 500 }
    )
  }
}

