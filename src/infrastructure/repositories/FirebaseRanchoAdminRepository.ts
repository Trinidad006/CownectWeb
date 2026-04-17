import type { Firestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '@/infrastructure/config/firebaseAdmin'
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

export class FirebaseRanchoAdminRepository implements RanchoRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseAdminDb()
  }

  async getAll(usuarioId: string): Promise<Rancho[]> {
    const snapshot = await this.db
      .collection(RANCHOS_COLLECTION)
      .where('usuario_id', '==', usuarioId)
      .get()
    return snapshot.docs.map((d) => toRancho(d.id, d.data()))
  }

  async getById(id: string, usuarioId: string): Promise<Rancho | null> {
    const snap = await this.db.collection(RANCHOS_COLLECTION).doc(id).get()
    if (!snap.exists) return null
    const data = snap.data()!
    if (data.usuario_id !== usuarioId) return null
    return toRancho(snap.id, data)
  }

  async create(rancho: Rancho): Promise<Rancho> {
    const now = new Date().toISOString()
    const payload = Object.fromEntries(
      Object.entries({
        ...rancho,
        activo: rancho.activo !== undefined ? rancho.activo : true,
        created_at: now,
        updated_at: now,
      }).filter(([, v]) => v !== undefined)
    )
    const ref = this.db.collection(RANCHOS_COLLECTION).doc()
    await ref.set(payload)
    return toRancho(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, rancho: Partial<Rancho>): Promise<Rancho> {
    const ref = this.db.collection(RANCHOS_COLLECTION).doc(id)
    const clean = Object.fromEntries(
      Object.entries({ ...rancho, updated_at: new Date().toISOString() }).filter(([, v]) => v !== undefined)
    )
    await ref.update(clean)
    const snap = await ref.get()
    return toRancho(snap.id, snap.data()!)
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    const ref = this.db.collection(RANCHOS_COLLECTION).doc(id)
    const snap = await ref.get()
    if (!snap.exists || snap.data()?.usuario_id !== usuarioId) {
      throw new Error('No autorizado o rancho no encontrado')
    }
    await ref.delete()
  }
}
