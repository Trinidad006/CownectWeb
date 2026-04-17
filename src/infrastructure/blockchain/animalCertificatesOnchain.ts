import { ethers } from 'ethers'

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS

export const ANIMAL_CERTIFICATES_ABI = [
  'event CertificateIssued(uint256 indexed certificateId, address indexed owner, string animalIdOffchain, string metadataUri)',
  'function issueCertificate(string animalIdOffchain, string metadataUri) external returns (uint256)',
] as const

/**
 * Emite certificado en contrato AnimalCertificates.
 * `animalIdOffchain` puede ser ID de animal en Firestore o `lote:{loteId}` para lotes.
 */
export async function issueCertificateOnchain(params: {
  animalIdOffchain: string
  metadataUri: string
}): Promise<{ certificateIdOnchain: string; txHash: string }> {
  if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    throw new Error('Blockchain no configurada correctamente en el servidor')
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY.trim())) {
    const pk = PRIVATE_KEY.trim()
    throw new Error(
      `BLOCKCHAIN_PRIVATE_KEY inválida. Debe ser "0x" + 64 caracteres hex (32 bytes). Recibido longitud=${pk.length}.`
    )
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY.trim(), provider)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ANIMAL_CERTIFICATES_ABI, wallet)

  const tx = await contract.issueCertificate(params.animalIdOffchain, params.metadataUri)
  const receipt = await tx.wait()

  const log = receipt.logs.find(
    (l: { address: string }) => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
  )

  if (!log) {
    throw new Error('No se encontró el evento CertificateIssued en la transacción')
  }

  const parsed = contract.interface.parseLog(log)
  if (!parsed) {
    throw new Error('No se pudo parsear el evento CertificateIssued')
  }
  const certificateIdOnchain = parsed.args.certificateId.toString()

  return {
    certificateIdOnchain,
    txHash: tx.hash as string,
  }
}
