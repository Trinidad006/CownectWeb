import { getFirebaseAdminDb } from '@/infrastructure/config/firebaseAdmin'

const ANIMALES = 'animales'
const USUARIOS = 'usuarios'
const BUY_REQUESTS = 'buy_requests'
const CHAT_MESSAGES = 'chat_messages'

function getUtcMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export const firestoreServiceServer = {
  async getPublicLabelForUser(uid: string): Promise<string> {
    const db = getFirebaseAdminDb()
    const snap = await db.collection(USUARIOS).doc(uid).get()
    if (!snap.exists) return 'Usuario'
    const u = snap.data() as Record<string, unknown>
    const rancho = String(u.rancho || '').trim()
    if (rancho) return rancho
    const nombre = String(u.nombre || '').trim()
    const apellido = String(u.apellido || '').trim()
    const fullName = `${nombre} ${apellido}`.trim()
    return fullName || 'Usuario'
  },

  async getEmpleadosByJefe(jefeId: string) {
    const db = getFirebaseAdminDb()
    const snapshot = await db
      .collection(USUARIOS)
      .where('id_rancho_jefe', '==', jefeId)
      .where('rol', '==', 'TRABAJADOR')
      .get()
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async createBuyRequest(params: {
    fromUserId: string
    toUserId: string
    animalIds?: string[]
    mensajeInicial: string
  }) {
    const db = getFirebaseAdminDb()
    const { startIso, endIso } = getUtcMonthRange()

    // Regla anti-spam: máximo 1 solicitud por mes por comprador -> vendedor.
    const existingSnap = await db.collection(BUY_REQUESTS).where('from_user_id', '==', params.fromUserId).get()
    const alreadySentThisMonth = existingSnap.docs.some((d) => {
      const x = d.data() as Record<string, unknown>
      const toUser = String(x.to_user_id || '')
      const createdAt = String(x.created_at || '')
      return toUser === params.toUserId && createdAt >= startIso && createdAt < endIso
    })

    if (alreadySentThisMonth) {
      throw new Error(
        'Ya enviaste una solicitud a este rancho durante este mes. Espera al próximo mes o continúa la conversación actual.'
      )
    }

    const now = new Date().toISOString()
    const ref = db.collection(BUY_REQUESTS).doc()
    await ref.set({
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      animal_ids: params.animalIds ?? null,
      mensaje_inicial: params.mensajeInicial,
      estado: 'pending',
      deal_id_onchain: null,
      created_at: now,
      updated_at: now,
    })
    return ref.id
  },

  async getBuyRequestsForUser(usuarioId: string) {
    const db = getFirebaseAdminDb()
    const [receivedSnap, sentSnap] = await Promise.all([
      db.collection(BUY_REQUESTS).where('to_user_id', '==', usuarioId).get(),
      db.collection(BUY_REQUESTS).where('from_user_id', '==', usuarioId).get(),
    ])

    const mapDoc = (d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() })
    const sortByCreatedAtDesc = (a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || '')

    const receivedRaw = receivedSnap.docs.map(mapDoc).sort(sortByCreatedAtDesc)
    const sentRaw = sentSnap.docs.map(mapDoc).sort(sortByCreatedAtDesc)

    const uniqueUserIds = new Set<string>()
    ;[...receivedRaw, ...sentRaw].forEach((r: any) => {
      if (r.from_user_id) uniqueUserIds.add(String(r.from_user_id))
      if (r.to_user_id) uniqueUserIds.add(String(r.to_user_id))
    })

    const labelMap = new Map<string, string>()
    await Promise.all(
      Array.from(uniqueUserIds).map(async (uid) => {
        const label = await this.getPublicLabelForUser(uid)
        labelMap.set(uid, label)
      })
    )

    const received = receivedRaw.map((r: any) => ({
      ...r,
      from_user_label: labelMap.get(String(r.from_user_id)) || 'Usuario',
      to_user_label: labelMap.get(String(r.to_user_id)) || 'Usuario',
    }))
    const sent = sentRaw.map((r: any) => ({
      ...r,
      from_user_label: labelMap.get(String(r.from_user_id)) || 'Usuario',
      to_user_label: labelMap.get(String(r.to_user_id)) || 'Usuario',
    }))
    return { received, sent }
  },

  async addChatMessage(params: {
    chatId: string
    authorId: string
    texto: string
    attachmentUrls?: string[]
  }) {
    const db = getFirebaseAdminDb()
    const now = new Date().toISOString()
    const ref = db.collection(CHAT_MESSAGES).doc()
    await ref.set({
      chat_id: params.chatId,
      author_id: params.authorId,
      texto: params.texto,
      attachment_urls: params.attachmentUrls ?? null,
      created_at: now,
    })
    return ref.id
  },

  async getChatMessages(chatId: string) {
    const db = getFirebaseAdminDb()
    const snapshot = await db.collection(CHAT_MESSAGES).where('chat_id', '==', chatId).get()
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a: any, b: any) => (a.created_at || '').localeCompare(b.created_at || ''))
    return list
  },

  async comprarAnimal(animalId: string, compradorId: string) {
    const db = getFirebaseAdminDb()
    const ref = db.collection(ANIMALES).doc(animalId)
    const snap = await ref.get()
    if (!snap.exists) throw new Error('Animal no encontrado')
    await ref.update({
      usuario_id: compradorId,
      updated_at: new Date().toISOString(),
    })
  },
}
