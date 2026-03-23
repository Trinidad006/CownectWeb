/**
 * Firestore vía Firebase Admin SDK — solo en rutas API (servidor).
 * Omite reglas de seguridad; necesario porque el SDK cliente en Node
 * no lleva el token del usuario logueado en el navegador.
 */
import { getFirebaseAdminDb, hasAdminCredentials } from '@/infrastructure/config/firebaseAdmin'

const ANIMALES = 'animales'
const USUARIOS = 'usuarios'
const ANIMAL_CERTIFICATES = 'animal_certificates'
const COUNTERS = 'counters'

function requireAdminDb() {
  if (!hasAdminCredentials()) {
    throw new Error(
      'Configura en .env.local: FIREBASE_PROJECT_ID (o NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY (cuenta de servicio). Sin esto las rutas API no pueden acceder a Firestore.'
    )
  }
  return getFirebaseAdminDb()
}

export const firestoreAdminServer = {
  async getUsuario(uid: string) {
    const db = requireAdminDb()
    const snap = await db.collection(USUARIOS).doc(uid).get()
    return snap.exists ? { id: snap.id, ...snap.data() } : null
  },

  async getAnimal(animalId: string) {
    const db = requireAdminDb()
    const snap = await db.collection(ANIMALES).doc(animalId).get()
    return snap.exists ? { id: snap.id, ...snap.data() } : null
  },

  async updateAnimal(id: string, data: Record<string, unknown>) {
    const db = requireAdminDb()
    const cleaned = Object.fromEntries(
      Object.entries({ ...data, updated_at: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    )
    await db.collection(ANIMALES).doc(id).update(cleaned)
  },

  async addAnimalCertificate(params: {
    animalId: string
    usuarioId: string
    ownerWallet: string | null
    certificateIdOnchain: string
    metadataUri: string
    txHash?: string | null
  }) {
    const db = requireAdminDb()
    const now = new Date().toISOString()
    const ref = db.collection(ANIMAL_CERTIFICATES).doc()
    const counterRef = db.collection(COUNTERS).doc(ANIMAL_CERTIFICATES)

    let cownectCertificateId = 0
    await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef)
      const prev = counterSnap.exists ? Number(counterSnap.data()?.last_value || 0) : 0
      cownectCertificateId = prev + 1

      tx.set(
        counterRef,
        { last_value: cownectCertificateId, updated_at: now },
        { merge: true }
      )

      const raw = {
        animal_id: params.animalId,
        usuario_id: params.usuarioId,
        owner_wallet: params.ownerWallet,
        certificate_id_onchain: params.certificateIdOnchain,
        cownect_certificate_id: cownectCertificateId,
        metadata_uri: params.metadataUri,
        tx_hash: params.txHash ?? null,
        created_at: now,
      }
      const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
      tx.set(ref, payload)
    })

    return { id: ref.id, cownectCertificateId }
  },

  async getAnimalCertificates(animalId: string) {
    const db = requireAdminDb()
    const snapshot = await db.collection(ANIMAL_CERTIFICATES).where('animal_id', '==', animalId).get()
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return list
  },

  async findAnimalCertificateByTxHash(txHash: string) {
    const db = requireAdminDb()
    const snapshot = await db.collection(ANIMAL_CERTIFICATES).where('tx_hash', '==', txHash).limit(1).get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  },
}
