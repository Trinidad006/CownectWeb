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
import { RegistroClinicoRepository } from '@/domain/repositories/RegistroClinicoRepository'
import { RegistroClinico } from '@/domain/entities/RegistroClinico'

const REGISTRO_CLINICO_COLLECTION = 'registro_clinico'

function toRegistroClinico(id: string, data: any): RegistroClinico {
  return {
    id,
    usuario_id: data.usuario_id,
    rancho_id: data.rancho_id,
    animal_id: data.animal_id,
    fecha_registro: data.fecha_registro,
    enfermedad: data.enfermedad,
    diagnostico: data.diagnostico,
    tratamiento: data.tratamiento,
    veterinario: data.veterinario,
    estado: data.estado,
    observaciones: data.observaciones,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export class FirebaseRegistroClinicoRepository implements RegistroClinicoRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()
  }

  async getAllByUser(usuarioId: string): Promise<RegistroClinico[]> {
    const q = query(collection(this.db, REGISTRO_CLINICO_COLLECTION), where('usuario_id', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toRegistroClinico(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<RegistroClinico | null> {
    const ref = doc(this.db, REGISTRO_CLINICO_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    if (data.usuario_id !== usuarioId) return null
    return toRegistroClinico(snap.id, data)
  }

  async create(registro: RegistroClinico): Promise<RegistroClinico> {
    const now = new Date().toISOString()
    const payload = Object.fromEntries(
      Object.entries({
        ...registro,
        created_at: now,
        updated_at: now,
      }).filter(([_, v]) => v !== undefined)
    )
    const ref = await addDoc(collection(this.db, REGISTRO_CLINICO_COLLECTION), payload)
    return toRegistroClinico(ref.id, { ...payload, id: ref.id })
  }
}
