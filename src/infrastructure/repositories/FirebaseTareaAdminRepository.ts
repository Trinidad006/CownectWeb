import type { Firestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '@/infrastructure/config/firebaseAdmin'
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

export class FirebaseTareaAdminRepository implements TareaRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseAdminDb()
  }

  async getAllByUser(usuarioId: string): Promise<Tarea[]> {
    const snapshot = await this.db
      .collection(TAREAS_COLLECTION)
      .where('usuario_id', '==', usuarioId)
      .get()
    return snapshot.docs.map((d) => toTarea(d.id, d.data()))
  }

  async getByAsignado(asignadoA: string): Promise<Tarea[]> {
    const snapshot = await this.db
      .collection(TAREAS_COLLECTION)
      .where('asignado_a', '==', asignadoA)
      .get()
    return snapshot.docs.map((d) => toTarea(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<Tarea | null> {
    const snap = await this.db.collection(TAREAS_COLLECTION).doc(id).get()
    if (!snap.exists) return null
    const data = snap.data()!
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
      }).filter(([, v]) => v !== undefined)
    )
    const ref = this.db.collection(TAREAS_COLLECTION).doc()
    await ref.set(payload)
    return toTarea(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, data: Partial<Tarea>): Promise<void> {
    await this.db
      .collection(TAREAS_COLLECTION)
      .doc(id)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
  }
}
