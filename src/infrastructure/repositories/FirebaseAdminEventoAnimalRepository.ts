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
    animal_id: data.animal_id as string,
    tipo_evento: data.tipo_evento as TipoEvento,
    fecha_evento: data.fecha_evento as string,
    motivo_id: data.motivo_id as string | undefined,
    usuario_id: data.usuario_id as string,
    observaciones: data.observaciones as string | undefined,
    madre_id: data.madre_id as string | undefined,
    cria_id: data.cria_id as string | undefined,
    created_at: data.created_at as string | undefined,
    signos_celo: data.signos_celo as string | undefined,
    examen_ovarico: data.examen_ovarico as EventoAnimal['examen_ovarico'],
    tipo_servicio: data.tipo_servicio as 'INSEMINACION' | 'MONTA_NATURAL' | undefined,
    toro_id: data.toro_id as string | undefined,
    pajilla_id: data.pajilla_id as string | undefined,
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
      .get()
    const eventos = snapshot.docs.map((d) => toEvento(d.id, d.data()))
    eventos.sort((a, b) => {
      const cmp = (a.fecha_evento || '').localeCompare(b.fecha_evento || '')
      return orden === 'asc' ? cmp : -cmp
    })
    return eventos
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
      .get()
    const list = snapshot.docs.map((d) => toEvento(d.id, d.data()))
    if (list.length === 0) return null
    list.sort((a, b) => (b.fecha_evento || '').localeCompare(a.fecha_evento || ''))
    return list[0]
  }

  async tieneEventoCierre(animalId: string, userId: string): Promise<boolean> {
    const eventos = await this.getByAnimalId(animalId, userId, 'desc')
    return eventos.some((e) => EVENTOS_CIERRE_VIDA.includes(e.tipo_evento))
  }

  async create(evento: EventoAnimal): Promise<EventoAnimal> {
    const db = getFirebaseAdminDb()
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
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
    if (evento.signos_celo != null) payload.signos_celo = evento.signos_celo
    if (evento.examen_ovarico != null) payload.examen_ovarico = evento.examen_ovarico
    if (evento.tipo_servicio != null) payload.tipo_servicio = evento.tipo_servicio
    if (evento.toro_id != null) payload.toro_id = evento.toro_id
    if (evento.pajilla_id != null) payload.pajilla_id = evento.pajilla_id
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
