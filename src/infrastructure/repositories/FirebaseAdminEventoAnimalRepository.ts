/**
 * Implementación de EventoAnimalRepository con Firebase Admin SDK.
 * Usado en rutas API (servidor) para leer/escribir eventos sin depender del cliente.
 */

import { getFirebaseAdminDb } from '../config/firebaseAdmin'
import { EventoAnimalRepository } from '@/domain/repositories/EventoAnimalRepository'
import { EventoAnimal, EVENTOS_CIERRE_VIDA, TipoEvento } from '@/domain/entities/EventoAnimal'

const EVENTOS_ANIMAL_COLLECTION = 'eventos_animal'

function toEvento(id: string, data: Record<string, unknown>): EventoAnimal {
  return {
    id,
    animal_id: data.animal_id,
    tipo_evento: data.tipo_evento as TipoEvento,
    fecha_evento: data.fecha_evento,
    motivo_id: data.motivo_id,
    usuario_id: data.usuario_id,
    observaciones: data.observaciones,
    madre_id: data.madre_id,
    cria_id: data.cria_id,
    created_at: data.created_at,
  }
}

export class FirebaseAdminEventoAnimalRepository implements EventoAnimalRepository {
  async getByAnimalId(
    animalId: string,
    userId: string,
    orden: 'asc' | 'desc' = 'desc'
  ): Promise<EventoAnimal[]> {
    const db = getFirebaseAdminDb()
    const snapshot = await db
      .collection(EVENTOS_ANIMAL_COLLECTION)
      .where('animal_id', '==', animalId)
      .where('usuario_id', '==', userId)
      .orderBy('fecha_evento', orden)
      .get()
    return snapshot.docs.map((d) => toEvento(d.id, d.data()))
  }

  async getUltimoPorTipo(
    animalId: string,
    tipo: TipoEvento,
    userId: string
  ): Promise<EventoAnimal | null> {
    const db = getFirebaseAdminDb()
    const snapshot = await db
      .collection(EVENTOS_ANIMAL_COLLECTION)
      .where('animal_id', '==', animalId)
      .where('usuario_id', '==', userId)
      .where('tipo_evento', '==', tipo)
      .orderBy('fecha_evento', 'desc')
      .limit(1)
      .get()
    const doc = snapshot.docs[0]
    return doc ? toEvento(doc.id, doc.data()) : null
  }

  async tieneEventoCierre(animalId: string, userId: string): Promise<boolean> {
    const eventos = await this.getByAnimalId(animalId, userId, 'desc')
    return eventos.some((e) => EVENTOS_CIERRE_VIDA.includes(e.tipo_evento))
  }

  async create(evento: EventoAnimal): Promise<EventoAnimal> {
    const db = getFirebaseAdminDb()
    const now = new Date().toISOString()
    const payload = {
      animal_id: evento.animal_id,
      tipo_evento: evento.tipo_evento,
      fecha_evento: evento.fecha_evento,
      motivo_id: evento.motivo_id ?? null,
      usuario_id: evento.usuario_id,
      observaciones: evento.observaciones ?? null,
      madre_id: evento.madre_id ?? null,
      cria_id: evento.cria_id ?? null,
      created_at: now,
    }
    const ref = await db.collection(EVENTOS_ANIMAL_COLLECTION).add(payload)
    return toEvento(ref.id, { ...payload, id: ref.id })
  }

  async getByUsuarioYFechas(
    userId: string,
    desde: string,
    hasta: string,
    tipoEvento?: TipoEvento
  ): Promise<EventoAnimal[]> {
    const db = getFirebaseAdminDb()
    let query = db
      .collection(EVENTOS_ANIMAL_COLLECTION)
      .where('usuario_id', '==', userId)
      .where('fecha_evento', '>=', desde)
      .where('fecha_evento', '<=', hasta)
      .orderBy('fecha_evento', 'desc')
    const snapshot = await query.get()
    let list = snapshot.docs.map((d) => toEvento(d.id, d.data()))
    if (tipoEvento) {
      list = list.filter((e) => e.tipo_evento === tipoEvento)
    }
    return list
  }
}
