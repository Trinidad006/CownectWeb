import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { ProduccionRepository } from '@/domain/repositories/ProduccionRepository'
import { Produccion } from '@/domain/entities/Produccion'

const PRODUCCIONES_COLLECTION = 'producciones'

function toProduccion(id: string, data: any): Produccion {
  return {
    id,
    usuario_id: data.usuario_id,
    rancho_id: data.rancho_id,
    animal_id: data.animal_id,
    tipo: data.tipo,
    cantidad: data.cantidad,
    unidad: data.unidad,
    fecha_registro: data.fecha_registro,
    observaciones: data.observaciones,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export class FirebaseProduccionRepository implements ProduccionRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()
  }

  async getAllByUser(usuarioId: string): Promise<Produccion[]> {
    const q = query(collection(this.db, PRODUCCIONES_COLLECTION), where('usuario_id', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toProduccion(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<Produccion | null> {
    const ref = doc(this.db, PRODUCCIONES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    if (data.usuario_id !== usuarioId) return null
    return toProduccion(snap.id, data)
  }

  async create(produccion: Produccion): Promise<Produccion> {
    const now = new Date().toISOString()
    const payload = Object.fromEntries(
      Object.entries({
        ...produccion,
        created_at: now,
        updated_at: now,
      }).filter(([_, v]) => v !== undefined)
    )
    const ref = await addDoc(collection(this.db, PRODUCCIONES_COLLECTION), payload)
    return toProduccion(ref.id, { ...payload, id: ref.id })
  }
}
