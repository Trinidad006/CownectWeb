import type { Firestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '@/infrastructure/config/firebaseAdmin'
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

export class FirebaseRegistroClinicoAdminRepository implements RegistroClinicoRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseAdminDb()
  }

  async getAllByUser(usuarioId: string): Promise<RegistroClinico[]> {
    const snapshot = await this.db
      .collection(REGISTRO_CLINICO_COLLECTION)
      .where('usuario_id', '==', usuarioId)
      .get()
    return snapshot.docs.map((d) => toRegistroClinico(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<RegistroClinico | null> {
    const snap = await this.db.collection(REGISTRO_CLINICO_COLLECTION).doc(id).get()
    if (!snap.exists) return null
    const data = snap.data()!
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
      }).filter(([, v]) => v !== undefined)
    )
    const ref = this.db.collection(REGISTRO_CLINICO_COLLECTION).doc()
    await ref.set(payload)
    return toRegistroClinico(ref.id, { ...payload, id: ref.id })
  }
}
