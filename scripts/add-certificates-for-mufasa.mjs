/**
 * Script de ejemplo: crea certificados off‑chain para algunos animales
 * del usuario mufasaelrey13@gmail.com, asumiendo que YA existen
 * certificados on‑chain en el contrato AnimalCertificates.
 *
 * Uso:
 *   node scripts/add-certificates-for-mufasa.mjs
 *
 * Requiere en .env.local:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Y además que en la colección 'usuarios' exista un documento con
 * email === 'mufasaelrey13@gmail.com' y animales asociados en
 * la colección 'animales'.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local')
    const env = readFileSync(envPath, 'utf8')
    env.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    })
  } catch (e) {
    console.error('No se encontró .env.local')
    process.exit(1)
  }
}

async function main() {
  loadEnv()
  const admin = await import('firebase-admin')

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local')
    process.exit(1)
  }

  if (admin.apps?.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  const db = admin.firestore()
  const email = 'mufasaelrey13@gmail.com'

  // 1) Buscar usuario por email
  const usuariosSnap = await db.collection('usuarios').where('email', '==', email).limit(1).get()
  if (usuariosSnap.empty) {
    console.error(`No se encontró usuario con email ${email}`)
    process.exit(1)
  }

  const userDoc = usuariosSnap.docs[0]
  const userId = userDoc.id
  const userData = userDoc.data() || {}
  const wallet = userData.wallet_address || null

  console.log(`Usuario encontrado: ${userId} (wallet: ${wallet || 'sin wallet configurada'})`)

  // 2) Obtener algunos animales activos del usuario
  const animalesSnap = await db
    .collection('animales')
    .where('usuario_id', '==', userId)
    .where('activo', '!=', false)
    .limit(3)
    .get()

  if (animalesSnap.empty) {
    console.error('El usuario no tiene animales activos para certificar.')
    process.exit(1)
  }

  const now = new Date().toISOString()
  let idx = 0

  for (const doc of animalesSnap.docs) {
    idx += 1
    const animalId = doc.id
    const animal = doc.data() || {}
    const nombre = animal.nombre || animal.numero_identificacion || `ANIMAL_${animalId}`

    // IMPORTANTE:
    // Aquí se usan IDs de certificado "demo-1", "demo-2", ...; en un entorno
    // real deberías reemplazarlos por certificateId devueltos por el
    // contrato AnimalCertificates una vez minada la transacción.
    const certificateIdOnchain = `demo-${idx}`
    const metadataUri = `ipfs://demo-cert-${idx}`

    console.log(
      `Creando certificado off‑chain para animal ${animalId} (${nombre}) con certificate_id_onchain=${certificateIdOnchain}`
    )

    await db.collection('animal_certificates').add({
      animal_id: animalId,
      usuario_id: userId,
      owner_wallet: wallet,
      certificate_id_onchain: certificateIdOnchain,
      metadata_uri: metadataUri,
      tx_hash: null,
      created_at: now,
    })
  }

  console.log('Certificados demo creados correctamente para mufasa.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

