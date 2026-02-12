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
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import { AnimalRepository } from '@/domain/repositories/AnimalRepository'
import { Animal } from '@/domain/entities/Animal'
import { AnimalValidator } from '@/domain/validators/AnimalValidator'

const ANIMALES_COLLECTION = 'animales'

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
    en_venta: data.en_venta ?? false,
    precio_venta: data.precio_venta,
    estado_venta: data.estado_venta || (data.en_venta ? 'en_venta' : undefined),
    documento_guia_transito: data.documento_guia_transito,
    documento_factura_venta: data.documento_factura_venta,
    documento_certificado_movilizacion: data.documento_certificado_movilizacion,
    documento_certificado_zoosanitario: data.documento_certificado_zoosanitario,
    documento_patente_fierro: data.documento_patente_fierro,
    documentos_completos: data.documentos_completos ?? false,
    foto: data.foto,
    madre_id: data.madre_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export class FirebaseAnimalRepository implements AnimalRepository {
  async getAll(userId: string): Promise<Animal[]> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES_COLLECTION),
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
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data = snap.data()
    if (data.usuario_id !== userId) return null
    return toAnimal(snap.id, data)
  }

  async create(animal: Animal): Promise<Animal> {
    const db = getFirebaseDb()
    const now = new Date().toISOString()
    const payload = {
      ...animal,
      created_at: now,
      updated_at: now,
    }
    const ref = await addDoc(collection(db, ANIMALES_COLLECTION), payload)
    return toAnimal(ref.id, { ...payload, id: ref.id })
  }

  async update(id: string, animal: Partial<Animal>): Promise<Animal> {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES_COLLECTION, id)
    const updated = { ...animal, updated_at: new Date().toISOString() }
    await updateDoc(ref, updated)
    const snap = await getDoc(ref)
    return toAnimal(snap.id, snap.data()!)
  }

  async delete(id: string, userId: string): Promise<void> {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== userId) {
      throw new Error('No autorizado o animal no encontrado')
    }
    await deleteDoc(ref)
  }

  async getForSale(): Promise<Animal[]> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES_COLLECTION),
      where('en_venta', '==', true)
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

  async markForSale(id: string, price: number, userId: string): Promise<void> {
    const db = getFirebaseDb()
    const ref = doc(db, ANIMALES_COLLECTION, id)
    const snap = await getDoc(ref)
    if (!snap.exists() || snap.data()?.usuario_id !== userId) {
      throw new Error('No autorizado o animal no encontrado')
    }
    
    const animal = toAnimal(snap.id, snap.data())
    const validacion = AnimalValidator.puedePonerseEnVenta(animal)
    if (!validacion.valido) {
      throw new Error(validacion.error)
    }
    
    await updateDoc(ref, {
      en_venta: true,
      precio_venta: price,
      estado_venta: 'en_venta',
      vistas: 0,
      updated_at: new Date().toISOString(),
    })
  }

  async findByNumeroIdentificacion(numeroIdentificacion: string, userId: string, excludeId?: string): Promise<Animal | null> {
    if (!numeroIdentificacion || !numeroIdentificacion.trim()) {
      return null
    }
    const db = getFirebaseDb()
    const q = query(
      collection(db, ANIMALES_COLLECTION),
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
}
