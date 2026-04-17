import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  orderBy,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import type { Animal } from '@/domain/entities/Animal'

const ANIMALES = 'animales'
const PESOS = 'pesos'
const VACUNACIONES = 'vacunaciones'
const USUARIOS = 'usuarios'
const BUY_REQUESTS = 'buy_requests'
const CHAT_MESSAGES = 'chat_messages'
const DEALS = 'deals'
const ANIMAL_CERTIFICATES = 'animal_certificates'
const MARKETPLACE_COMPRAS = 'marketplace_compras'
const MARKETPLACE_COMPRAS_DETALLE = 'marketplace_compras_detalle'
const REVIEWS = 'reviews'
const PRODUCCION = 'producciones'
const ADMIN_EMAIL = 'mufasaelrey13@gmail.com'

export const firestoreService = {
  async getProduccionByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, PRODUCCION),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async getAnimalesByUser(usuarioId: string): Promise<Animal[]> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Animal[]
    // Filtrar solo animales activos (activo !== false)
    const animalesActivos = list.filter((animal) => animal.activo !== false)
    animalesActivos.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return animalesActivos
  },

  async isAdmin(email: string): Promise<boolean> {
    return email === ADMIN_EMAIL
  },

  async getUsuario(uid: string) {
    const db = getFirebaseDb()
    const snap = await getDoc(doc(db, USUARIOS, uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async getAnimal(animalId: string) {
    const db = getFirebaseDb()
    const snap = await getDoc(doc(db, ANIMALES, animalId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async updateUsuario(uid: string, data: Record<string, any>) {
    const db = getFirebaseDb()
    const clean = Object.fromEntries(
      Object.entries({ ...data, updated_at: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    )
    await updateDoc(doc(db, USUARIOS, uid), clean)
  },

  async getPesosByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, PESOS),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const pesos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    pesos.sort((a: any, b: any) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''))
    const withAnimal = await Promise.all(
      pesos.map(async (p: any) => {
        const animalSnap = await getDoc(doc(db, ANIMALES, p.animal_id))
        const animal = animalSnap.exists() ? animalSnap.data() : null
        // Filtrar pesos de animales inactivos o eliminados
        if (!animal || animal.activo === false) {
          return null
        }
        return { ...p, animales: { nombre: animal.nombre, numero_identificacion: animal.numero_identificacion } }
      })
    )
    // Filtrar los null (animales inactivos)
    return withAnimal.filter((p: any) => p !== null)
  },

  async getPesosByAnimal(animalId: string, usuarioId?: string) {
    const db = getFirebaseDb()
    const col = collection(db, PESOS)
    const q = usuarioId
      ? query(col, where('animal_id', '==', animalId), where('usuario_id', '==', usuarioId))
      : query(col, where('animal_id', '==', animalId))
    const snapshot = await getDocs(q)
    const pesos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    pesos.sort((a: any, b: any) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''))
    return pesos
  },

  async addPeso(data: {
    animal_id: string
    usuario_id: string
    peso: number
    fecha_registro: string
    observaciones?: string
  }) {
    if (!Number.isFinite(data.peso) || data.peso <= 0) {
      throw new Error('El peso debe ser un número mayor que 0.')
    }
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = { ...data, created_at: now, updated_at: now }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    const ref = await addDoc(collection(db, PESOS), payload)
    return ref.id
  },

  async getVacunacionesByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, VACUNACIONES),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const vacs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    vacs.sort((a: any, b: any) => (b.fecha_aplicacion || '').localeCompare(a.fecha_aplicacion || ''))
    const withAnimal = await Promise.all(
      vacs.map(async (v: any) => {
        const animalSnap = await getDoc(doc(db, ANIMALES, v.animal_id))
        const animal = animalSnap.exists() ? animalSnap.data() : null
        // Filtrar vacunaciones de animales inactivos o eliminados
        if (!animal || animal.activo === false) {
          return null
        }
        return { ...v, animales: { nombre: animal.nombre, numero_identificacion: animal.numero_identificacion } }
      })
    )
    // Filtrar los null (animales inactivos)
    return withAnimal.filter((v: any) => v !== null)
  },

  async getVacunacionesByAnimal(animalId: string, usuarioId?: string) {
    const db = getFirebaseDb()
    const col = collection(db, VACUNACIONES)
    const q = usuarioId
      ? query(col, where('animal_id', '==', animalId), where('usuario_id', '==', usuarioId))
      : query(col, where('animal_id', '==', animalId))
    const snapshot = await getDocs(q)
    const vacunaciones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    vacunaciones.sort((a: any, b: any) => (b.fecha_aplicacion || '').localeCompare(a.fecha_aplicacion || ''))
    return vacunaciones
  },

  async addVacunacion(data: {
    animal_id: string
    usuario_id: string
    tipo_vacuna: string
    fecha_aplicacion: string
    proxima_dosis?: string
    observaciones?: string
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = { ...data, created_at: now, updated_at: now }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    await addDoc(collection(db, VACUNACIONES), payload)
  },

  async createAnimal(data: any) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, ANIMALES), { ...data, created_at: now, updated_at: now })
    return ref.id
  },

  async updateAnimal(id: string, data: any) {
    const db = getFirebaseDb()
    // Filtrar campos undefined para evitar errores en Firestore
    const cleaned = Object.fromEntries(
      Object.entries({ ...data, updated_at: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )
    await updateDoc(doc(db, ANIMALES, id), cleaned)
  },

  async deleteAnimal(id: string, usuarioId: string) {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== usuarioId) throw new Error('No autorizado')
    await deleteDoc(ref)
  },

  /** Registra compra (animal o marketplace). Mantener por compatibilidad histórica. */
  async comprarAnimal(animalId: string, compradorId: string) {
    if (animalId === 'marketplace') return
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES, animalId)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('Animal no encontrado')
    await updateDoc(ref, {
      usuario_id: compradorId,
      updated_at: new Date().toISOString(),
    })
  },

  // --- Buy Requests & Chat (ventas entre ganaderos) ---

  async createBuyRequest(params: {
    fromUserId: string
    toUserId: string
    animalIds?: string[]
    mensajeInicial: string
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = {
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      animal_ids: params.animalIds ?? null,
      mensaje_inicial: params.mensajeInicial,
      estado: 'pending',
      deal_id_onchain: null,
      created_at: now,
      updated_at: now,
    }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    const ref = await addDoc(collection(db, BUY_REQUESTS), payload)
    return ref.id
  },

  async getBuyRequestsForUser(usuarioId: string) {
    const db = getFirebaseDb()
    const col = collection(db, BUY_REQUESTS)

    const [receivedSnap, sentSnap] = await Promise.all([
      getDocs(
        query(
          col,
          where('to_user_id', '==', usuarioId),
          orderBy('created_at', 'desc')
        )
      ),
      getDocs(
        query(
          col,
          where('from_user_id', '==', usuarioId),
          orderBy('created_at', 'desc')
        )
      ),
    ])

    const mapDoc = (d: any) => ({ id: d.id, ...d.data() })

    return {
      received: receivedSnap.docs.map(mapDoc),
      sent: sentSnap.docs.map(mapDoc),
    }
  },

  async updateBuyRequestEstado(id: string, estado: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed') {
    const db = getFirebaseDb()
    await updateDoc(doc(db, BUY_REQUESTS, id), {
      estado,
      updated_at: new Date().toISOString(),
    })
  },

  async attachDealToBuyRequest(id: string, dealIdOnchain: string) {
    const db = getFirebaseDb()
    await updateDoc(doc(db, BUY_REQUESTS, id), {
      deal_id_onchain: dealIdOnchain,
      updated_at: new Date().toISOString(),
    })
  },

  async addChatMessage(params: {
    chatId: string
    authorId: string
    texto: string
    attachmentUrls?: string[]
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = {
      chat_id: params.chatId,
      author_id: params.authorId,
      texto: params.texto,
      attachment_urls: params.attachmentUrls ?? null,
      created_at: now,
    }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    const ref = await addDoc(collection(db, CHAT_MESSAGES), payload)
    return ref.id
  },

  async getChatMessages(chatId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, CHAT_MESSAGES),
      where('chat_id', '==', chatId),
      orderBy('created_at', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  // --- Certificados de animales (espejo off‑chain del contrato AnimalCertificates) ---

  async addAnimalCertificate(params: {
    animalId: string
    usuarioId: string
    ownerWallet: string | null
    certificateIdOnchain: string
    metadataUri: string
    txHash?: string | null
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = {
      animal_id: params.animalId,
      usuario_id: params.usuarioId,
      owner_wallet: params.ownerWallet,
      certificate_id_onchain: params.certificateIdOnchain,
      metadata_uri: params.metadataUri,
      tx_hash: params.txHash ?? null,
      created_at: now,
    }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    const ref = await addDoc(collection(db, ANIMAL_CERTIFICATES), payload)
    return ref.id
  },

  async getAnimalCertificates(animalId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMAL_CERTIFICATES),
      where('animal_id', '==', animalId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return list
  },

  async findAnimalCertificateByTxHash(txHash: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMAL_CERTIFICATES),
      where('tx_hash', '==', txHash)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  },

  // --- Deals (espejo off‑chain) ---

  async createDealOffchain(params: {
    dealIdOnchain: string
    buyerId: string
    sellerId: string
    buyRequestId: string
    price: number
    currency: 'USDC' | string
    state: 'pending' | 'paid' | 'completed' | 'cancelled'
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = {
      deal_id_onchain: params.dealIdOnchain,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      buy_request_id: params.buyRequestId,
      price: params.price,
      currency: params.currency,
      state: params.state,
      created_at: now,
      updated_at: now,
    }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    await addDoc(collection(db, DEALS), payload)
  },

  async updateDealState(dealIdOnchain: string, state: 'pending' | 'paid' | 'completed' | 'cancelled') {
    const db = getFirebaseDb()
    const q = query(
      collection(db, DEALS),
      where('deal_id_onchain', '==', dealIdOnchain)
    )
    const snap = await getDocs(q)
    const batchUpdates = snap.docs.map((d) =>
      updateDoc(d.ref, {
        state,
        updated_at: new Date().toISOString(),
      })
    )
    await Promise.all(batchUpdates)
  },

  /**
   * Registra una compra del antiguo Marketplace en dos colecciones.
   * Se mantiene solo para histórico; el nuevo sistema de ventas usa buy_requests + deals.
   */
  async registrarCompraMarketplace(params: {
    compradorId: string
    metodo: 'paypal' | 'debito'
    totalUsd: number
    items: Array<{
      tipo: 'lote' | 'ganado'
      loteId?: string
      ganadoId?: string
      precioUsd: number
      cantidad: number
      vendedorId?: string
      vendedorNombre?: string
    }>
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()

    const headerRef = await addDoc(collection(db, MARKETPLACE_COMPRAS), {
      comprador_id: params.compradorId,
      metodo_pago: params.metodo,
      total_usd: params.totalUsd,
      estado: 'pagado',
      created_at: now,
      updated_at: now,
    })

    const compraId = headerRef.id

    const detallePromises = params.items.map((item) =>
      addDoc(collection(db, MARKETPLACE_COMPRAS_DETALLE), {
        compra_id: compraId,
        tipo: item.tipo,
        lote_id: item.loteId ?? null,
        ganado_id: item.ganadoId ?? null,
        precio_unitario_usd: item.precioUsd,
        cantidad: item.cantidad,
        vendedor_id: item.vendedorId ?? null,
        vendedor_nombre: item.vendedorNombre ?? null,
        created_at: now,
      })
    )

    await Promise.all(detallePromises)

    return compraId
  },

  /**
   * Crea una reseña de vendedor y actualiza sus agregados de rating en una transacción.
   * averageRating se calcula siempre como totalStars / reviewCount en lectura.
   */
  async crearResenaVendedor(params: {
    buyerId: string
    vendorId: string
    orderId: string
    rating: number
    comment: string
  }) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()

    if (!params.rating || params.rating < 1 || params.rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5 estrellas.')
    }

    const reviewId = `${params.orderId}_${params.buyerId}`
    const reviewRef = doc(db, REVIEWS, reviewId)
    const vendorRef = doc(db, USUARIOS, params.vendorId)

    await runTransaction(db, async (transaction) => {
      const existingReview = await transaction.get(reviewRef)
      if (existingReview.exists()) {
        throw new Error('Ya existe una reseña para esta compra.')
      }

      const vendorSnap = await transaction.get(vendorRef)
      const vendorData = vendorSnap.exists() ? vendorSnap.data() || {} : {}
      const totalStars = (vendorData.totalStars as number | undefined) ?? 0
      const reviewCount = (vendorData.reviewCount as number | undefined) ?? 0

      transaction.set(reviewRef, {
        buyerId: params.buyerId,
        vendorId: params.vendorId,
        orderId: params.orderId,
        rating: params.rating,
        comment: params.comment,
        createdAt: now,
      })

      transaction.set(
        vendorRef,
        {
          totalStars: totalStars + params.rating,
          reviewCount: reviewCount + 1,
          updated_at: now,
        },
        { merge: true }
      )
    })
  },

  async getEmpleadosByJefe(jefeId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, USUARIOS),
      where('id_rancho_jefe', '==', jefeId),
      where('rol', '==', 'TRABAJADOR')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getHistorialClinicoByAnimal(animalId: string, usuarioId?: string) {
    const db = getFirebaseDb()
    const col = collection(db, 'registro_clinico')
    const q = usuarioId
      ? query(col, where('animal_id', '==', animalId), where('usuario_id', '==', usuarioId))
      : query(col, where('animal_id', '==', animalId))
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a: any, b: any) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''))
    return list
  },

  async getHistorialClinicoByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'registro_clinico'),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a: any, b: any) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''))
    return list
  },

  async calcularAverageRating(totalStars: number, reviewCount: number): Promise<number> {
    if (!reviewCount || reviewCount <= 0) return 0
    return totalStars / reviewCount
  },

  // ===== MÉTODOS DE RAZAS =====

  async getAllRazas() {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'razas'),
      where('activa', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getRazasByAptitud(aptitud: 'Lechera' | 'Cárnica' | 'Doble Propósito') {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'razas'),
      where('aptitud', '==', aptitud),
      where('activa', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getRazasByEspecie(especie: 'Bos taurus' | 'Bos indicus' | 'Sintética (F1)') {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'razas'),
      where('especie', '==', especie),
      where('activa', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getRazaById(id: string) {
    const db = getFirebaseDb()
    const snap = await getDoc(doc(db, 'razas', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async getRazasByClima(clima: 'Templado' | 'Tropical' | 'Tropical/Adaptado' | 'Variado') {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'razas'),
      where('clima_ideal', '==', clima),
      where('activa', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getRecommendedRazas(
    aptitud?: 'Lechera' | 'Cárnica' | 'Doble Propósito',
    clima?: string
  ) {
    const db = getFirebaseDb()
    let constraints = [where('activa', '==', true)]

    if (aptitud) {
      constraints.push(where('aptitud', '==', aptitud))
    }

    const q = query(collection(db, 'razas'), ...constraints)
    const snapshot = await getDocs(q)
    let razas = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Filtrar por clima si se proporciona
    if (clima) {
      razas = razas.filter(
        (r: any) => r.clima_ideal === clima || r.clima_ideal === 'Variado' || r.clima_ideal === 'Tropical/Adaptado'
      )
    }

    return razas
  },
}
