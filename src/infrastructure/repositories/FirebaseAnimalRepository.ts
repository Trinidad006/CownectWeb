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
  setDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { AnimalRepository } from '@/domain/repositories/AnimalRepository'
import { Animal } from '@/domain/entities/Animal'

const ANIMALES_COLLECTION = 'animales'
const SIMPLE_ANIMALS_COLLECTION = 'animals'

function toAnimal(id: string, data: any): Animal {
  return {
    id,
    usuario_id: data.usuario_id,
    nombre: data.nombre,
    numero_identificacion: data.numero_identificacion,
    especie: data.especie,
    raza: data.raza,
    fecha_nacimiento: data.fecha_nacimiento,
    sexo: data.sexo,
    estado: data.estado,
    documento_guia_transito: data.documento_guia_transito,
    documento_factura_venta: data.documento_factura_venta,
    documento_certificado_movilizacion: data.documento_certificado_movilizacion,
    documento_certificado_zoosanitario: data.documento_certificado_zoosanitario,
    documento_patente_fierro: data.documento_patente_fierro,
    documentos_completos: data.documentos_completos ?? false,
    estado_documentacion: data.estado_documentacion,
    foto: data.foto,
    madre_id: data.madre_id,
    observaciones: data.observaciones,
    activo: data.activo !== undefined ? data.activo : true, // Por defecto activo
    razon_inactivo: data.razon_inactivo,
    fecha_inactivo: data.fecha_inactivo,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

type SimpleAnimalRecord = {
  siniiga: string
  nombre: string
  raza: string
  estado: string
}

export class FirebaseAnimalRepository implements AnimalRepository {
  private db: Firestore

  constructor(dbOverride?: Firestore) {
    this.db = dbOverride ?? getFirebaseDb()

    if (process.env.NODE_ENV === 'test') {
      try {
        connectFirestoreEmulator(this.db, 'localhost', 8080)
      } catch {
        // ignore if already connected
      }
    }
  }

  async getAll(userId: string): Promise<Animal[]> {
    const q = query(
      collection(this.db, ANIMALES_COLLECTION),
      where('usuario_id', '==', userId)
    )
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((d) => toAnimal(d.id, d.data()))
    list.sort((a, b) => {
      const dateA = a.created_at || ''
      const dateB = b.created_at || ''
      return dateB.localeCompare(dateA)
    })
    return list
  }

  async getById(id: string, userId: string): Promise<Animal | null> {
    const ref = doc(this.db, ANIMALES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    if (data.usuario_id !== userId) return null
    return toAnimal(snap.id, data)
  }

  async create(animal: Animal): Promise<Animal> {
    const now = new Date().toISOString()
    const rawPayload = {
      ...animal,
      activo: animal.activo !== undefined ? animal.activo : true, // Por defecto activo
      created_at: now,
      updated_at: now,
    }
    // Firestore no acepta undefined; quitamos esos campos (ej. madre_id cuando es comprado)
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
    )
    const ref = await addDoc(collection(this.db, ANIMALES_COLLECTION), payload)
    return toAnimal(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, animal: Partial<Animal>): Promise<Animal> {
    const ref = doc(this.db, ANIMALES_COLLECTION, id)
    // Filtrar campos undefined para evitar errores en Firestore
    const cleaned = Object.fromEntries(
      Object.entries({ ...animal, updated_at: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )
    await updateDoc(ref, cleaned)
    const snap = await getDoc(ref)
    return toAnimal(snap.id, snap.data()!)
  }

  async delete(id: string, userId: string): Promise<void> {
    const ref = doc(this.db, ANIMALES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== userId) {
      throw new Error('No autorizado o animal no encontrado')
    }
    await deleteDoc(ref)
  }

  async findByNumeroIdentificacion(
    numeroIdentificacion: string,
    userId: string,
    excludeId?: string
  ): Promise<Animal | null> {
    if (!numeroIdentificacion || !numeroIdentificacion.trim()) {
      return null
    }
    const q = query(
      collection(this.db, ANIMALES_COLLECTION),
      where('usuario_id', '==', userId),
      where('numero_identificacion', '==', numeroIdentificacion.trim())
    )
    const snapshot = await getDocs(q)
    const found = snapshot.docs.find((d) => {
      const animalId = d.id
      return excludeId ? animalId !== excludeId : true
    })
    return found ? toAnimal(found.id, found.data()) : null
  }

  // Métodos simplificados para TC-INV-05 (colección 'animals' en el emulador)

  async save(animal: SimpleAnimalRecord): Promise<void> {
    const ref = doc(this.db, SIMPLE_ANIMALS_COLLECTION, animal.siniiga)
    await setDoc(ref, animal, { merge: false })
  }

  async findById(siniiga: string): Promise<SimpleAnimalRecord | null> {
    const ref = doc(this.db, SIMPLE_ANIMALS_COLLECTION, siniiga)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as SimpleAnimalRecord
  }

  async updateStatus(siniiga: string, estado: string): Promise<void> {
    const ref = doc(this.db, SIMPLE_ANIMALS_COLLECTION, siniiga)
    await updateDoc(ref, { estado })
  }
}
