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
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'

const ANIMALES = 'animales'
const PESOS = 'pesos'
const VACUNACIONES = 'vacunaciones'
const USUARIOS = 'usuarios'
const MARKETPLACE_COMPRAS = 'marketplace_compras'
const MARKETPLACE_COMPRAS_DETALLE = 'marketplace_compras_detalle'
const REVIEWS = 'reviews'
const ADMIN_EMAIL = 'mufasaelrey13@gmail.com'

export const firestoreService = {
  async getAnimalesByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    // Filtrar solo animales activos (activo !== false)
    const animalesActivos = list.filter((animal: any) => animal.activo !== false)
    animalesActivos.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
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

  async getPesosByAnimal(animalId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, PESOS),
      where('animal_id', '==', animalId)
    )
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
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const raw = { ...data, created_at: now, updated_at: now }
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
    await addDoc(collection(db, PESOS), payload)
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

  async getVacunacionesByAnimal(animalId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, VACUNACIONES),
      where('animal_id', '==', animalId)
    )
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

  /** Registra compra (animal o marketplace). Si animalId === 'marketplace' solo se registra el pago. */
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

  /**
   * Registra una compra de Marketplace en dos colecciones:
   * - marketplace_compras (cabecera)
   * - marketplace_compras_detalle (items)
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

  calcularAverageRating(totalStars: number, reviewCount: number): number {
    if (!reviewCount || reviewCount <= 0) return 0
    return totalStars / reviewCount
  },
}
