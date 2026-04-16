import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { TareaRepository } from '@/domain/repositories/TareaRepository'
import { Tarea } from '@/domain/entities/Tarea'

const TAREAS_COLLECTION = 'tareas'

function toTarea(id: string, data: any): Tarea {
  return {
    id,
    usuario_id: data.usuario_id,
    rancho_id: data.rancho_id,
    titulo: data.titulo,
    descripcion: data.descripcion,
    asignado_a: data.asignado_a,
    estado: data.estado,
    fecha_vencimiento: data.fecha_vencimiento,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export class FirebaseTareaRepository implements TareaRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()
  }

  async getAllByUser(usuarioId: string): Promise<Tarea[]> {
    const q = query(collection(this.db, TAREAS_COLLECTION), where('usuario_id', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toTarea(d.id, d.data()))
  }

  async getByAsignado(asignadoA: string): Promise<Tarea[]> {
    const q = query(collection(this.db, TAREAS_COLLECTION), where('asignado_a', '==', asignadoA))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toTarea(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<Tarea | null> {
    const ref = doc(this.db, TAREAS_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    // Permitir ver si es el dueño o el asignado
    if (data.usuario_id !== usuarioId && data.asignado_a !== usuarioId) return null
    return toTarea(snap.id, data)
  }

  async create(tarea: Tarea): Promise<Tarea> {
    const now = new Date().toISOString()
    const payload = Object.fromEntries(
      Object.entries({
        ...tarea,
        estado: tarea.estado || 'PENDIENTE',
        created_at: now,
        updated_at: now,
      }).filter(([_, v]) => v !== undefined)
    )
    const ref = await addDoc(collection(this.db, TAREAS_COLLECTION), payload)
    return toTarea(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, data: Partial<Tarea>): Promise<void> {
    const ref = doc(this.db, TAREAS_COLLECTION, id)
    await updateDoc(ref, {
      ...data,
      updated_at: new Date().toISOString(),
    })
  }
}
