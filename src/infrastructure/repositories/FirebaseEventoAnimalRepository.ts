import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  limit,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { EventoAnimalRepository } from '@/domain/repositories/EventoAnimalRepository'
import { EventoAnimal, EVENTOS_CIERRE_VIDA, TipoEvento } from '@/domain/entities/EventoAnimal'

const EVENTOS_ANIMAL_COLLECTION = 'eventos_animal'

function toEvento(id: string, data: any): EventoAnimal {
  return {
    id,
    animal_id: data.animal_id,
    tipo_evento: data.tipo_evento,
    fecha_evento: data.fecha_evento,
    motivo_id: data.motivo_id,
    usuario_id: data.usuario_id,
    observaciones: data.observaciones,
    madre_id: data.madre_id,
    cria_id: data.cria_id,
    created_at: data.created_at,
    signos_celo: data.signos_celo,
    examen_ovarico: data.examen_ovarico,
    tipo_servicio: data.tipo_servicio,
    toro_id: data.toro_id,
    pajilla_id: data.pajilla_id,
  }
}

export class FirebaseEventoAnimalRepository implements EventoAnimalRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()
    if (process.env.NODE_ENV === 'test') {
      try {
        connectFirestoreEmulator(this.db, 'localhost', 8080)
      } catch {
        // ignore
      }
    }
  }

  async getByAnimalId(
    animalId: string,
    userId: string,
    orden: 'asc' | 'desc' = 'desc'
  ): Promise<EventoAnimal[]> {
    const q = query(
      collection(this.db, EVENTOS_ANIMAL_COLLECTION),
      where('animal_id', '==', animalId),
      where('usuario_id', '==', userId),
      orderBy('fecha_evento', orden)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => toEvento(d.id, d.data()))
  }

  async getUltimoPorTipo(
    animalId: string,
    tipo: TipoEvento,
    userId: string
  ): Promise<EventoAnimal | null> {
    const q = query(
      collection(this.db, EVENTOS_ANIMAL_COLLECTION),
      where('animal_id', '==', animalId),
      where('usuario_id', '==', userId),
      where('tipo_evento', '==', tipo),
      orderBy('fecha_evento', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)
    const doc = snapshot.docs[0]
    return doc ? toEvento(doc.id, doc.data()) : null
  }

  async tieneEventoCierre(animalId: string, userId: string): Promise<boolean> {
    const eventos = await this.getByAnimalId(animalId, userId, 'desc')
    return eventos.some((e) => EVENTOS_CIERRE_VIDA.includes(e.tipo_evento))
  }

  async create(evento: EventoAnimal): Promise<EventoAnimal> {
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
    const ref = await addDoc(collection(this.db, EVENTOS_ANIMAL_COLLECTION), payload)
    return toEvento(ref.id, { ...payload, id: ref.id })
  }

  async getByUsuarioYFechas(
    userId: string,
    desde: string,
    hasta: string,
    tipoEvento?: TipoEvento
  ): Promise<EventoAnimal[]> {
    let q = query(
      collection(this.db, EVENTOS_ANIMAL_COLLECTION),
      where('usuario_id', '==', userId),
      where('fecha_evento', '>=', desde),
      where('fecha_evento', '<=', hasta),
      orderBy('fecha_evento', 'desc')
    )
    const snapshot = await getDocs(q)
    let list = snapshot.docs.map((d) => toEvento(d.id, d.data()))
    if (tipoEvento) {
      list = list.filter((e) => e.tipo_evento === tipoEvento)
    }
    return list
  }
}
