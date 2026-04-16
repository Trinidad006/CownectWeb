import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { RanchoRepository } from '@/domain/repositories/RanchoRepository'
import { Rancho } from '@/domain/entities/Rancho'

const RANCHOS_COLLECTION = 'ranchos'

function toRancho(id: string, data: any): Rancho {
  return {
    id,
    usuario_id: data.usuario_id,
    nombre: data.nombre,
    pais: data.pais,
    ciudad: data.ciudad,
    direccion: data.direccion,
    descripcion: data.descripcion,
    hectareas: data.hectareas,
    tipos_ganado: data.tipos_ganado,
    certificado_cownect: data.certificado_cownect,
    activo: data.activo !== undefined ? data.activo : true,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export class FirebaseRanchoRepository implements RanchoRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()
  }

  async getAll(usuarioId: string): Promise<Rancho[]> {
    const q = query(collection(this.db, RANCHOS_COLLECTION), where('usuario_id', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toRancho(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<Rancho | null> {
    const ref = getDoc(doc(this.db, RANCHOS_COLLECTION, id))
    const snap = await ref
    if (!snap.exists()) return null
    if (snap.data().usuario_id !== usuarioId) return null
    return toRancho(snap.id, snap.data())
  }

  async create(rancho: Rancho): Promise<Rancho> {
    const now = new Date().toISOString()
    const payload = Object.fromEntries(
      Object.entries({
        ...rancho,
        activo: rancho.activo !== undefined ? rancho.activo : true,
        created_at: now,
        updated_at: now,
      }).filter(([_, v]) => v !== undefined)
    )
    const ref = await addDoc(collection(this.db, RANCHOS_COLLECTION), payload)
    return toRancho(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, rancho: Partial<Rancho>): Promise<Rancho> {
    const ref = doc(this.db, RANCHOS_COLLECTION, id)
    const clean = Object.fromEntries(
      Object.entries({ ...rancho, updated_at: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )
    await updateDoc(ref, clean)
    const snap = await getDoc(ref)
    return toRancho(snap.id, snap.data()!)
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    const ref = doc(this.db, RANCHOS_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== usuarioId) {
      throw new Error('No autorizado o rancho no encontrado')
    }
    await deleteDoc(ref)
  }
}
