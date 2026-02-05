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
  increment,
  writeBatch,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'

const ANIMALES = 'animales'
const PESOS = 'pesos'
const VACUNACIONES = 'vacunaciones'
const USUARIOS = 'usuarios'
const CALIFICACIONES = 'calificaciones'
const COMPRAS = 'compras'
const REPORTES = 'reportes'

export const firestoreService = {
  async getAnimalesByUser(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES),
      where('usuario_id', '==', usuarioId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
    return list
  },

  async getAnimalesEnVenta() {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES),
      where('en_venta', '==', true)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a: any) => !a.vendido_a)
    list.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
    return list
  },

  async getMisVentas(usuarioId: string) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES),
      where('usuario_id', '==', usuarioId),
      where('en_venta', '==', true)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a: any) => !a.vendido_a)
    list.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
    return list
  },

  async incrementarVista(animalId: string) {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES, animalId)
    await updateDoc(ref, { vistas: increment(1), updated_at: new Date().toISOString() })
  },

  async comprarAnimal(animalId: string, compradorId: string) {
    const db = getFirebaseDb()
    const animalRef = doc(db, ANIMALES, animalId)
    const snap = await getDoc(animalRef)
    if (!snap.exists()) throw new Error('Animal no encontrado')
    const data = snap.data()
    if (data.vendido_a) throw new Error('Este animal ya fue vendido')
    const vendedorId = data.usuario_id
    if (vendedorId === compradorId) throw new Error('No puedes comprar tu propio animal')

    const batch = writeBatch(db)
    batch.update(animalRef, {
      usuario_id: compradorId,
      vendido_a: compradorId,
      en_venta: false,
      updated_at: new Date().toISOString(),
    })
    const compraRef = doc(collection(db, COMPRAS))
    batch.set(compraRef, {
      animal_id: animalId,
      comprador_id: compradorId,
      vendedor_id: vendedorId,
      precio: data.precio_venta,
      created_at: new Date().toISOString(),
    })
    await batch.commit()
  },

  async hasCompradoDe(compradorId: string, vendedorId: string): Promise<boolean> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, COMPRAS),
      where('comprador_id', '==', compradorId),
      where('vendedor_id', '==', vendedorId)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  },

  async getVendedoresComprados(compradorId: string): Promise<Set<string>> {
    const db = getFirebaseDb()
    const q = query(collection(db, COMPRAS), where('comprador_id', '==', compradorId))
    const snapshot = await getDocs(q)
    const vendedores = new Set<string>()
    snapshot.docs.forEach((d) => vendedores.add(d.data().vendedor_id))
    return vendedores
  },

  async addReporte(reportadorId: string, reportadoId: string, motivo: string, detalles?: string, animalId?: string) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    await addDoc(collection(db, REPORTES), {
      reportador_id: reportadorId,
      reportado_id: reportadoId,
      motivo,
      detalles: detalles || '',
      animal_id: animalId || '',
      created_at: now,
    })
  },

  async getUsuario(uid: string) {
    const db = getFirebaseDb()
    const snap = await getDoc(doc(db, USUARIOS, uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async updateUsuario(uid: string, data: Record<string, any>) {
    const db = getFirebaseDb()
    const clean = Object.fromEntries(
      Object.entries({ ...data, updated_at: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    )
    await updateDoc(doc(db, USUARIOS, uid), clean)
  },

  async getCalificacionPromedio(vendedorId: string): Promise<{ promedio: number; total: number }> {
    const db = getFirebaseDb()
    const q = query(collection(db, CALIFICACIONES), where('vendedor_id', '==', vendedorId))
    const snapshot = await getDocs(q)
    const califs = snapshot.docs.map((d) => d.data().estrellas as number).filter((e) => e >= 1 && e <= 5)
    if (califs.length === 0) return { promedio: 0, total: 0 }
    const promedio = califs.reduce((a, b) => a + b, 0) / califs.length
    return { promedio: Math.round(promedio * 10) / 10, total: califs.length }
  },

  async getMiCalificacion(vendedorId: string, calificadorId: string): Promise<number | null> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, CALIFICACIONES),
      where('vendedor_id', '==', vendedorId),
      where('calificador_id', '==', calificadorId)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return snapshot.docs[0].data().estrellas as number
  },

  async addCalificacion(vendedorId: string, calificadorId: string, estrellas: number) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, CALIFICACIONES),
      where('vendedor_id', '==', vendedorId),
      where('calificador_id', '==', calificadorId)
    )
    const snapshot = await getDocs(q)
    const data = { vendedor_id: vendedorId, calificador_id: calificadorId, estrellas, updated_at: new Date().toISOString() }
    if (snapshot.empty) {
      await addDoc(collection(db, CALIFICACIONES), { ...data, created_at: new Date().toISOString() })
    } else {
      await updateDoc(snapshot.docs[0].ref, data)
    }
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
        return { ...p, animales: animal ? { nombre: animal.nombre, numero_identificacion: animal.numero_identificacion } : null }
      })
    )
    return withAnimal
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
    await addDoc(collection(db, PESOS), { ...data, created_at: now, updated_at: now })
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
        return { ...v, animales: animal ? { nombre: animal.nombre, numero_identificacion: animal.numero_identificacion } : null }
      })
    )
    return withAnimal
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
    await addDoc(collection(db, VACUNACIONES), { ...data, created_at: now, updated_at: now })
  },

  async createAnimal(data: any) {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, ANIMALES), { ...data, created_at: now, updated_at: now })
    return ref.id
  },

  async updateAnimal(id: string, data: any) {
    const db = getFirebaseDb()
    await updateDoc(doc(db, ANIMALES, id), { ...data, updated_at: new Date().toISOString() })
  },

  async deleteAnimal(id: string, usuarioId: string) {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== usuarioId) throw new Error('No autorizado')
    await deleteDoc(ref)
  },
}
